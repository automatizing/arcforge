import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const INITIAL_PAGE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Canvas</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      font-family: system-ui, sans-serif;
      background: #fafafa;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }
  </style>
</head>
<body>
  <p>Waiting for Claude to start creating...</p>
</body>
</html>`;

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: currentPage, error } = await supabaseAdmin
      .from('page_state')
      .select('content, version, created_at, instruction')
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error || !currentPage) {
      return NextResponse.json({
        content: INITIAL_PAGE,
        version: 0,
        created_at: null,
        instruction: null
      });
    }

    return NextResponse.json(currentPage);

  } catch (error) {
    console.error('Error fetching current page:', error);
    return NextResponse.json({
      content: INITIAL_PAGE,
      version: 0,
      created_at: null,
      instruction: null
    });
  }
}
