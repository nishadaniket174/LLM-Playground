'use client';

import React, { useState } from 'react';
import { usePlayground } from '@/context/PlaygroundContext';
import { ChevronDown, Sliders, RotateCcw, Info, Settings2 } from 'lucide-react';

export function ConfigurationPanel() {
  const {
    systemPrompt,
    setSystemPrompt,
    params,
    updateParams,
    resetParams,
    currentCapabilities,
    models,
    selectedModel,
  } = usePlayground();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [stopInput, setStopInput] = useState(params.stopSequences.join(', '));

  const activeModelInfo = models.find(m => m.id === selectedModel);

  const handleStopChange = (val: string) => {
    setStopInput(val);
    const seqs = val
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    updateParams({ stopSequences: seqs });
  };

  return (
    <div className="w-80 h-full flex flex-col bg-[#121214] border-l border-neutral-800 select-none overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-[#161618]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-300">
          <Sliders className="w-4 h-4 text-neutral-400" />
          <span>Inference Parameters</span>
        </div>
        <button
          onClick={resetParams}
          title="Reset all settings to default"
          className="text-neutral-500 hover:text-neutral-300 p-1 rounded-md hover:bg-neutral-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-5 text-xs">
        {/* Model Specs Card (LM Studio inspiration) */}
        <div className="p-3 bg-neutral-900/90 rounded-lg border border-neutral-800 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Model Specifications
          </div>
          <div className="font-mono text-neutral-200 truncate text-[11px]" title={selectedModel}>
            {selectedModel}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-neutral-400">
            <div>
              <span className="text-neutral-500">Context Limit: </span>
              <span className="text-neutral-300 font-mono">
                {activeModelInfo?.contextWindow
                  ? `${activeModelInfo.contextWindow.toLocaleString()} tokens`
                  : 'Provider Default'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">Max Out: </span>
              <span className="text-neutral-300 font-mono">
                {activeModelInfo?.maxOutputTokens
                  ? `${activeModelInfo.maxOutputTokens.toLocaleString()} tokens`
                  : 'Provider Default'}
              </span>
            </div>
          </div>
        </div>

        {/* System Prompt Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-medium text-neutral-300">System Prompt</label>
            <span className="text-[10px] text-neutral-500">Instructions</span>
          </div>
          <textarea
            rows={3}
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            placeholder="Define AI behavior, persona, constraints..."
            className="w-full bg-[#18181b] border border-neutral-800 rounded-md p-2.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-hidden focus:border-neutral-600 resize-none font-sans"
          />
        </div>

        {/* Primary Controls */}
        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-neutral-300">Temperature</span>
            <span className="font-mono text-neutral-400">{params.temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.0"
            step="0.05"
            value={params.temperature}
            onChange={e => updateParams({ temperature: parseFloat(e.target.value) })}
            className="w-full accent-neutral-300 h-1 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
            <span>Precise (0.0)</span>
            <span>Creative (2.0)</span>
          </div>
        </div>

        {/* Context Length / Max Context Control */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-neutral-300">Context Length (Max Context)</span>
            <span className="font-mono text-neutral-400">
              {(params.contextLength || params.maxTokens).toLocaleString()} tokens
            </span>
          </div>
          <input
            type="range"
            min="1024"
            max={activeModelInfo?.contextWindow ? Math.min(activeModelInfo.contextWindow, 131072) : 32768}
            step="1024"
            value={params.contextLength || 8192}
            onChange={e => {
              const val = parseInt(e.target.value, 10);
              updateParams({ contextLength: val });
            }}
            className="w-full accent-cyan-400 h-1 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
            <span>1,024</span>
            <span>
              Target window limit (Hardware: {activeModelInfo?.contextWindow ? `${activeModelInfo.contextWindow.toLocaleString()}` : 'Default'})
            </span>
          </div>
        </div>

        {/* Max Tokens */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-neutral-300">Max Output Tokens</span>
            <span className="font-mono text-neutral-400">{params.maxTokens}</span>
          </div>
          <input
            type="range"
            min="128"
            max={activeModelInfo?.maxOutputTokens ? Math.min(activeModelInfo.maxOutputTokens, 16384) : 8192}
            step="128"
            value={params.maxTokens}
            onChange={e => updateParams({ maxTokens: parseInt(e.target.value, 10) })}
            className="w-full accent-neutral-300 h-1 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <div className="text-[10px] text-neutral-500 mt-1">
            Upper ceiling for completion tokens generated in a single turn.
          </div>
        </div>

        {/* Top P */}
        {currentCapabilities.supportsTopP && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-neutral-300">Top P (Nucleus Sampling)</span>
              <span className="font-mono text-neutral-400">{params.topP.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={params.topP}
              onChange={e => updateParams({ topP: parseFloat(e.target.value) })}
              className="w-full accent-neutral-300 h-1 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Top K (if supported by active provider) */}
        {currentCapabilities.supportsTopK && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-neutral-300">Top K</span>
              <span className="font-mono text-neutral-400">{params.topK || 40}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={params.topK || 40}
              onChange={e => updateParams({ topK: parseInt(e.target.value, 10) })}
              className="w-full accent-neutral-300 h-1 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Expandable Advanced Section */}
        <div className="pt-2 border-t border-neutral-800/80">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full py-1 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-medium text-xs">
              <Settings2 className="w-3.5 h-3.5" />
              Advanced Generation Settings
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="pt-4 space-y-4">
              {/* Frequency Penalty */}
              {currentCapabilities.supportsFrequencyPenalty && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-neutral-300">Frequency Penalty</span>
                    <span className="font-mono text-neutral-400">{params.frequencyPenalty.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.1"
                    value={params.frequencyPenalty}
                    onChange={e => updateParams({ frequencyPenalty: parseFloat(e.target.value) })}
                    className="w-full accent-neutral-300 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-neutral-500 mt-0.5">Penalizes token repetition based on frequency.</div>
                </div>
              )}

              {/* Presence Penalty */}
              {currentCapabilities.supportsPresencePenalty && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-neutral-300">Presence Penalty</span>
                    <span className="font-mono text-neutral-400">{params.presencePenalty.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.1"
                    value={params.presencePenalty}
                    onChange={e => updateParams({ presencePenalty: parseFloat(e.target.value) })}
                    className="w-full accent-neutral-300 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-neutral-500 mt-0.5">Encourages introducing new topics.</div>
                </div>
              )}

              {/* Random Seed */}
              {currentCapabilities.supportsSeed && (
                <div>
                  <label className="block text-neutral-300 mb-1">Seed (Deterministic Sampling)</label>
                  <input
                    type="number"
                    placeholder="e.g. 42 (leave empty for random)"
                    value={params.seed !== undefined ? params.seed : ''}
                    onChange={e => {
                      const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                      updateParams({ seed: val });
                    }}
                    className="w-full bg-[#18181b] border border-neutral-800 rounded-md px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-hidden focus:border-neutral-600 font-mono"
                  />
                </div>
              )}

              {/* Stop Sequences */}
              {currentCapabilities.supportsStopSequences && (
                <div>
                  <label className="block text-neutral-300 mb-1">Stop Sequences (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. \n\n, Human:, END"
                    value={stopInput}
                    onChange={e => handleStopChange(e.target.value)}
                    className="w-full bg-[#18181b] border border-neutral-800 rounded-md px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-hidden focus:border-neutral-600 font-mono"
                  />
                </div>
              )}

              {/* Streaming Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-neutral-800/60">
                <span className="text-neutral-300">Stream Responses</span>
                <input
                  type="checkbox"
                  checked={params.stream}
                  onChange={e => updateParams({ stream: e.target.checked })}
                  className="rounded-sm bg-neutral-800 border-neutral-700 text-neutral-200 accent-neutral-300 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
