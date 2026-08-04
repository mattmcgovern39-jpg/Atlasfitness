import { NextResponse } from 'next/server';
import { db } from '../../../../../db/client';
import { sanitizeForCsvExport } from '@/lib/csv';
import { handleApiError } from '@/lib/apiUtils';

interface CallExportRow {
  started_at: string;
  duration_seconds: number;
  disposition: string;
  objection: string | null;
  notes: string | null;
  follow_up_at: string | null;
  attempt_number: number;
  phone: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
}

const COLUMNS: (keyof CallExportRow)[] = [
  'started_at', 'duration_seconds', 'disposition', 'objection', 'notes',
  'follow_up_at', 'attempt_number', 'phone', 'first_name', 'last_name', 'company',
];

export async function GET() {
  try {
    const calls = db
      .prepare(
        `SELECT c.started_at, c.duration_seconds, c.disposition, c.objection, c.notes,
                c.follow_up_at, c.attempt_number, l.phone, l.first_name, l.last_name, l.company
         FROM calls c JOIN leads l ON l.id = c.lead_id
         ORDER BY c.started_at ASC`
      )
      .all() as CallExportRow[];

    const lines = [COLUMNS.join(',')];
    for (const call of calls) {
      const cells = COLUMNS.map((col) => {
        const raw = String(call[col] ?? '');
        const safe = sanitizeForCsvExport(raw);
        return `"${safe.replace(/"/g, '""')}"`;
      });
      lines.push(cells.join(','));
    }

    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="calls-export-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
