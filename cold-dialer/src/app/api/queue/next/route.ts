import { NextRequest, NextResponse } from 'next/server';
import { getNextQueueLead, getQueueCount } from '@/lib/db';
import { handleApiError } from '@/lib/apiUtils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const excludeParam = searchParams.get('exclude');
    const excludeIds = excludeParam ? excludeParam.split(',').filter(Boolean) : [];

    const lead = getNextQueueLead(excludeIds);
    const queueCount = getQueueCount();

    return NextResponse.json({ lead: lead ?? null, queueCount });
  } catch (err) {
    return handleApiError(err);
  }
}
