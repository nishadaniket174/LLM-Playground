'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ProviderId,
  ModelInfo,
  GenerationParams,
  ChatMessage,
  ProviderCapability,
} from '@/types';
import { PROVIDERS_METADATA } from '@/lib/adapters';

interface PlaygroundContextType {
  // Provider & Auth
  provider: ProviderId;
  setProvider: (p: ProviderId) => void;
  apiKeys: Partial<Record<ProviderId, string>>;
  setApiKey: (p: ProviderId, key: string) => void;
  removeApiKey: (p: ProviderId) => void;
  customEndpoints: Partial<Record<ProviderId, string>>;
  setCustomEndpoint: (p: ProviderId, endpoint: string) => void;
  currentCapabilities: ProviderCapability;

  // Models
  models: ModelInfo[];
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  isLoadingModels: boolean;
  refreshModels: () => Promise<void>;

  // Inference Settings
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  params: GenerationParams;
  updateParams: (updates: Partial<GenerationParams>) => void;
  resetParams: () => void;

  // Conversations
  messages: ChatMessage[];
  isGenerating: boolean;
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
  clearMessages: () => void;
  newConversation: () => void;
  error: string | null;
  clearError: () => void;
}

const DEFAULT_PARAMS: GenerationParams = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxTokens: 2048,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  seed: undefined,
  stopSequences: [],
  stream: true,
};

const PlaygroundContext = createContext<PlaygroundContextType | undefined>(undefined);

export function PlaygroundProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProviderState] = useState<ProviderId>('openai');
  const [apiKeys, setApiKeys] = useState<Partial<Record<ProviderId, string>>>({});
  const [customEndpoints, setCustomEndpoints] = useState<Partial<Record<ProviderId, string>>>({
    'openai-compatible': 'https://api.together.xyz/v1',
  });

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);

  const [systemPrompt, setSystemPrompt] = useState<string>('You are a helpful, concise AI assistant.');
  const [params, setParams] = useState<GenerationParams>(DEFAULT_PARAMS);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Current provider capabilities
  const currentMetadata = PROVIDERS_METADATA.find(p => p.id === provider) || PROVIDERS_METADATA[0];
  const currentCapabilities = currentMetadata.capabilities;

  // Set provider helper
  const setProvider = (newProvider: ProviderId) => {
    setProviderState(newProvider);
    const meta = PROVIDERS_METADATA.find(p => p.id === newProvider);
    if (meta && meta.defaultModels.length > 0) {
      setModels(meta.defaultModels);
      setSelectedModel(meta.defaultModels[0].id);
    }
  };

  const setApiKey = (p: ProviderId, key: string) => {
    setApiKeys(prev => ({ ...prev, [p]: key }));
  };

  const removeApiKey = (p: ProviderId) => {
    setApiKeys(prev => {
      const copy = { ...prev };
      delete copy[p];
      return copy;
    });
  };

  const setCustomEndpoint = (p: ProviderId, endpoint: string) => {
    setCustomEndpoints(prev => ({ ...prev, [p]: endpoint }));
  };

  const updateParams = (updates: Partial<GenerationParams>) => {
    setParams(prev => ({ ...prev, ...updates }));
  };

  const resetParams = () => {
    setParams(DEFAULT_PARAMS);
  };

  const clearError = () => setError(null);

  // Model loading
  const refreshModels = async () => {
    setIsLoadingModels(true);
    clearError();
    try {
      const activeKey = apiKeys[provider] || '';
      const customUrl = customEndpoints[provider];
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: activeKey,
          customEndpoint: customUrl,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (Array.isArray(data.models) && data.models.length > 0) {
        setModels(data.models);
        // Only reassign selectedModel if current one isn't in list
        if (!data.models.some((m: ModelInfo) => m.id === selectedModel)) {
          setSelectedModel(data.models[0].id);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(`Model discovery note: ${msg}`);
      // Fallback to default models
      const meta = PROVIDERS_METADATA.find(p => p.id === provider);
      if (meta) {
        setModels(meta.defaultModels);
        if (!meta.defaultModels.some(m => m.id === selectedModel)) {
          setSelectedModel(meta.defaultModels[0]?.id || '');
        }
      }
    } finally {
      setIsLoadingModels(false);
    }
  };

  // On provider switch, update available models
  useEffect(() => {
    refreshModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  // Send message
  const sendMessage = async (userText: string) => {
    if (!userText.trim() || isGenerating) return;

    clearError();
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: userText.trim(),
        timestamp: Date.now(),
        status: 'complete',
      },
    ];

    setMessages([
      ...newMessages,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'streaming',
      },
    ]);

    setIsGenerating(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const activeKey = apiKeys[provider] || '';
      const customUrl = customEndpoints[provider];

      if (provider !== 'openai-compatible' && !activeKey) {
        throw new Error(`API key for ${currentMetadata.name} is not set. Please enter your key in the API Keys panel.`);
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: activeKey,
          customEndpoint: customUrl,
          model: selectedModel,
          systemPrompt,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          params,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      if (!res.body) {
        throw new Error('Readable stream not supported or empty body');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        accumulated += text;

        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMsgId
              ? { ...msg, content: accumulated, status: 'streaming' }
              : msg
          )
        );
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMsgId ? { ...msg, status: 'complete' } : msg
        )
      );
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMsgId
              ? { ...msg, status: 'complete', content: msg.content + ' [Generation stopped by user]' }
              : msg
          )
        );
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown error during generation';
        setError(msg);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId ? { ...m, status: 'error', content: m.content || `[Error: ${msg}]` } : m
          )
        );
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsGenerating(false);
  };

  const clearMessages = () => {
    stopGeneration();
    setMessages([]);
    clearError();
  };

  const newConversation = () => {
    clearMessages();
  };

  return (
    <PlaygroundContext.Provider
      value={{
        provider,
        setProvider,
        apiKeys,
        setApiKey,
        removeApiKey,
        customEndpoints,
        setCustomEndpoint,
        currentCapabilities,
        models,
        selectedModel,
        setSelectedModel,
        isLoadingModels,
        refreshModels,
        systemPrompt,
        setSystemPrompt,
        params,
        updateParams,
        resetParams,
        messages,
        isGenerating,
        sendMessage,
        stopGeneration,
        clearMessages,
        newConversation,
        error,
        clearError,
      }}
    >
      {children}
    </PlaygroundContext.Provider>
  );
}

export function usePlayground() {
  const context = useContext(PlaygroundContext);
  if (!context) {
    throw new Error('usePlayground must be used within a PlaygroundProvider');
  }
  return context;
}
