import { NextRequest, NextResponse } from 'next/server';
import { anthropic, SYSTEM_PROMPT } from '@/lib/anthropic';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { BUILD_PHASES, getPhasePrompt } from '@/lib/build-phases';

export const dynamic = 'force-dynamic';

const OWNER_SECRET_KEY = process.env.OWNER_SECRET_KEY;

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
  let chunkBuffer = '';
  const BUFFER_SIZE = 3;

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
      chunkBuffer += text;

      if (chunkBuffer.length >= BUFFER_SIZE || chunkBuffer.includes('\n')) {
        await channel.send({
          type: 'broadcast',
          event: 'chunk',
          payload: { text: chunkBuffer, phaseId }
        });
        chunkBuffer = '';
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }

  // Send remaining buffer
  if (chunkBuffer.length > 0) {
    await channel.send({
      type: 'broadcast',
      event: 'chunk',
      payload: { text: chunkBuffer, phaseId }
    });
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
  await new Promise(resolve => setTimeout(resolve, 2000));

  return parsedFiles;
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
    let currentFiles: ParsedFile[] = currentPage?.files || initialFiles;
    const currentVersion = currentPage?.version || 0;

    // Setup broadcast channel
    const channel = supabaseAdmin.channel('claude-typing');

    // Subscribe and wait for connection
    await new Promise<void>((resolve, reject) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          resolve();
        } else if (status === 'CHANNEL_ERROR') {
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
        totalPhases: BUILD_PHASES.length
      }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Execute each phase sequentially
    for (let i = 0; i < BUILD_PHASES.length; i++) {
      const phase = BUILD_PHASES[i];
      currentFiles = await executePhase(
        channel,
        currentFiles,
        phase.id,
        phase.name,
        phase.description,
        instruction,
        i + 1,
        BUILD_PHASES.length
      );
    }

    // Save final page state
    const combinedHtml = combineFilesForPreview(currentFiles);
    const newVersion = currentVersion + 1;
    await supabaseAdmin
      .from('page_state')
      .insert({
        content: combinedHtml,
        version: newVersion,
        instruction,
        files: currentFiles
      });

    // Broadcast final completion
    await channel.send({
      type: 'broadcast',
      event: 'complete',
      payload: {
        files: currentFiles,
        combinedHtml,
        version: newVersion
      }
    });

    // Cleanup channel
    await supabaseAdmin.removeChannel(channel);

    return NextResponse.json({
      success: true,
      version: newVersion
    });

  } catch (error) {
    console.error('Error in instruct route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

