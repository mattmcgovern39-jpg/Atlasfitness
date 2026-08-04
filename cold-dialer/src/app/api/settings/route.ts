import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, setSetting } from '@/lib/db';
import { handleApiError, jsonError } from '@/lib/apiUtils';
import { z } from 'zod';

const SettingsUpdateSchema = z.record(z.string().max(100), z.string().max(2000));

export async function GET() {
  try {
    return NextResponse.json({ settings: getAllSettings() });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SettingsUpdateSchema.parse(body);
    if (Object.keys(parsed).length === 0) return jsonError('No settings provided');

    for (const [key, value] of Object.entries(parsed)) {
      setSetting(key, value);
    }
    return NextResponse.json({ settings: getAllSettings() });
  } catch (err) {
    return handleApiError(err);
  }
}
