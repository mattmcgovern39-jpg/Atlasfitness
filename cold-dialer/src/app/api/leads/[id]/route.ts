import { NextRequest, NextResponse } from 'next/server';
import { getLead, updateLead } from '@/lib/db';
import { LeadUpdateSchema } from '@/lib/validation';
import { handleApiError, jsonError } from '@/lib/apiUtils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const lead = getLead(id);
    if (!lead) return jsonError('Lead not found', 404);
    return NextResponse.json({ lead });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = getLead(id);
    if (!existing) return jsonError('Lead not found', 404);

    const body = await req.json();
    const parsed = LeadUpdateSchema.parse(body);

    const patch: Record<string, unknown> = { ...parsed };
    if (typeof parsed.do_not_call === 'boolean') {
      patch.do_not_call = parsed.do_not_call ? 1 : 0;
    }
    if (parsed.tags) patch.tags = JSON.stringify(parsed.tags);

    const lead = updateLead(id, patch);
    return NextResponse.json({ lead });
  } catch (err) {
    return handleApiError(err);
  }
}
