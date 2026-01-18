'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// File type definition
export interface FileState {
  name: string;
  type: 'html' | 'css' | 'js';
  content: string;
}

// Initial files
const INITIAL_FILES: FileState[] = [
  { name: 'index.html', type: 'html', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Canvas</title>\n</head>\n<body>\n  <p>Waiting for Claude to start...</p>\n</body>\n</html>' },
  { name: 'styles.css', type: 'css', content: '/* CSS styles will appear here */' },
  { name: 'script.js', type: 'js', content: '// JavaScript will appear here' }
];

// Phase information
export interface PhaseInfo {
  phaseId: string;
  phaseName: string;
  phaseDescription: string;
  phaseIndex: number;
  totalPhases: number;
}

interface ClaudeStreamState {
  streamingCode: string;
  streamingFiles: FileState[];
  currentPage: string;
  currentFiles: FileState[];
  activeFile: string;
  isTyping: boolean;
  currentInstruction: string | null;
  version: number;
  // Phase-related state
  currentPhase: PhaseInfo | null;
  totalPhases: number;
}

// Parse streaming content into files (during streaming)
function parseStreamingFiles(rawContent: string): FileState[] {
  const files: FileState[] = [];
  const fileRegex = /===FILE:([^=]+)===([\s\S]*?)(?:===ENDFILE===|$)/g;

  let match;
  while ((match = fileRegex.exec(rawContent)) !== null) {
    const filename = match[1].trim();
    const content = match[2].trim();

    let type: 'html' | 'css' | 'js' = 'html';
    if (filename.endsWith('.css')) type = 'css';
    else if (filename.endsWith('.js')) type = 'js';

    files.push({ name: filename, type, content });
  }

  return files;
}

// Combine files into HTML for preview
function combineFilesForPreview(files: FileState[]): string {
  const htmlFile = files.find(f => f.name === 'index.html');
  const cssFile = files.find(f => f.name === 'styles.css');
  const jsFile = files.find(f => f.name === 'script.js');

  if (!htmlFile) return '';

  let html = htmlFile.content;

  if (cssFile && cssFile.content.trim()) {
    const styleTag = `<style>\n${cssFile.content}\n</style>`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${styleTag}\n</head>`);
    } else {
      html = styleTag + '\n' + html;
    }
  }

  if (jsFile && jsFile.content.trim()) {
    const scriptTag = `<script>\n${jsFile.content}\n</script>`;
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${scriptTag}\n</body>`);
    } else {
      html = html + '\n' + scriptTag;
    }
  }

  return html;
}

export function useClaudeStream() {
  const [state, setState] = useState<ClaudeStreamState>({
    streamingCode: '',
    streamingFiles: [],
    currentPage: '',
    currentFiles: INITIAL_FILES,
    activeFile: 'index.html',
    isTyping: false,
    currentInstruction: null,
    version: 0,
    currentPhase: null,
    totalPhases: 0
  });

  // Fetch initial page state
  const fetchCurrentPage = useCallback(async () => {
    try {
      const response = await fetch('/api/page/current');
      const data = await response.json();
      setState(prev => ({
        ...prev,
        currentPage: data.content,
        currentFiles: data.files || INITIAL_FILES,
        version: data.version || 0
      }));
    } catch (error) {
      console.error('Error fetching current page:', error);
    }
  }, []);

  useEffect(() => {
    fetchCurrentPage();
  }, [fetchCurrentPage]);

  // Set active file
  const setActiveFile = useCallback((filename: string) => {
    setState(prev => ({ ...prev, activeFile: filename }));
  }, []);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let supabase: ReturnType<typeof getSupabase> | null = null;

    const setupRealtime = async () => {
      try {
        supabase = getSupabase();
        channel = supabase.channel('claude-typing');

        channel
          .on('broadcast', { event: 'start' }, ({ payload }) => {
            setState(prev => ({
              ...prev,
              isTyping: true,
              streamingCode: '',
              streamingFiles: [],
              currentInstruction: payload.instruction,
              totalPhases: payload.totalPhases || 1,
              currentPhase: null
            }));
          })
          .on('broadcast', { event: 'phase_start' }, ({ payload }) => {
            setState(prev => ({
              ...prev,
              streamingCode: '',
              streamingFiles: [],
              currentPhase: {
                phaseId: payload.phaseId,
                phaseName: payload.phaseName,
                phaseDescription: payload.phaseDescription,
                phaseIndex: payload.phaseIndex,
                totalPhases: payload.totalPhases
              }
            }));
          })
          .on('broadcast', { event: 'chunk' }, ({ payload }) => {
            setState(prev => {
              const newStreamingCode = prev.streamingCode + payload.text;
              const newStreamingFiles = parseStreamingFiles(newStreamingCode);
              return {
                ...prev,
                streamingCode: newStreamingCode,
                streamingFiles: newStreamingFiles.length > 0 ? newStreamingFiles : prev.streamingFiles
              };
            });
          })
          .on('broadcast', { event: 'phase_complete' }, ({ payload }) => {
            // Update with phase results, but keep typing state
            setState(prev => ({
              ...prev,
              currentPage: payload.combinedHtml,
              currentFiles: payload.files || prev.currentFiles,
              streamingCode: '',
              streamingFiles: []
            }));
          })
          .on('broadcast', { event: 'complete' }, ({ payload }) => {
            setState(prev => ({
              ...prev,
              isTyping: false,
              currentPage: payload.combinedHtml || payload.fullCode,
              currentFiles: payload.files || prev.currentFiles,
              streamingCode: '',
              streamingFiles: [],
              version: payload.version,
              currentInstruction: null,
              currentPhase: null
            }));
          });

        await channel.subscribe();
      } catch (error) {
        console.error('Error setting up realtime:', error);
      }
    };

    setupRealtime();

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Compute display values
  const displayFiles = state.isTyping && state.streamingFiles.length > 0
    ? state.streamingFiles
    : state.currentFiles;

  const displayHtml = state.isTyping && state.streamingFiles.length > 0
    ? combineFilesForPreview(state.streamingFiles)
    : state.currentPage;

  return {
    ...state,
    displayFiles,
    displayHtml,
    setActiveFile
  };
}
