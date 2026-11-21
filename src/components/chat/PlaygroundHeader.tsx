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
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  Menu,
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
      <header className="border-b border-neutral-800 bg-[#121214] px-2.5 py-2 sm:px-4 sm:py-0 sm:h-14 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 select-none shrink-0">
        {/* Top/Left Row: Brand, Sidebar Toggle, Conversation Actions */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            {/* Desktop Sidebar Toggle */}
            <button
              onClick={toggleSidebar}
              title={isSidebarOpen ? 'Hide Chat History' : 'Show Chat History'}
              className="hidden sm:flex p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>

            {/* Mobile Menu / Hamburger Toggle */}
            <button
              onClick={toggleSidebar}
              title="Toggle Conversations History"
              className="sm:hidden p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-neutral-100 tracking-tight">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-200">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-300" />
              </div>
              <span className="truncate">LLM Playground</span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-neutral-800 mx-1 hidden sm:block" />

          {/* New / Clear Conversation Actions & Mobile Config Toggle */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={newConversation}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                title="Clear current messages"
                className="text-neutral-500 hover:text-red-400 p-1 sm:p-1.5 rounded-md hover:bg-neutral-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Mobile Parameters Panel Toggle */}
            <button
              onClick={toggleConfig}
              className={`sm:hidden p-1.5 rounded-lg border text-xs transition-colors ${
                isConfigOpen
                  ? 'bg-neutral-800 text-white border-neutral-700'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
              title="Toggle Parameters Panel"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: LM Studio style Model & Provider Selector Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:max-w-md sm:justify-center">
          {/* Provider Dropdown */}
          <div className="relative shrink-0">
            <select
              value={provider}
              onChange={e => setProvider(e.target.value as ProviderId)}
              className="bg-[#18181b] border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-medium rounded-lg px-2.5 py-1.5 pr-6 appearance-none cursor-pointer focus:outline-hidden"
            >
              {PROVIDERS_METADATA.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Model Dropdown */}
          <div className="relative flex-1 min-w-0">
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="w-full bg-[#18181b] border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-mono rounded-lg px-2.5 py-1.5 pr-6 appearance-none cursor-pointer focus:outline-hidden truncate"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name || m.id}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Model refresh button */}
          <button
            onClick={() => refreshModels()}
            title="Discover / Reload models from provider"
            disabled={isLoadingModels}
            className="text-neutral-400 hover:text-neutral-200 p-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Right: API Keys & Desktop Config Toggle */}
        <div className="hidden sm:flex items-center gap-2">
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

        {/* Mobile API Key button */}
        <div className="flex sm:hidden items-center justify-between pt-1 border-t border-neutral-800/60">
          <button
            onClick={() => setIsKeysOpen(true)}
            className={`flex items-center justify-center gap-1.5 py-1 px-2.5 w-full rounded-md text-xs font-medium border transition-colors ${
              hasKey || provider === 'openai-compatible'
                ? 'bg-neutral-900 text-neutral-300 border-neutral-800'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/60'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>
              {hasKey
                ? `${currentProviderMeta.name} Key Active`
                : provider === 'openai-compatible'
                ? 'Endpoint Key'
                : `Set ${currentProviderMeta.name} Key`}
            </span>
          </button>
        </div>
      </header>

      {/* API Keys Configuration Dialog */}
      <ApiKeysModal isOpen={isKeysOpen} onClose={() => setIsKeysOpen(false)} />
    </>
  );
}
