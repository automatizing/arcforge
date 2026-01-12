'use client';

import { useClaudeStream } from '@/hooks/useClaudeStream';
import { CodeViewer } from '@/components/CodeViewer';
import { LivePreview } from '@/components/LivePreview';
import { StatusBar } from '@/components/StatusBar';

export default function Home() {
  const { streamingCode, currentPage, isTyping, currentInstruction, version } = useClaudeStream();

  // Show streaming code while typing, otherwise show current page code
  const displayCode = isTyping ? streamingCode : currentPage;

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <h1 className="text-white font-semibold">Claude Live Coding</h1>
              <p className="text-zinc-500 text-xs">Watch AI build in real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/owner"
              className="text-zinc-400 hover:text-white text-sm transition-colors"
            >
              Owner Panel →
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-2 gap-1 p-1 min-h-0">
        {/* Left Panel: Live Preview */}
        <div className="rounded-lg overflow-hidden border border-zinc-800">
          <LivePreview html={currentPage} isTyping={isTyping} />
        </div>

        {/* Right Panel: Code */}
        <div className="rounded-lg overflow-hidden border border-zinc-800">
          <CodeViewer code={displayCode} isTyping={isTyping} />
        </div>
      </main>

      {/* Status Bar */}
      <StatusBar
        isTyping={isTyping}
        version={version}
        currentInstruction={currentInstruction}
      />
    </div>
  );
}
