import { NextRequest, NextResponse } from 'next/server';

const OWNER_SECRET_KEY = process.env.OWNER_SECRET_KEY;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || token !== OWNER_SECRET_KEY) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true });
}
