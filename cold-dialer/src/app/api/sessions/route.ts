import { NextRequest, NextResponse } from 'next/server';
import { startSession, listRecentSessions } from '@/lib/db';
import { SessionStartSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/apiUtils';

export async function GET() {
  try {
    return NextResponse.json({ sessions: listRecentSessions() });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = SessionStartSchema.parse(body);
    const session = startSession(parsed.notes ?? null);
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
