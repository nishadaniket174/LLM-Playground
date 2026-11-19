import {
  ChatCompletionRequest,
  ConnectionTestResult,
  ModelInfo,
  ProviderCapability,
} from '@/types';
import { ProviderAdapter } from './base';
import { logger } from '../logger';

export class OpenAICompatibleAdapter implements ProviderAdapter {
  readonly id = 'openai-compatible' as const;
  readonly name = 'OpenAI Compatible';
  readonly capabilities: ProviderCapability = {
    supportsStreaming: true,
    supportsTopK: true,
    supportsTopP: true,
    supportsTemperature: true,
    supportsFrequencyPenalty: true,
    supportsPresencePenalty: true,
    supportsSeed: true,
    supportsStopSequences: true,
    supportsCustomEndpoint: true,
    supportsModelListing: true,
  };

  private getBaseUrl(customEndpoint?: string): string {
    const raw = (customEndpoint || '').trim().replace(/\/+$/, '');
    if (!raw) return 'https://api.together.xyz/v1'; // Sensible default or proxy
    return raw;
  }

  async validateCredentials(apiKey: string, customEndpoint?: string): Promise<ConnectionTestResult> {
    try {
      const baseUrl = this.getBaseUrl(customEndpoint);
      logger.info('Testing OpenAI-compatible connection', { baseUrl });
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const res = await fetch(`${baseUrl}/models`, { headers });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        logger.warn('OpenAI-compatible credential validation failed', { statusCode: res.status });
        return { success: false, message: msg, error: msg };
      }

      const data = await res.json();
      const count = Array.isArray(data.data) ? data.data.length : (Array.isArray(data) ? data.length : 0);
      logger.info('OpenAI-compatible connection test successful', { modelsFound: count });
      return { success: true, message: `Connected successfully. ${count} models discovered.`, modelsFound: count };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      logger.error('OpenAI-compatible connection test exception', { error: errorMsg });
      return { success: false, message: errorMsg, error: errorMsg };
    }
  }

  async listModels(apiKey: string, customEndpoint?: string): Promise<ModelInfo[]> {
    try {
      const baseUrl = this.getBaseUrl(customEndpoint);
      logger.info('Fetching OpenAI-compatible models', { baseUrl });
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const res = await fetch(`${baseUrl}/models`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to list models: HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      
      const models: ModelInfo[] = rawList.map((m: { id: string }) => ({
        id: m.id,
        name: m.id,
        provider: 'openai-compatible' as const,
        description: `Custom model: ${m.id}`,
      }));

      return models.length > 0 ? models : this.getDefaultModels();
    } catch (err) {
      logger.warn('Failed to fetch OpenAI-compatible models, falling back to defaults', { error: String(err) });
      return this.getDefaultModels();
    }
  }

  getDefaultModels(): ModelInfo[] {
    return [
      { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B Instruct', provider: 'openai-compatible', contextWindow: 131072, maxOutputTokens: 8192 },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek-V3', provider: 'openai-compatible', contextWindow: 64000, maxOutputTokens: 8192 },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek-R1', provider: 'openai-compatible', contextWindow: 64000, maxOutputTokens: 8192 },
      { id: 'mistralai/Mistral-Large-2407', name: 'Mistral Large 2407', provider: 'openai-compatible', contextWindow: 128000, maxOutputTokens: 8192 },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B Instruct', provider: 'openai-compatible', contextWindow: 32768, maxOutputTokens: 8192 },
    ];
  }

  async createChatStream(
    request: ChatCompletionRequest,
    abortSignal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>> {
    const baseUrl = this.getBaseUrl(request.customEndpoint);
    logger.info('Initiating OpenAI-compatible chat completion', { model: request.model, baseUrl });

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

    if (request.params.topK !== undefined && !isNaN(request.params.topK)) {
      body.top_k = request.params.topK;
    }
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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (request.apiKey) {
      headers.Authorization = `Bearer ${request.apiKey}`;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: abortSignal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      logger.error('OpenAI-compatible chat request failed', { statusCode: response.status, error: msg });
      throw new Error(msg);
    }

    if (!response.body) {
      throw new Error('No response body received from endpoint');
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
