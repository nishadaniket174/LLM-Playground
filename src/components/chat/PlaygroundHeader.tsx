'use client';

import React, { useState } from 'react';
import { usePlayground } from '@/context/PlaygroundContext';
import { PROVIDERS_METADATA } from '@/lib/adapters';
import { ProviderId } from '@/types';
import {
  KeyRound,
  RefreshCw,
  PlusCircle,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { ApiKeysModal } from '../keys/ApiKeysModal';

export function PlaygroundHeader({
  toggleConfig,
  isConfigOpen,
  toggleSidebar,
  isSidebarOpen,
}: {
  toggleConfig: () => void;
  isConfigOpen: boolean;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}) {
  const {
    provider,
    setProvider,
    apiKeys,
    models,
    selectedModel,
    setSelectedModel,
    isLoadingModels,
    refreshModels,
    newConversation,
    clearMessages,
    messages,
  } = usePlayground();

  const [isKeysOpen, setIsKeysOpen] = useState(false);
  const currentProviderMeta = PROVIDERS_METADATA.find(p => p.id === provider) || PROVIDERS_METADATA[0];
  const hasKey = Boolean(apiKeys[provider]);

  return (
    <>
      <header className="h-14 border-b border-neutral-800 bg-[#121214] px-4 flex items-center justify-between gap-4 select-none">
        {/* Left: App Title & Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            title={isSidebarOpen ? 'Hide Chat History' : 'Show Chat History'}
            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 font-bold text-sm text-neutral-100 tracking-tight">
            <div className="w-6 h-6 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-200">
              <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
            </div>
            <span>LLM Playground</span>
          </div>

          <div className="h-4 w-[1px] bg-neutral-800 mx-1 hidden sm:block" />

          {/* New / Clear Conversation Actions */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={newConversation}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                title="Clear current messages"
                className="text-neutral-500 hover:text-red-400 p-1.5 rounded-md hover:bg-neutral-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Center: LM Studio style Model & Provider Selector Pill */}
        <div className="flex items-center gap-2 max-w-md w-full justify-center">
          {/* Provider Dropdown */}
          <div className="relative">
            <select
              value={provider}
              onChange={e => setProvider(e.target.value as ProviderId)}
              className="bg-[#18181b] border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-medium rounded-lg px-2.5 py-1.5 pr-7 appearance-none cursor-pointer focus:outline-hidden"
            >
              {PROVIDERS_METADATA.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Model Dropdown */}
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="w-full bg-[#18181b] border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-mono rounded-lg px-2.5 py-1.5 pr-7 appearance-none cursor-pointer focus:outline-hidden truncate"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name || m.id}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Model refresh button */}
          <button
            onClick={() => refreshModels()}
            title="Discover / Reload models from provider"
            disabled={isLoadingModels}
            className="text-neutral-400 hover:text-neutral-200 p-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Right: API Keys & Config Toggle */}
        <div className="flex items-center gap-2">
          {/* API Key Status Pill */}
          <button
            onClick={() => setIsKeysOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              hasKey || provider === 'openai-compatible'
                ? 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/40'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {hasKey ? 'Key Configured' : provider === 'openai-compatible' ? 'Endpoint Key' : 'Set API Key'}
            </span>
          </button>

          {/* Parameters Panel Toggle */}
          <button
            onClick={toggleConfig}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isConfigOpen
                ? 'bg-neutral-800 text-white border-neutral-700'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
            title="Toggle Parameters Panel"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* API Keys Configuration Dialog */}
      <ApiKeysModal isOpen={isKeysOpen} onClose={() => setIsKeysOpen(false)} />
    </>
  );
}
