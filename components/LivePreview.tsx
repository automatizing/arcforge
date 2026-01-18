'use client';

interface LivePreviewProps {
  html: string;
  isTyping: boolean;
}

export function LivePreview({ html, isTyping }: LivePreviewProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-zinc-900 text-zinc-300 px-4 py-2 text-sm flex items-center justify-between border-b border-green-900/30">
        <span className="flex items-center gap-2">
          <span className="font-mono text-green-400">Live Preview</span>
          {isTyping && (
            <span className="flex items-center gap-1 text-green-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs">updating...</span>
            </span>
          )}
        </span>
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
        </div>
      </div>
      <div className="flex-1 bg-white">
        <iframe
          srcDoc={html}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          title="Live Preview"
        />
      </div>
    </div>
  );
}
