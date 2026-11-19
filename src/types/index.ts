export type ProviderId = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openai-compatible';

export interface ProviderCapability {
  supportsStreaming: boolean;
  supportsTopK: boolean;
  supportsTopP: boolean;
  supportsTemperature: boolean;
  supportsFrequencyPenalty: boolean;
  supportsPresencePenalty: boolean;
  supportsSeed: boolean;
  supportsStopSequences: boolean;
  supportsCustomEndpoint: boolean;
  supportsModelListing: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderId;
  description?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  isCustom?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  status?: 'sending' | 'streaming' | 'complete' | 'error';
  tokenStats?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  provider: ProviderId;
  model: string;
}

export interface GenerationParams {
  temperature: number;
  topP: number;
  topK?: number;
  maxTokens: number;
  contextLength?: number;
  frequencyPenalty: number;
  presencePenalty: number;
  seed?: number;
  stopSequences: string[];
  stream: boolean;
}

export interface ProviderConfig {
  provider: ProviderId;
  apiKey: string;
  customEndpoint?: string; // For OpenAI-compatible / custom base URLs
}

export interface ProviderMetadata {
  id: ProviderId;
  name: string;
  description: string;
  defaultBaseUrl?: string;
  requiresApiKey: boolean;
  capabilities: ProviderCapability;
  defaultModels: ModelInfo[];
}

export interface ChatCompletionRequest {
  provider: ProviderId;
  apiKey: string;
  customEndpoint?: string;
  model: string;
  systemPrompt?: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  params: GenerationParams;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  modelsFound?: number;
  error?: string;
}
