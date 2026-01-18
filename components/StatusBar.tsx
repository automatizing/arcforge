'use client';

import { PhaseInfo } from '@/hooks/useClaudeStream';

interface StatusBarProps {
  isTyping: boolean;
  currentInstruction: string | null;
  currentPhase?: PhaseInfo | null;
}

export function StatusBar({ isTyping, currentInstruction, currentPhase }: StatusBarProps) {
  return (
    <div className="bg-black text-green-600 px-4 py-2 flex items-center justify-between text-xs font-mono border-t border-green-900/50">
      <div className="flex items-center gap-4">
        {/* Process status */}
        <div className="flex items-center gap-2">
          <span className="text-green-700">[</span>
          <div className={`w-1.5 h-1.5 rounded-full ${isTyping ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-green-900'}`}></div>
          <span className={isTyping ? 'text-green-400' : 'text-green-700'}>
            {isTyping ? 'PROCESS_ACTIVE' : 'IDLE'}
          </span>
          <span className="text-green-700">]</span>
        </div>

        {/* Phase indicator */}
        {currentPhase && (
          <div className="flex items-center gap-2">
            <span className="text-green-700">[</span>
            <span className="text-yellow-500">PHASE {currentPhase.phaseIndex}/{currentPhase.totalPhases}</span>
            <span className="text-green-700">]</span>
            <span className="text-green-500">{currentPhase.phaseName}</span>
          </div>
        )}

        {/* Current instruction (only show if no phase is active) */}
        {currentInstruction && !currentPhase && (
          <div className="flex items-center gap-2 text-green-600/70 truncate max-w-md">
            <span className="text-green-700">{'>'}</span>
            <span className="truncate">{currentInstruction}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Version */}
        <div className="flex items-center gap-1">
          <span className="text-green-700">rev:</span>
          <span className="text-green-500">1.72</span>
        </div>

        {/* Separator */}
        <span className="text-green-900">|</span>

        {/* Powered by */}
        <div className="flex items-center gap-1">
          <span className="text-green-800">powered_by:</span>
          <span className="text-green-600">claude</span>
        </div>

        {/* Blinking cursor */}
        <span className="text-green-500 animate-pulse">_</span>
      </div>
    </div>
  );
}
