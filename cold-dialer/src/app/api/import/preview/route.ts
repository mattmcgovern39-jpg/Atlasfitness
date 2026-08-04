import { NextRequest, NextResponse } from 'next/server';
import { parseCsvText, guessColumnMapping } from '@/lib/csv';
import { handleApiError, jsonError } from '@/lib/apiUtils';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB, generous for a leads CSV

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const csvText: unknown = body?.csvText;
    if (typeof csvText !== 'string' || !csvText.trim()) {
      return jsonError('csvText is required');
    }
    if (Buffer.byteLength(csvText, 'utf-8') > MAX_UPLOAD_BYTES) {
      return jsonError('CSV file is too large (max 20MB)');
    }

    const { headers, rows, errors } = parseCsvText(csvText);
    if (headers.length === 0) {
      return jsonError('Could not detect any columns in this CSV');
    }

    const mapping = guessColumnMapping(headers);

    return NextResponse.json({
      headers,
      mapping,
      sampleRows: rows.slice(0, 5),
      rowCount: rows.length,
      parseErrors: errors,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
