import {
  ChatCompletionRequest,
  ConnectionTestResult,
  ModelInfo,
  ProviderCapability,
} from '@/types';
import { ProviderAdapter } from './base';
import { logger } from '../logger';

export class AnthropicAdapter implements ProviderAdapter {
  readonly id = 'anthropic' as const;
  readonly name = 'Anthropic';
  readonly capabilities: ProviderCapability = {
    supportsStreaming: true,
    supportsTopK: true,
    supportsTopP: true,
    supportsTemperature: true,
    supportsFrequencyPenalty: false,
    supportsPresencePenalty: false,
    supportsSeed: false,
    supportsStopSequences: true,
    supportsCustomEndpoint: false,
    supportsModelListing: true,
  };

  private baseUrl = 'https://api.anthropic.com/v1';

  async validateCredentials(apiKey: string): Promise<ConnectionTestResult> {
    try {
      logger.info('Testing Anthropic connection');
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        logger.warn('Anthropic credential validation failed', { statusCode: res.status });
        return { success: false, message: msg, error: msg };
      }

      const data = await res.json();
      const count = Array.isArray(data.data) ? data.data.length : 0;
      logger.info('Anthropic connection test successful', { modelsFound: count });
      return { success: true, message: `Connected successfully. ${count} models available.`, modelsFound: count };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      logger.error('Anthropic connection test exception', { error: errorMsg });
      return { success: false, message: errorMsg, error: errorMsg };
    }
  }

  async listModels(apiKey: string): Promise<ModelInfo[]> {
    try {
      logger.info('Fetching Anthropic models');
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to list models: HTTP ${res.status}`);
      }

      const data = await res.json();
      const models: ModelInfo[] = (data.data || []).map((m: { id: string; display_name?: string }) => ({
        id: m.id,
        name: m.display_name || m.id,
        provider: 'anthropic' as const,
        description: `Anthropic ${m.display_name || m.id}`,
        contextWindow: 200000,
        maxOutputTokens: 8192,
      }));

      return models.length > 0 ? models : this.getDefaultModels();
    } catch (err) {
      logger.warn('Failed to fetch Anthropic models, falling back to defaults', { error: String(err) });
      return this.getDefaultModels();
    }
  }

  getDefaultModels(): ModelInfo[] {
    return [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'anthropic', contextWindow: 200000, maxOutputTokens: 8192 },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', contextWindow: 200000, maxOutputTokens: 8192 },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', contextWindow: 200000, maxOutputTokens: 8192 },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', contextWindow: 200000, maxOutputTokens: 4096 },
    ];
  }

  async createChatStream(
    request: ChatCompletionRequest,
    abortSignal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>> {
    logger.info('Initiating Anthropic chat completion', { model: request.model });

    const messages = [];
    for (const msg of request.messages) {
      if (msg.role !== 'system') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      max_tokens: request.params.maxTokens || 4096,
      stream: true,
      temperature: request.params.temperature,
      top_p: request.params.topP,
    };

    if (request.systemPrompt && request.systemPrompt.trim()) {
      body.system = request.systemPrompt.trim();
    }
    if (request.params.topK !== undefined && !isNaN(request.params.topK)) {
      body.top_k = request.params.topK;
    }
    if (request.params.stopSequences && request.params.stopSequences.length > 0) {
      body.stop_sequences = request.params.stopSequences;
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': request.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: abortSignal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      logger.error('Anthropic chat request failed', { statusCode: response.status, error: msg });
      throw new Error(msg);
    }

    if (!response.body) {
      throw new Error('No response body received from Anthropic');
    }

    const reader = response.body.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    return new ReadableStream({
      async pull(controller) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                if (json.type === 'content_block_delta' && json.delta?.text) {
                  controller.enqueue(encoder.encode(json.delta.text));
                }
              } catch {
                // Ignore parse errors on individual SSE chunks
              }
            }
          }
        }
      },
      cancel() {
        reader.cancel();
      },
    });
  }
}
