'use client';

import { useState, useEffect } from 'react';
import { useClaudeStream } from '@/hooks/useClaudeStream';

export default function OwnerPage() {
  const [instruction, setInstruction] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { currentPage, isTyping, version } = useClaudeStream();

  // Load API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('owner_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Save API key to localStorage
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem('owner_api_key', value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!apiKey.trim()) {
      setError('API Key is required');
      return;
    }

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
          throw new Error('Invalid API Key');
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

  const exampleInstructions = [
    "Create a beautiful landing page with a hero section that says 'Welcome to the Future'",
    "Add a gradient background that animates smoothly",
    "Create a button that pulses with a glow effect",
    "Build a card grid with 3 feature cards",
    "Add a dark mode toggle in the corner"
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <h1 className="font-semibold">Owner Control Panel</h1>
              <p className="text-zinc-500 text-xs">Send instructions to Claude</p>
            </div>
          </div>
          <a
            href="/"
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            ← Back to Viewer
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Control Panel */}
          <div className="space-y-6">
            {/* API Key */}
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold mb-4">Authentication</h2>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Owner API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="Enter your secret key..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Key is saved locally in your browser
                </p>
              </div>
            </div>

            {/* Instruction Form */}
            <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold mb-4">Send Instruction</h2>

              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-2">
                  What should Claude build?
                </label>
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Describe what you want Claude to create..."
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || isTyping}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : isTyping ? 'Claude is working...' : 'Send to Claude'}
              </button>
            </form>

            {/* Example Instructions */}
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold mb-4">Example Instructions</h2>
              <div className="space-y-2">
                {exampleInstructions.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setInstruction(example)}
                    className="w-full text-left p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
              <div className="bg-zinc-800 px-4 py-2 text-sm text-zinc-400 flex items-center justify-between">
                <span>Current Page Preview</span>
                <span>v{version}</span>
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
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isTyping ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
                <span className="text-sm text-zinc-400">
                  {isTyping ? 'Claude is currently editing the page...' : 'Idle - Ready for instructions'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
