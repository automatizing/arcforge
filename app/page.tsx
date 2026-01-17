'use client';

import { useClaudeStream } from '@/hooks/useClaudeStream';
import { CodeViewer } from '@/components/CodeViewer';
import { LivePreview } from '@/components/LivePreview';
import { StatusBar } from '@/components/StatusBar';

export default function Home() {
  const { streamingCode, currentPage, isTyping, currentInstruction } = useClaudeStream();

  // Show streaming code while typing, otherwise show current page code
  const displayCode = isTyping ? streamingCode : currentPage;

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header - Terminal Style */}
      <header className="bg-black border-b border-green-900/50 px-6 py-3 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Terminal prompt style logo */}
            <div className="flex items-center gap-2">
              <span className="text-green-500">$</span>
              <span className="text-green-400 font-bold tracking-tight">arcform</span>
              <span className="text-green-600 animate-pulse">_</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-green-900/50"></div>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-green-700">[</span>
              <span className="text-green-500">STREAMING</span>
              <span className="text-green-700">]</span>
              <span className="text-green-600/70">real-time AI coding session</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 hover:text-green-400 transition-colors text-xs flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span className="hidden md:inline">twitter</span>
              </a>
            </div>
            <div className="h-4 w-px bg-green-900/50"></div>
            <a
              href="/owner"
              className="text-green-700 hover:text-green-400 text-xs transition-colors font-mono"
            >
              [admin]
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-2 gap-1 p-1 min-h-0">
        {/* Left Panel: Live Preview */}
        <div className="rounded-lg overflow-hidden border border-green-900/30">
          <LivePreview html={currentPage} isTyping={isTyping} />
        </div>

        {/* Right Panel: Code */}
        <div className="rounded-lg overflow-hidden border border-green-900/30">
          <CodeViewer code={displayCode} isTyping={isTyping} />
        </div>
      </main>

      {/* Status Bar */}
      <StatusBar
        isTyping={isTyping}
        currentInstruction={currentInstruction}
      />
    </div>
  );
}
