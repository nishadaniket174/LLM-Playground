import {
  ChatCompletionRequest,
  ConnectionTestResult,
  ModelInfo,
  ProviderCapability,
} from '@/types';
import { ProviderAdapter } from './base';
import { logger } from '../logger';

export class GeminiAdapter implements ProviderAdapter {
  readonly id = 'gemini' as const;
  readonly name = 'Google Gemini';
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

  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  async validateCredentials(apiKey: string): Promise<ConnectionTestResult> {
    try {
      logger.info('Testing Google Gemini connection');
      const res = await fetch(`${this.baseUrl}/models?key=${apiKey}`);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        logger.warn('Gemini credential validation failed', { statusCode: res.status });
        return { success: false, message: msg, error: msg };
      }

      const data = await res.json();
      const count = Array.isArray(data.models) ? data.models.length : 0;
      logger.info('Gemini connection test successful', { modelsFound: count });
      return { success: true, message: `Connected successfully. ${count} models available.`, modelsFound: count };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      logger.error('Gemini connection test exception', { error: errorMsg });
      return { success: false, message: errorMsg, error: errorMsg };
    }
  }

  async listModels(apiKey: string): Promise<ModelInfo[]> {
    try {
      logger.info('Fetching Gemini models');
      const res = await fetch(`${this.baseUrl}/models?key=${apiKey}`);
      if (!res.ok) {
        throw new Error(`Failed to list models: HTTP ${res.status}`);
      }

      const data = await res.json();
      const models: ModelInfo[] = (data.models || [])
        .filter((m: { name: string; supportedGenerationMethods?: string[] }) =>
          m.supportedGenerationMethods?.includes('generateContent')
        )
        .map((m: { name: string; displayName?: string; description?: string; inputTokenLimit?: number; outputTokenLimit?: number }) => {
          const cleanId = m.name.replace(/^models\//, '');
          return {
            id: cleanId,
            name: m.displayName || cleanId,
            provider: 'gemini' as const,
            description: m.description,
            contextWindow: m.inputTokenLimit,
            maxOutputTokens: m.outputTokenLimit,
          };
        });

      return models.length > 0 ? models : this.getDefaultModels();
    } catch (err) {
      logger.warn('Failed to fetch Gemini models, falling back to defaults', { error: String(err) });
      return this.getDefaultModels();
    }
  }

  getDefaultModels(): ModelInfo[] {
    return [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', contextWindow: 2000000, maxOutputTokens: 8192 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini', contextWindow: 1000000, maxOutputTokens: 8192 },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', contextWindow: 1000000, maxOutputTokens: 8192 },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Preview)', provider: 'gemini', contextWindow: 2000000, maxOutputTokens: 8192 },
    ];
  }

  async createChatStream(
    request: ChatCompletionRequest,
    abortSignal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>> {
    logger.info('Initiating Gemini chat completion', { model: request.model });

    // Format messages for Gemini API
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const msg of request.messages) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    const generationConfig: Record<string, unknown> = {
      temperature: request.params.temperature,
      topP: request.params.topP,
      maxOutputTokens: request.params.maxTokens,
    };

    if (request.params.topK !== undefined && !isNaN(request.params.topK)) {
      generationConfig.topK = request.params.topK;
    }
    if (request.params.stopSequences && request.params.stopSequences.length > 0) {
      generationConfig.stopSequences = request.params.stopSequences;
    }

    const body: Record<string, unknown> = {
      contents,
      generationConfig,
    };

    if (request.systemPrompt && request.systemPrompt.trim()) {
      body.systemInstruction = {
        parts: [{ text: request.systemPrompt.trim() }],
      };
    }

    const modelName = request.model.startsWith('models/') ? request.model : `models/${request.model}`;
    const url = `${this.baseUrl}/${modelName}:streamGenerateContent?alt=sse&key=${request.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abortSignal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      logger.error('Gemini chat request failed', { statusCode: response.status, error: msg });
      throw new Error(msg);
    }

    if (!response.body) {
      throw new Error('No response body received from Gemini');
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
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  controller.enqueue(encoder.encode(text));
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
