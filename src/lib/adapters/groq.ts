import {
  ChatCompletionRequest,
  ConnectionTestResult,
  ModelInfo,
  ProviderCapability,
} from '@/types';
import { ProviderAdapter } from './base';
import { logger } from '../logger';

export class GroqAdapter implements ProviderAdapter {
  readonly id = 'groq' as const;
  readonly name = 'Groq';
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

  private baseUrl = 'https://api.groq.com/openai/v1';

  async validateCredentials(apiKey: string): Promise<ConnectionTestResult> {
    try {
      logger.info('Testing Groq connection');
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        logger.warn('Groq credential validation failed', { statusCode: res.status });
        return { success: false, message: msg, error: msg };
      }

      const data = await res.json();
      const count = Array.isArray(data.data) ? data.data.length : 0;
      logger.info('Groq connection test successful', { modelsFound: count });
      return { success: true, message: `Connected successfully. ${count} Groq models available.`, modelsFound: count };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      logger.error('Groq connection test exception', { error: errorMsg });
      return { success: false, message: errorMsg, error: errorMsg };
    }
  }

  async listModels(apiKey: string): Promise<ModelInfo[]> {
    try {
      logger.info('Fetching Groq models');
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to list models: HTTP ${res.status}`);
      }

      const data = await res.json();
      const models: ModelInfo[] = (data.data || [])
        .filter((m: { active?: boolean }) => m.active !== false)
        .map((m: { id: string; context_window?: number }) => ({
          id: m.id,
          name: m.id,
          provider: 'groq' as const,
          description: `Groq ultra-fast LPU inference: ${m.id}`,
          contextWindow: m.context_window || 8192,
          maxOutputTokens: 8192,
        }))
        .sort((a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id));

      return models.length > 0 ? models : this.getDefaultModels();
    } catch (err) {
      logger.warn('Failed to fetch Groq models, falling back to defaults', { error: String(err) });
      return this.getDefaultModels();
    }
  }

  getDefaultModels(): ModelInfo[] {
    return [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'groq', contextWindow: 128000, maxOutputTokens: 8192 },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'groq', contextWindow: 128000, maxOutputTokens: 8192 },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B', provider: 'groq', contextWindow: 128000, maxOutputTokens: 8192 },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k)', provider: 'groq', contextWindow: 32768, maxOutputTokens: 8192 },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT', provider: 'groq', contextWindow: 8192, maxOutputTokens: 8192 },
    ];
  }

  async createChatStream(
    request: ChatCompletionRequest,
    abortSignal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>> {
    logger.info('Initiating Groq chat completion', { model: request.model });

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
      logger.error('Groq chat request failed', { statusCode: response.status, error: msg });
      throw new Error(msg);
    }

    if (!response.body) {
      throw new Error('No response body received from Groq');
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
