import { NextRequest, NextResponse } from 'next/server';
import { parseCsvText, applyMapping, IMPORTABLE_FIELDS } from '@/lib/csv';
import { ColumnMappingSchema } from '@/lib/validation';
import { bulkImportLeads } from '@/lib/db';
import { handleApiError, jsonError } from '@/lib/apiUtils';
import type { ImportableField } from '@/lib/csv';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const csvText: unknown = body?.csvText;
    const filename: unknown = body?.filename;

    if (typeof csvText !== 'string' || !csvText.trim()) {
      return jsonError('csvText is required');
    }
    if (Buffer.byteLength(csvText, 'utf-8') > MAX_UPLOAD_BYTES) {
      return jsonError('CSV file is too large (max 20MB)');
    }

    const mapping = ColumnMappingSchema.parse(body?.mapping ?? {});
    if (!mapping.phone) {
      return jsonError('You must map a column to Phone before importing');
    }

    const fullMapping = Object.fromEntries(
      IMPORTABLE_FIELDS.map((f) => [f, mapping[f] ?? null])
    ) as Record<ImportableField, string | null>;

    const { rows } = parseCsvText(csvText);
    const mappedRows = rows.map((row) => applyMapping(row, fullMapping));

    const { batch } = bulkImportLeads(
      mappedRows,
      typeof filename === 'string' && filename ? filename : null
    );

    return NextResponse.json({ batch });
  } catch (err) {
    return handleApiError(err);
  }
}
