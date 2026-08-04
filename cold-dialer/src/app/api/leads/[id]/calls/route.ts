import { NextRequest, NextResponse } from 'next/server';
import { getLead, listCallsForLead } from '@/lib/db';
import { handleApiError, jsonError } from '@/lib/apiUtils';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = getLead(id);
    if (!lead) return jsonError('Lead not found', 404);
    const calls = listCallsForLead(id);
    return NextResponse.json({ calls });
  } catch (err) {
    return handleApiError(err);
  }
}
