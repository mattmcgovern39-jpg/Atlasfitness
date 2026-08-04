import { NextRequest, NextResponse } from 'next/server';
import { endSession, getSession } from '@/lib/db';
import { handleApiError, jsonError } from '@/lib/apiUtils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = getSession(id);
    if (!session) return jsonError('Session not found', 404);
    return NextResponse.json({ session });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = getSession(id);
    if (!existing) return jsonError('Session not found', 404);
    const session = endSession(id);
    return NextResponse.json({ session });
  } catch (err) {
    return handleApiError(err);
  }
}
