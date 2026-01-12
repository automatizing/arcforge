'use client';

interface LivePreviewProps {
  html: string;
  isTyping: boolean;
}

export function LivePreview({ html, isTyping }: LivePreviewProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-zinc-900 text-zinc-300 px-4 py-2 text-sm flex items-center justify-between border-b border-zinc-800">
        <span className="flex items-center gap-2">
          <span className="font-mono">Live Preview</span>
          {isTyping && (
            <span className="text-yellow-400 text-xs">(updating when complete)</span>
          )}
        </span>
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
        </div>
      </div>
      <div className="flex-1 bg-white">
        <iframe
          srcDoc={html}
          className="w-full h-full border-0"
          sandbox="allow-scripts"
          title="Live Preview"
        />
      </div>
    </div>
  );
}
