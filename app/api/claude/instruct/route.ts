import { NextRequest, NextResponse } from 'next/server';
import { anthropic, SYSTEM_PROMPT } from '@/lib/anthropic';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { BUILD_PHASES, getPhasePrompt } from '@/lib/build-phases';

export const dynamic = 'force-dynamic';

const OWNER_SECRET_KEY = process.env.OWNER_SECRET_KEY;

// Generic system prompt for modifications (not first build)
const MODIFICATION_SYSTEM_PROMPT = `You are a web developer assistant that modifies existing pages.

## OUTPUT FORMAT - CRITICAL
Output EXACTLY 3 files with these delimiters. NO text before or after. NO markdown. NO explanations.

===FILE:index.html===
[your HTML here - NO style or script tags]
===ENDFILE===

===FILE:styles.css===
[your CSS here]
===ENDFILE===

===FILE:script.js===
[your JavaScript here]
===ENDFILE===

## RULES
- Modify the existing files based on the user's request
- Keep what works, change only what's needed
- Do NOT use template literals (backticks) - use string concatenation with +
- Do NOT use placeholder image services
- Output complete files, not partial changes
- If the user asks for a completely new page, create it from scratch`;

// File parsing types
interface ParsedFile {
  name: string;
  type: 'html' | 'css' | 'js';
  content: string;
}

// Parse multi-file output from Claude
function parseFiles(rawOutput: string): ParsedFile[] {
  const files: ParsedFile[] = [];
  const fileRegex = /===FILE:([^=]+)===([\s\S]*?)===ENDFILE===/g;

  let match;
  while ((match = fileRegex.exec(rawOutput)) !== null) {
    const filename = match[1].trim();
    const content = match[2].trim();

    let type: 'html' | 'css' | 'js' = 'html';
    if (filename.endsWith('.css')) type = 'css';
    else if (filename.endsWith('.js')) type = 'js';

    files.push({ name: filename, type, content });
  }

  // If no files found with delimiters, treat entire output as single HTML file (backwards compatibility)
  if (files.length === 0 && rawOutput.trim().startsWith('<!DOCTYPE')) {
    files.push({ name: 'index.html', type: 'html', content: rawOutput.trim() });
  }

  return files;
}

// Combine files into a single HTML for preview
function combineFilesForPreview(files: ParsedFile[]): string {
  const htmlFile = files.find(f => f.name === 'index.html');
  const cssFile = files.find(f => f.name === 'styles.css');
  const jsFile = files.find(f => f.name === 'script.js');

  if (!htmlFile) {
    return getInitialFiles()[0].content;
  }

  let html = htmlFile.content;

  // Inject CSS before </head>
  if (cssFile && cssFile.content.trim()) {
    const styleTag = `<style>\n${cssFile.content}\n</style>`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${styleTag}\n</head>`);
    } else {
      html = styleTag + '\n' + html;
    }
  }

  // Inject JS before </body>
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

// Get initial file structure
function getInitialFiles(): ParsedFile[] {
  return [
    {
      name: 'index.html',
      type: 'html',
      content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canvas</title>
</head>
<body>
  <p>Waiting for Claude to start...</p>
</body>
</html>`
    },
    {
      name: 'styles.css',
      type: 'css',
      content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  min-height: 100vh;
  font-family: system-ui, sans-serif;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}`
    },
    {
      name: 'script.js',
      type: 'js',
      content: `// JavaScript will appear here`
    }
  ];
}

