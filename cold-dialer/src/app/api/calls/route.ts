import { NextRequest, NextResponse } from 'next/server';
import { logCall, getLead } from '@/lib/db';
import { CallInputSchema } from '@/lib/validation';
import { handleApiError, jsonError } from '@/lib/apiUtils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CallInputSchema.parse(body);

    const lead = getLead(parsed.lead_id);
    if (!lead) return jsonError('Lead not found', 404);

    const call = logCall(parsed);
    return NextResponse.json({ call }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
