'use client';

import { useState, useEffect } from 'react';
import { useClaudeStream } from '@/hooks/useClaudeStream';

export default function OwnerPage() {
  const [instruction, setInstruction] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { currentPage, isTyping } = useClaudeStream();

  // Check if already authenticated from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('owner_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsAuthenticating(true);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.status === 401) {
        setIsAuthenticated(false);
        setApiKey('');
      } else {
        localStorage.setItem('owner_api_key', apiKey);
        setIsAuthenticated(true);
      }
    } catch {
      // Network error
      setApiKey('');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('owner_api_key');
    setApiKey('');
    setIsAuthenticated(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!instruction.trim()) {
      setError('Instruction is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/claude/instruct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ instruction })
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          throw new Error('Session expired');
        }
        throw new Error('Failed to send instruction');
      }

      const data = await response.json();
      setSuccess(`Instruction sent! New version: ${data.version}`);
      setInstruction('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center">
        <div className="w-full max-w-md p-6">
          <div className="bg-black rounded-lg p-8 border border-green-900/50">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-green-500">$</span>
                <span className="text-green-400 font-bold">arcform</span>
                <span className="text-green-700">/</span>
                <span className="text-green-600">admin</span>
                <span className="text-green-600 animate-pulse">_</span>
              </div>
              <p className="text-green-700 text-xs">authentication required</p>
            </div>

            <form onSubmit={handleAuthenticate}>
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <span className="text-green-700">{'>'}</span>
                <span className="text-green-500">AUTH_CONFIG</span>
              </h2>

              <div className="mb-6">
                <label className="block text-xs text-green-700 mb-2">
                  owner_secret_key:
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="enter_key..."
                  autoFocus
                  className="w-full bg-black border border-green-900/50 rounded px-4 py-3 text-green-400 placeholder-green-900 focus:outline-none focus:border-green-500 focus:shadow-[0_0_10px_rgba(74,222,128,0.2)]"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthenticating || !apiKey.trim()}
                className="w-full bg-green-900/30 border border-green-700/50 text-green-400 font-bold py-3 px-6 rounded hover:bg-green-900/50 hover:border-green-500 hover:shadow-[0_0_15px_rgba(74,222,128,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAuthenticating ? '[ VERIFYING... ]' : '[ AUTHENTICATE ]'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show control panel
  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      {/* Header */}
      <header className="bg-black border-b border-green-900/50 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-green-500">$</span>
              <span className="text-green-400 font-bold">arcform</span>
              <span className="text-green-700">/</span>
              <span className="text-green-600">admin</span>
              <span className="text-green-600 animate-pulse">_</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-green-900/50"></div>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-green-700">[</span>
              <span className="text-green-500">AUTHENTICATED</span>
              <span className="text-green-700">]</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-green-700 hover:text-green-400 text-xs transition-colors"
            >
              [logout]
            </button>
            <a
              href="/"
              className="text-green-700 hover:text-green-400 text-xs transition-colors"
            >
              [viewer]
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Control Panel */}
          <div className="space-y-6">
            {/* Instruction Form */}
            <form onSubmit={handleSubmit} className="bg-black rounded-lg p-6 border border-green-900/50">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <span className="text-green-700">{'>'}</span>
                <span className="text-green-500">SEND_INSTRUCTION</span>
              </h2>

              <div className="mb-4">
                <label className="block text-xs text-green-700 mb-2">
                  instruction_payload:
                </label>
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="describe what to build..."
                  rows={4}
                  className="w-full bg-black border border-green-900/50 rounded px-4 py-3 text-green-400 placeholder-green-900 focus:outline-none focus:border-green-500 focus:shadow-[0_0_10px_rgba(74,222,128,0.2)] resize-none"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded text-red-500 text-xs">
                  <span className="text-red-700">[ERROR]</span> {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-950/30 border border-green-900/50 rounded text-green-400 text-xs">
                  <span className="text-green-600">[SUCCESS]</span> {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || isTyping}
                className="w-full bg-green-900/30 border border-green-700/50 text-green-400 font-bold py-3 px-6 rounded hover:bg-green-900/50 hover:border-green-500 hover:shadow-[0_0_15px_rgba(74,222,128,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '[ SENDING... ]' : isTyping ? '[ CLAUDE_ACTIVE ]' : '[ EXECUTE ]'}
              </button>
            </form>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <div className="bg-black rounded-lg border border-green-900/50 overflow-hidden">
              <div className="bg-green-950/30 px-4 py-2 text-xs text-green-600 flex items-center justify-between border-b border-green-900/50">
                <div className="flex items-center gap-2">
                  <span className="text-green-700">{'>'}</span>
                  <span>OUTPUT_PREVIEW</span>
                </div>
                <span className="text-green-700">rev:<span className="text-green-500">1.72</span></span>
              </div>
              <div className="h-[600px] bg-white">
                <iframe
                  srcDoc={currentPage}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts"
                  title="Preview"
                />
              </div>
            </div>

            {/* Status */}
            <div className="bg-black rounded-lg p-4 border border-green-900/50">
              <div className="flex items-center gap-3">
                <span className="text-green-700">[</span>
                <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-green-900'}`} />
                <span className={`text-xs ${isTyping ? 'text-green-400' : 'text-green-700'}`}>
                  {isTyping ? 'PROCESS_ACTIVE' : 'IDLE'}
                </span>
                <span className="text-green-700">]</span>
                <span className="text-xs text-green-700">
                  {isTyping ? '// claude is editing...' : '// ready for input'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-green-900/50 px-4 py-2 mt-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs">
          <span className="text-green-800">arcform_admin_v1.0</span>
          <span className="text-green-600 animate-pulse">_</span>
        </div>
      </footer>
    </div>
  );
}
