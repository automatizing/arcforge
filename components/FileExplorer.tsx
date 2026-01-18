'use client';

import { FileState } from '@/hooks/useClaudeStream';

interface FileExplorerProps {
  files: FileState[];
  activeFile: string;
  onFileSelect: (filename: string) => void;
  isTyping: boolean;
}

// File icons by type
const FileIcon = ({ type }: { type: 'html' | 'css' | 'js' }) => {
  const colors = {
    html: 'text-orange-500',
    css: 'text-blue-500',
    js: 'text-yellow-500'
  };

  const icons = {
    html: (
      <svg className={`w-4 h-4 ${colors[type]}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 17.56L16.07 16.43L16.62 10.33H9.38L9.2 8.3H16.8L17 6.31H7L7.56 12.32H14.45L14.22 14.9L12 15.5L9.78 14.9L9.64 13.24H7.64L7.93 16.43L12 17.56M4.07 3H19.93L18.5 19.2L12 21L5.5 19.2L4.07 3Z" />
      </svg>
    ),
    css: (
      <svg className={`w-4 h-4 ${colors[type]}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M5 3L4.35 6.34H17.94L17.5 8.5H3.92L3.26 11.83H16.85L16.09 15.64L10.61 17.45L5.86 15.64L6.19 14H2.85L2.06 18L9.91 21L18.96 18L20.16 11.97L20.4 10.76L21.94 3H5Z" />
      </svg>
    ),
    js: (
      <svg className={`w-4 h-4 ${colors[type]}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 3H21V21H3V3M7.73 18.04C8.13 18.89 8.92 19.59 10.27 19.59C11.77 19.59 12.8 18.79 12.8 17.04V11.26H11.1V17C11.1 17.86 10.75 18.08 10.2 18.08C9.62 18.08 9.38 17.68 9.11 17.21L7.73 18.04M13.71 17.86C14.21 18.84 15.22 19.59 16.8 19.59C18.4 19.59 19.6 18.76 19.6 17.23C19.6 15.82 18.79 15.19 17.35 14.57L16.93 14.39C16.2 14.08 15.89 13.87 15.89 13.37C15.89 12.96 16.2 12.64 16.7 12.64C17.18 12.64 17.5 12.85 17.79 13.37L19.1 12.5C18.55 11.54 17.77 11.17 16.7 11.17C15.19 11.17 14.22 12.13 14.22 13.4C14.22 14.78 15.03 15.43 16.25 15.95L16.67 16.13C17.45 16.47 17.91 16.68 17.91 17.26C17.91 17.74 17.46 18.09 16.76 18.09C15.93 18.09 15.45 17.66 15.09 17.06L13.71 17.86Z" />
      </svg>
    )
  };

  return icons[type];
};

export function FileExplorer({ files, activeFile, onFileSelect, isTyping }: FileExplorerProps) {
  return (
    <div className="bg-zinc-950 border-b border-green-900/30 font-mono">
      {/* Header */}
      <div className="px-3 py-2 text-xs text-green-700 border-b border-green-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-green-600">{'>'}</span>
          <span>FILES</span>
        </div>
        {isTyping && (
          <span className="text-green-500 animate-pulse text-[10px]">WRITING...</span>
        )}
      </div>

      {/* File List */}
      <div className="py-1">
        {files.map((file) => (
          <button
            key={file.name}
            onClick={() => onFileSelect(file.name)}
            className={`w-full px-3 py-1.5 flex items-center gap-2 text-xs transition-colors ${
              activeFile === file.name
                ? 'bg-green-900/30 text-green-400 border-l-2 border-green-500'
                : 'text-green-700 hover:bg-green-900/20 hover:text-green-500 border-l-2 border-transparent'
            }`}
          >
            <FileIcon type={file.type} />
            <span>{file.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
