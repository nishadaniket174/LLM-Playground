'use client';

import React, { useRef, useEffect, useState } from 'react';
import { usePlayground } from '@/context/PlaygroundContext';
import { Bot, User, Copy, Check, AlertCircle, Edit3, GitBranch, X, Send } from 'lucide-react';

export function ChatMessagesList() {
  const {
    messages,
    isGenerating,
    selectedModel,
    provider,
    editAndRegenerate,
    branchConversation,
  } = usePlayground();

  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEdit = (id: string, currentContent: string) => {
    setEditingMessageId(id);
    setEditText(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const handleSaveAndRegenerate = async (id: string) => {
    if (!editText.trim()) return;
    const content = editText.trim();
    setEditingMessageId(null);
    setEditText('');
    await editAndRegenerate(id, content);
  };

  const handleBranch = (messageId: string) => {
    branchConversation(messageId);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-6 select-none">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 mb-2 sm:mb-3 shadow-inner">
          <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <h3 className="text-xs sm:text-sm font-semibold text-neutral-200">Independent LLM Playground</h3>
        <p className="text-[11px] sm:text-xs text-neutral-500 max-w-sm mt-1 leading-relaxed px-2">
          Select a provider, configure your credentials in the top bar, and start interacting with cloud AI models.
        </p>
        <div className="flex items-center gap-2 mt-3 sm:mt-4 text-[10px] sm:text-[11px] text-neutral-400 bg-neutral-900/60 border border-neutral-800 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-mono max-w-full truncate">
          <span>Active: {provider}</span>
          <span>•</span>
          <span className="text-neutral-300 truncate">{selectedModel}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`flex gap-2 sm:gap-3 max-w-3xl mx-auto ${
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {msg.role === 'assistant' && (
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          )}

          <div
            className={`group relative rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed max-w-[92%] sm:max-w-[85%] ${
              msg.role === 'user'
                ? 'bg-neutral-800 text-neutral-100 border border-neutral-700/60'
                : 'bg-[#18181b] text-neutral-200 border border-neutral-800 shadow-sm'
            }`}
          >
            {/* Message Header & Actions */}
            <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1.5 pb-1 border-b border-neutral-800/40">
              <span className="font-semibold uppercase tracking-wider truncate max-w-[120px] sm:max-w-xs">
                {msg.role === 'assistant' ? selectedModel : 'You'}
              </span>

              {/* Action Toolbar - accessible on touch/mobile without hover requirement */}
              <div className="flex items-center gap-1 sm:gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {/* Branch action available on all messages */}
                <button
                  onClick={() => handleBranch(msg.id)}
                  title="Branch conversation from here"
                  className="flex items-center gap-0.5 sm:gap-1 text-neutral-400 hover:text-cyan-400 p-1 sm:p-0.5 rounded transition-colors"
                >
                  <GitBranch className="w-3 h-3" />
                  <span className="text-[9px] sm:text-[10px]">Branch</span>
                </button>

                {/* Edit action for user messages */}
                {msg.role === 'user' && editingMessageId !== msg.id && (
                  <button
                    onClick={() => handleStartEdit(msg.id, msg.content)}
                    title="Edit and regenerate response"
                    className="flex items-center gap-0.5 sm:gap-1 text-neutral-400 hover:text-amber-300 p-1 sm:p-0.5 rounded transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span className="text-[9px] sm:text-[10px]">Edit</span>
                  </button>
                )}

                {/* Copy action */}
                <button
                  onClick={() => copyToClipboard(msg.content, msg.id)}
                  title="Copy text"
                  className="text-neutral-400 hover:text-neutral-200 p-1 sm:p-0.5 rounded transition-colors"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Content or Inline Edit Box */}
            {editingMessageId === msg.id ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  rows={3}
                  className="w-full bg-[#121214] border border-neutral-600 rounded-md p-2 text-xs sm:text-sm text-white focus:outline-hidden resize-none font-sans"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 px-2.5 py-1.5 sm:py-1 text-xs text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-700 rounded-md transition-colors"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={() => handleSaveAndRegenerate(msg.id)}
                    disabled={!editText.trim()}
                    className="flex items-center gap-1 px-2.5 py-1.5 sm:py-1 text-xs text-neutral-900 font-semibold bg-neutral-200 hover:bg-white disabled:opacity-50 rounded-md transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>Save & Resend</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap font-sans break-words text-xs sm:text-sm">
                {msg.content || (
                  msg.status === 'streaming' ? (
                    <span className="inline-flex items-center gap-1 text-neutral-500 italic">
                      Thinking
                      <span className="animate-pulse">...</span>
                    </span>
                  ) : null
                )}
              </div>
            )}

            {/* Error badge */}
            {msg.status === 'error' && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-red-400 bg-red-950/20 border border-red-900/40 px-2 py-1 rounded">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Generation terminated with an error</span>
              </div>
            )}
          </div>

          {msg.role === 'user' && (
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-neutral-700/70 border border-neutral-600 flex items-center justify-center text-neutral-200 shrink-0 mt-0.5">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
