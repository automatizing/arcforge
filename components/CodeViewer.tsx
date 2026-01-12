'use client';

import Editor from '@monaco-editor/react';

interface CodeViewerProps {
  code: string;
  isTyping: boolean;
}

export function CodeViewer({ code, isTyping }: CodeViewerProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-zinc-900 text-zinc-300 px-4 py-2 text-sm flex items-center justify-between border-b border-zinc-800">
        <span className="flex items-center gap-2">
          <span className="font-mono">index.html</span>
          {isTyping && (
            <span className="flex items-center gap-1 text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Claude is typing...
            </span>
          )}
        </span>
        <span className="text-zinc-500 text-xs">
          {code.length} characters
        </span>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="html"
          value={code}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            padding: { top: 10 }
          }}
        />
      </div>
    </div>
  );
}
