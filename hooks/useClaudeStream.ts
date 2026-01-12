'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ClaudeStreamState {
  streamingCode: string;
  currentPage: string;
  isTyping: boolean;
  currentInstruction: string | null;
  version: number;
}

export function useClaudeStream() {
  const [state, setState] = useState<ClaudeStreamState>({
    streamingCode: '',
    currentPage: '',
    isTyping: false,
    currentInstruction: null,
    version: 0
  });

  // Fetch initial page state
  const fetchCurrentPage = useCallback(async () => {
    try {
      const response = await fetch('/api/page/current');
      const data = await response.json();
      setState(prev => ({
        ...prev,
        currentPage: data.content,
        version: data.version || 0
      }));
    } catch (error) {
      console.error('Error fetching current page:', error);
    }
  }, []);

  useEffect(() => {
    fetchCurrentPage();
  }, [fetchCurrentPage]);

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
              currentInstruction: payload.instruction
            }));
          })
          .on('broadcast', { event: 'chunk' }, ({ payload }) => {
            setState(prev => ({
              ...prev,
              streamingCode: prev.streamingCode + payload.text
            }));
          })
          .on('broadcast', { event: 'complete' }, ({ payload }) => {
            setState(prev => ({
              ...prev,
              isTyping: false,
              currentPage: payload.fullCode,
              streamingCode: '',
              version: payload.version,
              currentInstruction: null
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

  return state;
}
