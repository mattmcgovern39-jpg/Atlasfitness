import { NextRequest, NextResponse } from 'next/server';
import { createLead, listLeads } from '@/lib/db';
import { LeadInputSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/apiUtils';
import { isValidPhone } from '@/lib/phone';
import type { LeadStatus } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const result = listLeads({
      search: searchParams.get('search') ?? undefined,
      status: (searchParams.get('status') as LeadStatus | null) ?? undefined,
      dueOnly: searchParams.get('dueOnly') === 'true',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LeadInputSchema.parse(body);

    if (!isValidPhone(parsed.phone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const { lead, duplicate } = createLead(parsed);
    return NextResponse.json({ lead, duplicate }, { status: duplicate ? 200 : 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
