'use client';

import React, { useState } from 'react';
import { PlaygroundProvider } from '@/context/PlaygroundContext';
import { PlaygroundHeader } from '@/components/chat/PlaygroundHeader';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatMessagesList } from '@/components/chat/ChatMessagesList';
import { ChatInputBar } from '@/components/chat/ChatInputBar';
import { ConfigurationPanel } from '@/components/config/ConfigurationPanel';

function PlaygroundApp() {
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0d0f] text-neutral-200">
      {/* Top Header */}
      <PlaygroundHeader
        isConfigOpen={isConfigOpen}
        toggleConfig={() => setIsConfigOpen(!isConfigOpen)}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat History & Management Sidebar */}
        <ChatSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Center: Chat Canvas */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0e0e11]">
          <ChatMessagesList />
          <ChatInputBar />
        </main>

        {/* Right: LM Studio inspired Inspector / Parameters Panel */}
        {isConfigOpen && <ConfigurationPanel />}
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
