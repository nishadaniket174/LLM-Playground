import {
  ChatCompletionRequest,
  ConnectionTestResult,
  ModelInfo,
  ProviderCapability,
  ProviderId,
} from '@/types';

export interface ProviderAdapter {
  readonly id: ProviderId;
  readonly name: string;
  readonly capabilities: ProviderCapability;

  validateCredentials(apiKey: string, customEndpoint?: string): Promise<ConnectionTestResult>;
  listModels(apiKey: string, customEndpoint?: string): Promise<ModelInfo[]>;
  createChatStream(
    request: ChatCompletionRequest,
    abortSignal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>>;
}
