import { NextRequest, NextResponse } from 'next/server';
import { listRecentCalls } from '@/lib/db';
import { handleApiError } from '@/lib/apiUtils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;
    return NextResponse.json({ calls: listRecentCalls(limit) });
  } catch (err) {
    return handleApiError(err);
  }
}
