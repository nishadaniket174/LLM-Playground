'use client';

import React, { useState } from 'react';
import { usePlayground } from '@/context/PlaygroundContext';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  GitBranch,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function ChatSidebar({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const {
    conversations,
    currentChatId,
    selectConversation,
    createConversation,
    renameConversation,
    deleteConversation,
    isGenerating,
  } = usePlayground();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  if (!isOpen) {
    return (
      <div className="hidden sm:flex border-r border-neutral-800 bg-[#121214] flex-col items-center py-3 px-1.5 select-none shrink-0">
        <button
          onClick={onToggle}
          title="Open Conversation History"
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="mt-3">
          <button
            onClick={() => createConversation()}
            title="New Conversation"
            className="p-1.5 text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="w-full sm:w-64 md:w-72 h-full bg-[#121214] border-r border-neutral-800 flex flex-col select-none shrink-0 z-20">
      {/* Sidebar Header */}
      <div className="p-2.5 sm:p-3 border-b border-neutral-800 flex items-center justify-between bg-[#161618]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            Conversations
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => createConversation()}
            title="New Chat"
            className="p-1.5 sm:p-1 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onToggle}
            title="Close Sidebar"
            className="p-1.5 sm:p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4 hidden sm:block" />
            <X className="w-4 h-4 sm:hidden" />
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map(chat => {
          const isActive = chat.id === currentChatId;
          const isBranch = chat.title.includes('(Branch)');

          return (
            <div
              key={chat.id}
              onClick={() => {
                selectConversation(chat.id);
                // On mobile screens, auto-close sidebar when selecting conversation
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  onToggle();
                }
              }}
              className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2.5 sm:py-2 text-xs cursor-pointer transition-all border ${
                isActive
                  ? 'bg-neutral-800/90 text-white border-neutral-700 shadow-xs'
                  : 'text-neutral-400 border-transparent hover:bg-neutral-900 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isBranch ? (
                  <GitBranch className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                ) : (
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                )}

                {editingId === chat.id ? (
                  <form
                    onSubmit={e => handleSaveRename(chat.id, e)}
                    className="flex items-center gap-1 flex-1"
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      autoFocus
                      className="w-full bg-[#18181b] border border-neutral-600 rounded px-1.5 py-0.5 text-xs text-white focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={e => handleSaveRename(chat.id, e)}
                      className="text-emerald-400 hover:text-emerald-300 p-0.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRename}
                      className="text-neutral-400 hover:text-neutral-200 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <span className="truncate font-medium">{chat.title}</span>
                )}
              </div>

              {/* Action Buttons on Hover & visible on mobile */}
              {editingId !== chat.id && (
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                  <button
                    onClick={e => handleStartRename(chat.id, chat.title, e)}
                    title="Rename"
                    className="text-neutral-500 hover:text-neutral-200 p-1 rounded hover:bg-neutral-700"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={e => handleDelete(chat.id, e)}
                    title="Delete Chat"
                    className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-neutral-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 sm:p-3 border-t border-neutral-800 text-[11px] text-neutral-500 flex items-center justify-between">
        <span>{conversations.length} conversation{conversations.length === 1 ? '' : 's'}</span>
        {isGenerating && (
          <span className="text-cyan-400 animate-pulse font-mono text-[10px]">Active Stream</span>
        )}
      </div>
    </aside>
  );
}
