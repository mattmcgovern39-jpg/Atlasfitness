import { NextResponse } from 'next/server';
import { db } from '../../../../../db/client';
import { sanitizeForCsvExport } from '@/lib/csv';
import { handleApiError } from '@/lib/apiUtils';
import type { Lead } from '@/lib/types';

const COLUMNS: (keyof Lead)[] = [
  'first_name', 'last_name', 'company', 'title', 'phone', 'email',
  'address', 'city', 'state', 'postal_code', 'country', 'status',
  'attempt_count', 'last_call_at', 'next_action_at', 'do_not_call',
  'notes', 'created_at',
];

export async function GET() {
  try {
    const leads = db.prepare(`SELECT * FROM leads ORDER BY created_at ASC`).all() as Lead[];

    const lines = [COLUMNS.join(',')];
    for (const lead of leads) {
      const cells = COLUMNS.map((col) => {
        const raw = String(lead[col] ?? '');
        const safe = sanitizeForCsvExport(raw);
        return `"${safe.replace(/"/g, '""')}"`;
      });
      lines.push(cells.join(','));
    }

    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-export-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
