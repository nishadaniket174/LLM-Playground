'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ProviderId,
  ModelInfo,
  GenerationParams,
  ChatMessage,
  Conversation,
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

  // Multi-Chat History & Management
  conversations: Conversation[];
  currentChatId: string;
  selectConversation: (id: string) => void;
  createConversation: (title?: string) => string;
  renameConversation: (id: string, newTitle: string) => void;
  deleteConversation: (id: string) => void;

  // Active Conversation Messages
  messages: ChatMessage[];
  isGenerating: boolean;
  sendMessage: (content: string) => Promise<void>;
  editAndRegenerate: (messageId: string, updatedContent: string) => Promise<void>;
  branchConversation: (upToMessageId: string) => string;
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
  contextLength: 8192,
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

  // Multi-Chat state
  const initialChatId = 'chat-default-1';
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: initialChatId,
      title: 'New Conversation',
      messages: [],
      createdAt: 0,
      updatedAt: 0,
      provider: 'openai',
      model: 'gpt-4o-mini',
    },
  ]);
  const [currentChatId, setCurrentChatId] = useState<string>(initialChatId);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Derive current conversation messages
  const activeConversation = conversations.find(c => c.id === currentChatId);
  const messages = activeConversation?.messages || [];

  // Helper to update messages for active conversation
  const setMessagesForCurrentChat = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setConversations(prev =>
      prev.map(c => {
        if (c.id === currentChatId) {
          const updatedMessages = updater(c.messages);
          return {
            ...c,
            messages: updatedMessages,
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );
  };

  // Provider capabilities
  const currentMetadata = PROVIDERS_METADATA.find(p => p.id === provider) || PROVIDERS_METADATA[0];
  const currentCapabilities = currentMetadata.capabilities;

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
        if (!data.models.some((m: ModelInfo) => m.id === selectedModel)) {
          setSelectedModel(data.models[0].id);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(`Model discovery note: ${msg}`);
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

  useEffect(() => {
    refreshModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  // Chat History Management
  const createConversation = (title?: string): string => {
    stopGeneration();
    const newId = `chat-${Date.now()}`;
    const newChat: Conversation = {
      id: newId,
      title: title || 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      provider,
      model: selectedModel,
    };
    setConversations(prev => [newChat, ...prev]);
    setCurrentChatId(newId);
    clearError();
    return newId;
  };

  const selectConversation = (id: string) => {
    stopGeneration();
    setCurrentChatId(id);
    clearError();
  };

  const renameConversation = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, title: newTitle.trim(), updatedAt: Date.now() } : c))
    );
  };

  const deleteConversation = (id: string) => {
    stopGeneration();
    setConversations(prev => {
      const remaining = prev.filter(c => c.id !== id);
      if (remaining.length === 0) {
        const freshId = `chat-${Date.now()}`;
        setCurrentChatId(freshId);
        return [
          {
            id: freshId,
            title: 'New Conversation',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            provider,
            model: selectedModel,
          },
        ];
      }
      if (currentChatId === id) {
        setCurrentChatId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Branch Conversation
  const branchConversation = (upToMessageId: string): string => {
    stopGeneration();
    const targetChat = conversations.find(c => c.id === currentChatId);
    if (!targetChat) return '';

    const msgIndex = targetChat.messages.findIndex(m => m.id === upToMessageId);
    if (msgIndex === -1) return '';

    const branchedMessages: ChatMessage[] = targetChat.messages
      .slice(0, msgIndex + 1)
      .map(m => ({ ...m }));

    const newId = `chat-branch-${Date.now()}`;
    const baseTitle = targetChat.title.replace(/\s*\(Branch.*\)$/, '');
    const newTitle = `${baseTitle} (Branch)`;

    const branchedChat: Conversation = {
      id: newId,
      title: newTitle,
      messages: branchedMessages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      provider,
      model: selectedModel,
    };

    setConversations(prev => [branchedChat, ...prev]);
    setCurrentChatId(newId);
    clearError();
    return newId;
  };

  // Internal Stream execution
  const executeChatStream = async (chatMessages: ChatMessage[], assistantMsgId: string, chatId: string) => {
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
          messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
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

        setConversations(prev =>
          prev.map(c => {
            if (c.id === chatId) {
              return {
                ...c,
                messages: c.messages.map(msg =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: accumulated, status: 'streaming' }
                    : msg
                ),
                updatedAt: Date.now(),
              };
            }
            return c;
          })
        );
      }

      setConversations(prev =>
        prev.map(c => {
          if (c.id === chatId) {
            return {
              ...c,
              messages: c.messages.map(msg =>
                msg.id === assistantMsgId ? { ...msg, status: 'complete' } : msg
              ),
              updatedAt: Date.now(),
            };
          }
          return c;
        })
      );
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setConversations(prev =>
          prev.map(c => {
            if (c.id === chatId) {
              return {
                ...c,
                messages: c.messages.map(msg =>
                  msg.id === assistantMsgId
                    ? { ...msg, status: 'complete', content: msg.content + ' [Generation stopped]' }
                    : msg
                ),
              };
            }
            return c;
          })
        );
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown error during generation';
        setError(msg);
        setConversations(prev =>
          prev.map(c => {
            if (c.id === chatId) {
              return {
                ...c,
                messages: c.messages.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, status: 'error', content: m.content || `[Error: ${msg}]` }
                    : m
                ),
              };
            }
            return c;
          })
        );
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  // Send new message
  const sendMessage = async (userText: string) => {
    if (!userText.trim() || isGenerating) return;

    clearError();
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    const newMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: userText.trim(),
      timestamp: Date.now(),
      status: 'complete',
    };

    const newAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'streaming',
    };

    const updatedMessages = [...messages, newMsg];

    // Auto-name untitled chat on first message
    const currentChat = conversations.find(c => c.id === currentChatId);
    let title = currentChat?.title;
    if (currentChat && (currentChat.messages.length === 0 || currentChat.title === 'New Conversation')) {
      title = userText.trim().slice(0, 32);
    }

    setConversations(prev =>
      prev.map(c => {
        if (c.id === currentChatId) {
          return {
            ...c,
            title: title || c.title,
            messages: [...updatedMessages, newAssistantMsg],
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );

    await executeChatStream(updatedMessages, assistantMsgId, currentChatId);
  };

  // Prompt Editing & Regeneration
  const editAndRegenerate = async (messageId: string, updatedContent: string) => {
    if (isGenerating) {
      stopGeneration();
    }
    clearError();

    const currentChat = conversations.find(c => c.id === currentChatId);
    if (!currentChat) return;

    const targetIndex = currentChat.messages.findIndex(m => m.id === messageId);
    if (targetIndex === -1) return;

    // Up to edited message, with updated content
    const truncated = currentChat.messages.slice(0, targetIndex).map(m => ({ ...m }));
    const editedUserMsg: ChatMessage = {
      id: messageId,
      role: 'user',
      content: updatedContent.trim(),
      timestamp: Date.now(),
      status: 'complete',
    };

    const assistantMsgId = `assistant-${Date.now()}`;
    const newAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'streaming',
    };

    const finalMessages = [...truncated, editedUserMsg];

    setConversations(prev =>
      prev.map(c => {
        if (c.id === currentChatId) {
          return {
            ...c,
            messages: [...finalMessages, newAssistantMsg],
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );

    await executeChatStream(finalMessages, assistantMsgId, currentChatId);
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
    setMessagesForCurrentChat(() => []);
    clearError();
  };

  const newConversation = () => {
    createConversation();
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
        conversations,
        currentChatId,
        selectConversation,
        createConversation,
        renameConversation,
        deleteConversation,
        messages,
        isGenerating,
        sendMessage,
        editAndRegenerate,
        branchConversation,
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