// Execute a single phase
async function executePhase(
  channel: ReturnType<ReturnType<typeof getSupabaseAdmin>['channel']>,
  currentFiles: ParsedFile[],
  phaseId: string,
  phaseName: string,
  phaseDescription: string,
  userInstruction: string,
  phaseIndex: number,
  totalPhases: number
): Promise<ParsedFile[]> {
  // Broadcast phase start
  await channel.send({
    type: 'broadcast',
    event: 'phase_start',
    payload: {
      phaseId,
      phaseName,
      phaseDescription,
      phaseIndex,
      totalPhases
    }
  });

  // Small delay for UI to update
  await new Promise(resolve => setTimeout(resolve, 500));

  const phasePrompt = getPhasePrompt(phaseId, userInstruction);

  let fullResponse = '';
  // Character-by-character streaming for ~30 min builds
  // ~10,000 chars total × 150ms per char = 1,500,000ms = 25 min base
  // + ~500 newlines × 400ms extra = 200,000ms = 3.3 min extra
  // Total: ~28-30 min
  const CHUNK_DELAY_MS = 150; // 150ms per character for smooth typing effect
  const NEWLINE_EXTRA_DELAY_MS = 400; // Extra 400ms on newlines for dramatic pauses

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Current files:\n\n${currentFiles.map(f => `===FILE:${f.name}===\n${f.content}\n===ENDFILE===`).join('\n\n')}\n\n${phasePrompt}`
      }
    ]
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      const text = event.delta.text;
      fullResponse += text;

      // Send character by character for dramatic typing effect
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        await channel.send({
          type: 'broadcast',
          event: 'chunk',
          payload: { text: char, phaseId }
        });
        // Extra delay on newlines for dramatic pauses
        const delay = char === '\n' ? CHUNK_DELAY_MS + NEWLINE_EXTRA_DELAY_MS : CHUNK_DELAY_MS;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Parse the response
  const parsedFiles = parseFiles(fullResponse);

  // Broadcast phase complete with updated files
  const combinedHtml = combineFilesForPreview(parsedFiles);
  await channel.send({
    type: 'broadcast',
    event: 'phase_complete',
    payload: {
      phaseId,
      phaseName,
      files: parsedFiles,
      combinedHtml,
      phaseIndex,
      totalPhases
    }
  });

  // Pause between phases for dramatic effect and to let users see the result
  // 30 seconds pause between phases for maximum drama
  await new Promise(resolve => setTimeout(resolve, 30000));

  return parsedFiles;
}

// Execute direct mode (no phases) for modifications
async function executeDirectMode(
  channel: ReturnType<ReturnType<typeof getSupabaseAdmin>['channel']>,
  currentFiles: ParsedFile[],
  userInstruction: string
): Promise<ParsedFile[]> {
  let fullResponse = '';
  // Character-by-character streaming (same delays as phase execution)
  const CHUNK_DELAY_MS = 150; // 150ms per character for smooth typing effect
  const NEWLINE_EXTRA_DELAY_MS = 400; // Extra 400ms on newlines for dramatic pauses

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: MODIFICATION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Current files:\n\n${currentFiles.map(f => `===FILE:${f.name}===\n${f.content}\n===ENDFILE===`).join('\n\n')}\n\nUser request: ${userInstruction}\n\nRemember: Output ONLY the 3 files with delimiters. No explanations.`
      }
    ]
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      const text = event.delta.text;
      fullResponse += text;

      // Send character by character for dramatic typing effect
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        await channel.send({
          type: 'broadcast',
          event: 'chunk',
          payload: { text: char }
        });
        // Extra delay on newlines for dramatic pauses
        const delay = char === '\n' ? CHUNK_DELAY_MS + NEWLINE_EXTRA_DELAY_MS : CHUNK_DELAY_MS;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return parseFiles(fullResponse);
}

// Background execution function - runs after response is sent
async function executeInBackground(
  instruction: string,
  currentFiles: ParsedFile[],
  currentVersion: number,
  isFirstBuild: boolean
) {
  const supabaseAdmin = getSupabaseAdmin();

  // Setup broadcast channel
  const channel = supabaseAdmin.channel('claude-typing');

  try {
    // Subscribe and wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Channel subscription timeout')), 10000);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          resolve();
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout);
          reject(new Error('Failed to subscribe to channel'));
        }
      });
    });

    // Broadcast that Claude is starting
    await channel.send({
      type: 'broadcast',
      event: 'start',
      payload: {
        instruction,
        totalPhases: isFirstBuild ? BUILD_PHASES.length : 1,
        isFirstBuild
      }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    let files = currentFiles;

    if (isFirstBuild) {
      // First build: Execute each phase sequentially with Polymarket prompts
      for (let i = 0; i < BUILD_PHASES.length; i++) {
        const phase = BUILD_PHASES[i];
        files = await executePhase(
          channel,
          files,
          phase.id,
          phase.name,
          phase.description,
          instruction,
          i + 1,
          BUILD_PHASES.length
        );
      }
    } else {
      // Modification: Direct mode without phases
      files = await executeDirectMode(channel, files, instruction);
    }

    // Save final page state
    const combinedHtml = combineFilesForPreview(files);
    const newVersion = currentVersion + 1;
    await supabaseAdmin
      .from('page_state')
      .insert({
        content: combinedHtml,
        version: newVersion,
        instruction,
        files: files
      });

    // Broadcast final completion
    await channel.send({
      type: 'broadcast',
      event: 'complete',
      payload: {
        files: files,
        combinedHtml,
        version: newVersion
      }
    });

  } catch (error) {
    console.error('Background execution error:', error);
    // Try to broadcast error to clients
    try {
      await channel.send({
        type: 'broadcast',
        event: 'error',
        payload: { message: 'Build failed' }
      });
    } catch {
      // Ignore broadcast error
    }
  } finally {
    // Cleanup channel
    try {
      await supabaseAdmin.removeChannel(channel);
    } catch {
      // Ignore cleanup error
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate owner authentication
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== OWNER_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { instruction } = await request.json();

    if (!instruction || typeof instruction !== 'string') {
      return NextResponse.json({ error: 'Instruction is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get current page state from Supabase
    const { data: currentPage } = await supabaseAdmin
      .from('page_state')
      .select('content, version, files')
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const initialFiles = getInitialFiles();
    const currentFiles: ParsedFile[] = currentPage?.files || initialFiles;
    const currentVersion = currentPage?.version || 0;
    const isFirstBuild = currentVersion === 0;

    // Start background execution WITHOUT awaiting
    // This allows the response to return immediately while processing continues
    executeInBackground(instruction, currentFiles, currentVersion, isFirstBuild);

    // Return immediately - the streaming happens via Supabase Realtime
    return NextResponse.json({
      success: true,
      message: 'Build started',
      isFirstBuild
    });

  } catch (error) {
    console.error('Error in instruct route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

