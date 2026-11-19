import {
  ChatCompletionRequest,
  ConnectionTestResult,
  ModelInfo,
  ProviderCapability,
} from '@/types';
import { ProviderAdapter } from './base';
import { logger } from '../logger';

export class OpenAIAdapter implements ProviderAdapter {
  readonly id = 'openai' as const;
  readonly name = 'OpenAI';
  readonly capabilities: ProviderCapability = {
    supportsStreaming: true,
    supportsTopK: false,
    supportsTopP: true,
    supportsTemperature: true,
    supportsFrequencyPenalty: true,
    supportsPresencePenalty: true,
    supportsSeed: true,
    supportsStopSequences: true,
    supportsCustomEndpoint: false,
    supportsModelListing: true,
  };

  private baseUrl = 'https://api.openai.com/v1';

  async validateCredentials(apiKey: string): Promise<ConnectionTestResult> {
    try {
      logger.info('Testing OpenAI connection');
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        logger.warn('OpenAI credential validation failed', { statusCode: res.status });
        return { success: false, message: msg, error: msg };
      }

      const data = await res.json();
      const count = Array.isArray(data.data) ? data.data.length : 0;
      logger.info('OpenAI connection test successful', { modelsFound: count });
      return { success: true, message: `Connected successfully. ${count} models available.`, modelsFound: count };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      logger.error('OpenAI connection test exception', { error: errorMsg });
      return { success: false, message: errorMsg, error: errorMsg };
    }
  }

  async listModels(apiKey: string): Promise<ModelInfo[]> {
    try {
      logger.info('Fetching OpenAI models');
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to list models: HTTP ${res.status}`);
      }

      const data = await res.json();
      const chatPrefixes = ['gpt-4', 'gpt-3.5', 'o1', 'o3', 'chatgpt'];
      
      const models: ModelInfo[] = (data.data || [])
        .filter((m: { id: string }) => chatPrefixes.some(p => m.id.toLowerCase().startsWith(p)))
        .map((m: { id: string }) => ({
          id: m.id,
          name: m.id,
          provider: 'openai' as const,
          description: `OpenAI ${m.id}`,
        }))
        .sort((a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id));

      return models.length > 0 ? models : this.getDefaultModels();
    } catch (err) {
      logger.warn('Failed to fetch OpenAI models, falling back to defaults', { error: String(err) });
      return this.getDefaultModels();
    }
  }

  getDefaultModels(): ModelInfo[] {
    return [
      { id: 'gpt-4o', name: 'GPT-4o (Omni)', provider: 'openai', contextWindow: 128000, maxOutputTokens: 16384 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextWindow: 128000, maxOutputTokens: 16384 },
      { id: 'o1', name: 'o1 Reasoning', provider: 'openai', contextWindow: 200000, maxOutputTokens: 100000 },
      { id: 'o1-mini', name: 'o1-mini', provider: 'openai', contextWindow: 128000, maxOutputTokens: 65536 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', contextWindow: 128000, maxOutputTokens: 4096 },
    ];
  }

  async createChatStream(
    request: ChatCompletionRequest,
    abortSignal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>> {
    logger.info('Initiating OpenAI chat completion', { model: request.model });

    const messages = [];
    if (request.systemPrompt && request.systemPrompt.trim()) {
      messages.push({ role: 'system', content: request.systemPrompt.trim() });
    }
    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      stream: true,
      temperature: request.params.temperature,
      top_p: request.params.topP,
      max_tokens: request.params.maxTokens,
    };

    if (request.params.frequencyPenalty !== 0) {
      body.frequency_penalty = request.params.frequencyPenalty;
    }
    if (request.params.presencePenalty !== 0) {
      body.presence_penalty = request.params.presencePenalty;
    }
    if (request.params.seed !== undefined && !isNaN(request.params.seed)) {
      body.seed = request.params.seed;
    }
    if (request.params.stopSequences && request.params.stopSequences.length > 0) {
      body.stop = request.params.stopSequences;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: abortSignal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      logger.error('OpenAI chat request failed', { statusCode: response.status, error: msg });
      throw new Error(msg);
    }

    if (!response.body) {
      throw new Error('No response body received from OpenAI');
    }

    // Transform OpenAI SSE chunks to normalized text stream
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
            if (trimmed === 'data: [DONE]') {
              controller.close();
              return;
            }
            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(encoder.encode(delta));
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
