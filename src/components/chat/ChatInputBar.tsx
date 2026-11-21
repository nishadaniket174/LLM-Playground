'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePlayground } from '@/context/PlaygroundContext';
import { Send, Square, AlertCircle, X } from 'lucide-react';

export function ChatInputBar() {
  const { sendMessage, stopGeneration, isGenerating, error, clearError } = usePlayground();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    sendMessage(input);
    setInput('');
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  return (
    <div className="p-2 sm:p-4 border-t border-neutral-800 bg-[#121214] shrink-0">
      {/* Readable Error Banner if present */}
      {error && (
        <div className="max-w-3xl mx-auto mb-2 sm:mb-3 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center justify-between text-xs text-red-300">
          <div className="flex items-center gap-2 truncate">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="truncate">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-200 shrink-0 ml-2 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input box */}
      <div className="max-w-3xl mx-auto flex items-end gap-1.5 sm:gap-2 bg-[#18181b] border border-neutral-800 rounded-xl p-1.5 sm:p-2 focus-within:border-neutral-600 transition-colors shadow-sm">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or provide input..."
          rows={1}
          disabled={isGenerating}
          className="flex-1 bg-transparent border-0 px-2 py-1.5 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-hidden resize-none leading-relaxed"
        />

        {isGenerating ? (
          <button
            type="button"
            onClick={stopGeneration}
            title="Stop generation"
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-red-900/60 hover:bg-red-800/80 text-red-200 text-xs font-medium rounded-lg transition-colors shrink-0"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span className="hidden xs:inline">Stop</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            title="Send prompt"
            className="p-2 sm:p-2.5 bg-neutral-200 hover:bg-white disabled:opacity-40 disabled:hover:bg-neutral-200 text-neutral-900 rounded-lg transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      <div className="text-center text-[10px] text-neutral-600 mt-1 sm:mt-2 hidden sm:block">
        Independent BYOK inference • No local weights or servers required
      </div>
    </div>
  );
}
