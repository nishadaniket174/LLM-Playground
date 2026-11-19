import { ProviderId, ProviderMetadata } from '@/types';
import { ProviderAdapter } from './base';
import { OpenAIAdapter } from './openai';
import { GeminiAdapter } from './gemini';
import { AnthropicAdapter } from './anthropic';
import { GroqAdapter } from './groq';
import { OpenAICompatibleAdapter } from './openai-compatible';

const adapters: Record<ProviderId, ProviderAdapter> = {
  openai: new OpenAIAdapter(),
  gemini: new GeminiAdapter(),
  anthropic: new AnthropicAdapter(),
  groq: new GroqAdapter(),
  'openai-compatible': new OpenAICompatibleAdapter(),
};

export function getProviderAdapter(id: ProviderId): ProviderAdapter {
  const adapter = adapters[id];
  if (!adapter) {
    throw new Error(`Unsupported provider: ${id}`);
  }
  return adapter;
}

export const PROVIDERS_METADATA: ProviderMetadata[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4o mini, o1 reasoning models',
    requiresApiKey: true,
    capabilities: adapters.openai.capabilities,
    defaultModels: (adapters.openai as OpenAIAdapter).getDefaultModels(),
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini 1.5 Pro, Flash, 2.0 Flash with expansive context windows',
    requiresApiKey: true,
    capabilities: adapters.gemini.capabilities,
    defaultModels: (adapters.gemini as GeminiAdapter).getDefaultModels(),
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku',
    requiresApiKey: true,
    capabilities: adapters.anthropic.capabilities,
    defaultModels: (adapters.anthropic as AnthropicAdapter).getDefaultModels(),
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast LPU inference (Llama 3.3 70B, DeepSeek R1, Mixtral)',
    requiresApiKey: true,
    capabilities: adapters.groq.capabilities,
    defaultModels: (adapters.groq as GroqAdapter).getDefaultModels(),
  },
  {
    id: 'openai-compatible',
    name: 'OpenAI Compatible',
    description: 'Any OpenAI-compatible gateway (Together AI, Groq, Mistral, Perplexity, OpenRouter)',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    requiresApiKey: false,
    capabilities: adapters['openai-compatible'].capabilities,
    defaultModels: (adapters['openai-compatible'] as OpenAICompatibleAdapter).getDefaultModels(),
  },
];
