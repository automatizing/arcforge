'use client';

interface StatusBarProps {
  isTyping: boolean;
  version: number;
  currentInstruction: string | null;
}

export function StatusBar({ isTyping, version, currentInstruction }: StatusBarProps) {
  return (
    <div className="bg-zinc-950 text-zinc-400 px-4 py-3 flex items-center justify-between text-sm border-t border-zinc-800">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`}></div>
          <span>{isTyping ? 'Claude is working...' : 'Idle'}</span>
        </div>
        {currentInstruction && (
          <div className="text-zinc-500 truncate max-w-md">
            Instruction: &quot;{currentInstruction}&quot;
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-zinc-500">
          Version: <span className="text-zinc-300">{version}</span>
        </span>
        <span className="text-zinc-600">
          Powered by Claude
        </span>
      </div>
    </div>
  );
}
