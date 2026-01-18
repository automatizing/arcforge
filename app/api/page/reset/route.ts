import { NextRequest, NextResponse } from 'next/server';
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

    const supabaseAdmin = getSupabaseAdmin();

    // Delete all page_state records
    const { error } = await supabaseAdmin
      .from('page_state')
      .delete()
      .gte('version', 0); // Delete all records

    if (error) {
      console.error('Error resetting page state:', error);
      return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Page state reset successfully' });

  } catch (error) {
    console.error('Error in reset route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
