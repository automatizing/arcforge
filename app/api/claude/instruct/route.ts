import { NextRequest, NextResponse } from 'next/server';
import { anthropic, SYSTEM_PROMPT } from '@/lib/anthropic';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const OWNER_SECRET_KEY = process.env.OWNER_SECRET_KEY;

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
      .select('content, version')
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const currentContent = currentPage?.content || getInitialPage();
    const currentVersion = currentPage?.version || 0;

    // Broadcast that Claude is starting to type
    const channel = supabaseAdmin.channel('claude-typing');
    await channel.subscribe();

    await channel.send({
      type: 'broadcast',
      event: 'start',
      payload: { instruction }
    });

    // Call Claude with streaming
    let fullResponse = '';

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Current page code:\n\`\`\`html\n${currentContent}\n\`\`\`\n\nInstruction: ${instruction}`
        }
      ]
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        fullResponse += text;

        // Broadcast each chunk
        await channel.send({
          type: 'broadcast',
          event: 'chunk',
          payload: { text }
        });
      }
    }

    // Save new page state
    const newVersion = currentVersion + 1;
    await supabaseAdmin
      .from('page_state')
      .insert({
        content: fullResponse,
        version: newVersion,
        instruction
      });

    // Broadcast completion
    await channel.send({
      type: 'broadcast',
      event: 'complete',
      payload: {
        fullCode: fullResponse,
        version: newVersion
      }
    });

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

function getInitialPage(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canvas</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      font-family: system-ui, sans-serif;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }
  </style>
</head>
<body>
  <p>Waiting for Claude to start...</p>
</body>
</html>`;
}
