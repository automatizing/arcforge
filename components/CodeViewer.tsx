'use client';

import Editor from '@monaco-editor/react';
import { FileState } from '@/hooks/useClaudeStream';

interface CodeViewerProps {
  files: FileState[];
  activeFile: string;
  isTyping: boolean;
}

// Map file type to Monaco language
const getLanguage = (type: 'html' | 'css' | 'js'): string => {
  const languages = {
    html: 'html',
    css: 'css',
    js: 'javascript'
  };
  return languages[type];
};

export function CodeViewer({ files, activeFile, isTyping }: CodeViewerProps) {
  const currentFile = files.find(f => f.name === activeFile) || files[0];
  const code = currentFile?.content || '';
  const language = currentFile ? getLanguage(currentFile.type) : 'html';

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header with file info */}
      <div className="bg-zinc-900 text-zinc-300 px-4 py-2 text-sm flex items-center justify-between border-b border-green-900/30">
        <span className="flex items-center gap-2">
          <span className="font-mono text-green-400">{activeFile}</span>
          {isTyping && (
            <span className="flex items-center gap-1 text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs">typing...</span>
            </span>
          )}
        </span>
        <span className="text-green-700 text-xs">
          {code.length} chars
        </span>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
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
