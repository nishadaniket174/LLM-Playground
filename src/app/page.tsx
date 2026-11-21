'use client';

import React, { useState } from 'react';
import { PlaygroundProvider } from '@/context/PlaygroundContext';
import { PlaygroundHeader } from '@/components/chat/PlaygroundHeader';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatMessagesList } from '@/components/chat/ChatMessagesList';
import { ChatInputBar } from '@/components/chat/ChatInputBar';
import { ConfigurationPanel } from '@/components/config/ConfigurationPanel';

function PlaygroundApp() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-[#0d0d0f] text-neutral-200">
      {/* Top Header */}
      <PlaygroundHeader
        isConfigOpen={isConfigOpen}
        toggleConfig={() => {
          setIsConfigOpen(!isConfigOpen);
          if (!isConfigOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
            setIsSidebarOpen(false);
          }
        }}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => {
          setIsSidebarOpen(!isSidebarOpen);
          if (!isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
            setIsConfigOpen(false);
          }
        }}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Chat History & Management Sidebar */}
        <div
          className={`h-full ${
            isSidebarOpen
              ? 'absolute sm:relative inset-y-0 left-0 z-30 w-full sm:w-auto shadow-2xl sm:shadow-none'
              : 'hidden sm:flex sm:w-auto'
          }`}
        >
          <ChatSidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </div>

        {/* Center: Main Chat Canvas (always accessible; full width on mobile) */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0e0e11] w-full h-full relative z-10">
          <ChatMessagesList />
          <ChatInputBar />
        </main>

        {/* Right: LM Studio inspired Inspector / Parameters Panel */}
        <div
          className={`h-full ${
            isConfigOpen
              ? 'absolute sm:relative inset-y-0 right-0 z-30 w-full sm:w-auto shadow-2xl sm:shadow-none'
              : 'hidden'
          }`}
        >
          {isConfigOpen && (
            <ConfigurationPanel onClose={() => setIsConfigOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <PlaygroundProvider>
      <PlaygroundApp />
    </PlaygroundProvider>
  );
}
