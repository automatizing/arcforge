import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// File type definition
interface ParsedFile {
  name: string;
  type: 'html' | 'css' | 'js';
  content: string;
}

// Initial files structure
const INITIAL_FILES: ParsedFile[] = [
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

// Combine files into a single HTML for preview
function combineFilesForPreview(files: ParsedFile[]): string {
  const htmlFile = files.find(f => f.name === 'index.html');
  const cssFile = files.find(f => f.name === 'styles.css');
  const jsFile = files.find(f => f.name === 'script.js');

  if (!htmlFile) {
    return '';
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

const INITIAL_COMBINED = combineFilesForPreview(INITIAL_FILES);

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: currentPage, error } = await supabaseAdmin
      .from('page_state')
      .select('content, version, created_at, instruction, files')
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error || !currentPage) {
      return NextResponse.json({
        content: INITIAL_COMBINED,
        files: INITIAL_FILES,
        version: 0,
        created_at: null,
        instruction: null
      });
    }

    // Return files array, or initial files if not present (for backwards compatibility)
    return NextResponse.json({
      ...currentPage,
      files: currentPage.files || INITIAL_FILES
    });

  } catch (error) {
    console.error('Error fetching current page:', error);
    return NextResponse.json({
      content: INITIAL_COMBINED,
      files: INITIAL_FILES,
      version: 0,
      created_at: null,
      instruction: null
    });
  }
}
