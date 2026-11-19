'use client';

import React, { useState } from 'react';
import { usePlayground } from '@/context/PlaygroundContext';
import { PROVIDERS_METADATA } from '@/lib/adapters';
import { ProviderId } from '@/types';
import { KeyRound, CheckCircle2, AlertCircle, Trash2, RefreshCw, Eye, EyeOff, ExternalLink } from 'lucide-react';

export function ApiKeysModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    provider,
    setProvider,
    apiKeys,
    setApiKey,
    removeApiKey,
    customEndpoints,
    setCustomEndpoint,
    refreshModels,
  } = usePlayground();

  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testingStatus, setTestingStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  if (!isOpen) return null;

  const currentMeta = PROVIDERS_METADATA.find(p => p.id === provider) || PROVIDERS_METADATA[0];
  const activeKey = apiKeys[provider] || '';
  const activeEndpoint = customEndpoints[provider] || '';

  const toggleShowKey = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTestConnection = async () => {
    setTestingStatus({ loading: true });
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: activeKey,
          customEndpoint: activeEndpoint,
        }),
      });

      const data = await res.json();
      setTestingStatus({
        loading: false,
        success: data.success,
        message: data.message || (data.success ? 'Connected successfully!' : 'Connection failed'),
      });

      if (data.success) {
        // Automatically refresh models if connection is verified
        refreshModels();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network test error';
      setTestingStatus({
        loading: false,
        success: false,
        message: msg,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#18181b] border border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#121214]">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-neutral-300" />
            <h2 className="text-base font-semibold text-neutral-100">API Credentials & Provider Setup</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 text-sm font-medium px-2 py-1 rounded-md hover:bg-neutral-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Security Note Alert */}
          <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-400 leading-relaxed">
            <span className="font-semibold text-neutral-200">Session Security Notice:</span> Credentials reside only in memory for this session and are passed securely via HTTPS/localhost to standard cloud provider endpoints. They are never written to disk, client localStorage, or logged in system traces.
          </div>

          {/* Provider Select Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Select AI Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PROVIDERS_METADATA.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProvider(p.id as ProviderId);
                    setTestingStatus({ loading: false });
                  }}
                  className={`px-3 py-2.5 rounded-lg text-xs font-medium text-left border transition-all ${
                    provider === p.id
                      ? 'bg-neutral-800 border-neutral-600 text-white shadow-xs'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                    {apiKeys[p.id] ? '● Key set' : '○ Not configured'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Form */}
          <div className="p-4 bg-neutral-900/80 rounded-lg border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-neutral-200">{currentMeta.name}</h3>
                  {provider === 'groq' && (
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 underline underline-offset-2"
                    >
                      <span>Get API Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">{currentMeta.description}</p>
              </div>
              {apiKeys[provider] && (
                <button
                  onClick={() => removeApiKey(provider)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 px-2 py-1 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Key
                </button>
              )}
            </div>

            {/* Custom endpoint input for OpenAI-compatible */}
            {currentMeta.capabilities.supportsCustomEndpoint && (
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Base URL / Endpoint
                </label>
                <input
                  type="text"
                  placeholder="https://api.together.xyz/v1"
                  value={activeEndpoint}
                  onChange={e => setCustomEndpoint(provider, e.target.value)}
                  className="w-full bg-[#121214] border border-neutral-700 rounded-md px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500 font-mono"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Works with Together AI, Groq, Mistral, Perplexity, OpenRouter, or any OpenAI-compliant proxy.
                </p>
              </div>
            )}

            {/* API Key Input */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                API Key {currentMeta.requiresApiKey ? '*' : '(Optional for local/open endpoints)'}
              </label>
              <div className="relative">
                <input
                  type={showKey[provider] ? 'text' : 'password'}
                  placeholder={
                    provider === 'openai'
                      ? 'sk-proj-...'
                      : provider === 'gemini'
                      ? 'AIzaSy...'
                      : provider === 'anthropic'
                      ? 'sk-ant-api03-...'
                      : provider === 'groq'
                      ? 'gsk_...'
                      : 'Enter API key if required'
                  }
                  value={activeKey}
                  onChange={e => setApiKey(provider, e.target.value)}
                  className="w-full bg-[#121214] border border-neutral-700 rounded-md px-3 py-2 pr-10 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(provider)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  {showKey[provider] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Test Connection Button & Status */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-neutral-800">
              <button
                type="button"
                disabled={testingStatus.loading || (currentMeta.requiresApiKey && !activeKey)}
                onClick={handleTestConnection}
                className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-xs font-medium px-4 py-2 rounded-md transition-colors"
              >
                {testingStatus.loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Testing connection...
                  </>
                ) : (
                  <>Test Connection & Sync Models</>
                )}
              </button>

              {testingStatus.message && (
                <div
                  className={`flex items-center gap-1.5 text-xs ${
                    testingStatus.success ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {testingStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span className="truncate max-w-xs">{testingStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-neutral-800 bg-[#121214]">
          <div className="text-xs text-neutral-500">
            Active Provider: <span className="text-neutral-300 font-medium">{currentMeta.name}</span>
          </div>
          <button
            onClick={onClose}
            className="bg-neutral-200 hover:bg-white text-neutral-900 text-xs font-semibold px-4 py-2 rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
