import { randomUUID } from 'node:crypto';
import { db } from '../../db/client';
import { normalizePhone, guessTimezone } from './phone';
import type {
  Lead,
  LeadStatus,
  CallRecord,
  Disposition,
  Objection,
  DialerSession,
  ImportBatch,
} from './types';
import {
  CONNECTED_DISPOSITIONS,
  POSITIVE_DISPOSITIONS,
  TERMINAL_DISPOSITIONS,
} from './types';
import type { ImportableField } from './csv';

const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export interface LeadCreateInput {
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  title?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  notes?: string | null;
  source?: string | null;
  tags?: string[];
  priority?: number;
}

const insertLeadStmt = db.prepare(`
  INSERT INTO leads (
    id, first_name, last_name, company, title, phone, phone_raw, email,
    address, city, state, postal_code, country, timezone, source, status,
    priority, tags, notes, attempt_count, last_call_at, next_action_at,
    do_not_call, created_at, updated_at
  ) VALUES (
    @id, @first_name, @last_name, @company, @title, @phone, @phone_raw, @email,
    @address, @city, @state, @postal_code, @country, @timezone, @source, @status,
    @priority, @tags, @notes, 0, NULL, NULL, 0, @created_at, @updated_at
  )
`);

const findLeadByPhoneStmt = db.prepare(`SELECT * FROM leads WHERE phone = ?`);

export function createLead(input: LeadCreateInput): { lead: Lead; duplicate: boolean } {
  const normalizedPhone = normalizePhone(input.phone);
  const existing = findLeadByPhoneStmt.get(normalizedPhone) as Lead | undefined;
  if (existing) return { lead: existing, duplicate: true };

  const id = randomUUID();
  const timestamp = now();
  const record = {
    id,
    first_name: input.first_name ?? null,
    last_name: input.last_name ?? null,
    company: input.company ?? null,
    title: input.title ?? null,
    phone: normalizedPhone,
    phone_raw: input.phone,
    email: input.email ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    postal_code: input.postal_code ?? null,
    country: input.country ?? null,
    timezone: guessTimezone(normalizedPhone),
    source: input.source ?? null,
    status: 'new',
    priority: input.priority ?? 0,
    tags: JSON.stringify(input.tags ?? []),
    notes: input.notes ?? null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  insertLeadStmt.run(record);
  return { lead: findLeadByPhoneStmt.get(normalizedPhone) as Lead, duplicate: false };
}

export interface BulkImportRow extends Record<ImportableField, string> {}

export interface BulkImportResult {
  batch: ImportBatch;
}

export function bulkImportLeads(
  rows: BulkImportRow[],
  filename: string | null
): BulkImportResult {
  const batchId = randomUUID();
  const timestamp = now();
  let inserted = 0;
  let duplicates = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  const runAll = db.transaction((items: BulkImportRow[]) => {
    items.forEach((row, index) => {
      if (!row.phone || !row.phone.trim()) {
        errors += 1;
        if (errorMessages.length < 50) errorMessages.push(`Row ${index + 1}: missing phone`);
        return;
      }
      try {
        const { duplicate } = createLead({
          first_name: row.first_name || null,
          last_name: row.last_name || null,
          company: row.company || null,
          title: row.title || null,
          phone: row.phone,
          email: row.email || null,
          address: row.address || null,
          city: row.city || null,
          state: row.state || null,
          postal_code: row.postal_code || null,
          country: row.country || null,
          notes: row.notes || null,
          source: filename,
        });
        if (duplicate) duplicates += 1;
        else inserted += 1;
      } catch (err) {
        errors += 1;
        if (errorMessages.length < 50) {
          errorMessages.push(`Row ${index + 1}: ${(err as Error).message}`);
        }
      }
    });
  });

  runAll(rows);

  const batch: ImportBatch = {
    id: batchId,
    filename,
    imported_at: timestamp,
    row_count: rows.length,
    inserted_count: inserted,
    duplicate_count: duplicates,
    error_count: errors,
    errors: errorMessages.length ? JSON.stringify(errorMessages) : null,
  };

  db.prepare(
    `INSERT INTO import_batches (id, filename, imported_at, row_count, inserted_count, duplicate_count, error_count, errors)
     VALUES (@id, @filename, @imported_at, @row_count, @inserted_count, @duplicate_count, @error_count, @errors)`
  ).run(batch);

  return { batch };
}

export interface LeadFilters {
  search?: string;
  status?: LeadStatus;
  dueOnly?: boolean;
  excludeDnc?: boolean;
  limit?: number;
  offset?: number;
}

export function listLeads(filters: LeadFilters = {}): { leads: Lead[]; total: number } {
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.search) {
    clauses.push(`(
      first_name LIKE @search OR last_name LIKE @search OR company LIKE @search OR
      phone LIKE @search OR email LIKE @search
    )`);
    params.search = `%${filters.search}%`;
  }
  if (filters.status) {
    clauses.push(`status = @status`);
    params.status = filters.status;
  }
  if (filters.dueOnly) {
    clauses.push(`next_action_at IS NOT NULL AND next_action_at <= @nowIso`);
    params.nowIso = now();
  }
  if (filters.excludeDnc) {
    clauses.push(`do_not_call = 0`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = Math.min(filters.limit ?? 100, 500);
  const offset = filters.offset ?? 0;

  const leads = db
    .prepare(`SELECT * FROM leads ${where} ORDER BY updated_at DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset }) as Lead[];

  const total = (
    db.prepare(`SELECT COUNT(*) as count FROM leads ${where}`).get(params) as { count: number }
  ).count;

  return { leads, total };
}

export function getLead(id: string): Lead | undefined {
  return db.prepare(`SELECT * FROM leads WHERE id = ?`).get(id) as Lead | undefined;
}

export function updateLead(id: string, patch: Record<string, unknown>): Lead | undefined {
  const allowed = [
    'first_name', 'last_name', 'company', 'title', 'email', 'address', 'city',
    'state', 'postal_code', 'country', 'notes', 'status', 'priority', 'tags',
    'do_not_call', 'next_action_at', 'timezone',
  ];
  const fields = Object.keys(patch).filter((k) => allowed.includes(k));
  if (fields.length === 0) return getLead(id);

  const setClause = fields.map((f) => `${f} = @${f}`).join(', ');
  const params: Record<string, unknown> = { id, updated_at: now() };
  for (const f of fields) params[f] = patch[f];

  db.prepare(`UPDATE leads SET ${setClause}, updated_at = @updated_at WHERE id = @id`).run(params);
  return getLead(id);
}

// Statuses that should never be blind-retried by the power dialer: DNC/bad
// number/closed are permanently done, and "qualified" is a positive
// outcome that should only resurface via an explicit scheduled follow-up
// (next_action_at), not the generic attempt-count retry pool — otherwise a
// hot lead would get redialed indefinitely alongside cold ones.
const QUEUE_EXCLUDED_STATUSES = `'dnc','bad_number','closed_won','closed_lost'`;
const RETRY_EXCLUDED_STATUSES = `'dnc','bad_number','closed_won','closed_lost','not_interested','qualified'`;

/**
 * Power-dialer queue: next best lead to call, in priority order.
 * 1. Overdue/due follow-ups (earliest first)
 * 2. Never-called new leads (highest priority first)
 * 3. Leads with fewer attempts, oldest last-call first
 * DNC leads and terminal-status leads are always excluded.
 */
export function getNextQueueLead(excludeLeadIds: string[] = []): Lead | undefined {
  const exclusion = excludeLeadIds.length
    ? `AND id NOT IN (${excludeLeadIds.map(() => '?').join(',')})`
    : '';
  const nowIso = now();

  const dueFollowUp = db
    .prepare(
      `SELECT * FROM leads
       WHERE do_not_call = 0 AND status NOT IN (${QUEUE_EXCLUDED_STATUSES})
       AND next_action_at IS NOT NULL AND next_action_at <= ? ${exclusion}
       ORDER BY next_action_at ASC LIMIT 1`
    )
    .get(nowIso, ...excludeLeadIds) as Lead | undefined;
  if (dueFollowUp) return dueFollowUp;

  const fresh = db
    .prepare(
      `SELECT * FROM leads
       WHERE do_not_call = 0 AND status = 'new' AND attempt_count = 0 ${exclusion}
       ORDER BY priority DESC, created_at ASC LIMIT 1`
    )
    .get(...excludeLeadIds) as Lead | undefined;
  if (fresh) return fresh;

  const retry = db
    .prepare(
      `SELECT * FROM leads
       WHERE do_not_call = 0 AND status NOT IN (${RETRY_EXCLUDED_STATUSES})
       AND (next_action_at IS NULL) AND attempt_count > 0 ${exclusion}
       ORDER BY attempt_count ASC, last_call_at ASC LIMIT 1`
    )
    .get(...excludeLeadIds) as Lead | undefined;

  return retry;
}

export function getQueueCount(): number {
  const nowIso = now();
  const row = db
    .prepare(
      `SELECT COUNT(*) as count FROM leads
       WHERE do_not_call = 0 AND status NOT IN (${QUEUE_EXCLUDED_STATUSES})
       AND (
         (next_action_at IS NOT NULL AND next_action_at <= @now) OR
         (status = 'new' AND attempt_count = 0) OR
         (next_action_at IS NULL AND attempt_count > 0 AND status NOT IN (${RETRY_EXCLUDED_STATUSES}))
       )`
    )
    .get({ now: nowIso }) as { count: number };
  return row.count;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export function startSession(notes?: string | null): DialerSession {
  const id = randomUUID();
  const timestamp = now();
  db.prepare(
    `INSERT INTO sessions (id, started_at, calls_made, connects, notes) VALUES (?, ?, 0, 0, ?)`
  ).run(id, timestamp, notes ?? null);
  return db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as DialerSession;
}

export function endSession(id: string): DialerSession | undefined {
  db.prepare(`UPDATE sessions SET ended_at = ? WHERE id = ?`).run(now(), id);
  return db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as DialerSession | undefined;
}

export function getSession(id: string): DialerSession | undefined {
  return db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as DialerSession | undefined;
}

export function listRecentSessions(limit = 20): DialerSession[] {
  return db
    .prepare(`SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?`)
    .all(limit) as DialerSession[];
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

export interface LogCallInput {
  lead_id: string;
  session_id?: string | null;
  disposition: Disposition;
  objection?: Objection | null;
  notes?: string | null;
  duration_seconds: number;
  started_at: string;
  follow_up_at?: string | null;
}

function nextStatusForDisposition(disposition: Disposition): LeadStatus {
  switch (disposition) {
    case 'connected_interested':
      return 'qualified';
    case 'meeting_booked':
      return 'qualified';
    case 'connected_callback':
      return 'callback_scheduled';
    case 'connected_not_interested':
    case 'not_now':
      return 'not_interested';
    case 'connected_gatekeeper':
    case 'voicemail':
    case 'no_answer':
    case 'busy':
      return 'contacted';
    case 'wrong_number':
    case 'disconnected':
      return 'bad_number';
    case 'do_not_call':
      return 'dnc';
    default:
      return 'contacted';
  }
}

export function logCall(input: LogCallInput): CallRecord {
  const lead = getLead(input.lead_id);
  if (!lead) throw new Error('Lead not found');

  const id = randomUUID();
  const timestamp = now();
  const attemptNumber = lead.attempt_count + 1;
  const endedAt = new Date(
    new Date(input.started_at).getTime() + input.duration_seconds * 1000
  ).toISOString();

  db.prepare(
    `INSERT INTO calls (
      id, lead_id, session_id, attempt_number, started_at, ended_at,
      duration_seconds, disposition, objection, notes, follow_up_at, created_at
    ) VALUES (@id, @lead_id, @session_id, @attempt_number, @started_at, @ended_at,
      @duration_seconds, @disposition, @objection, @notes, @follow_up_at, @created_at)`
  ).run({
    id,
    lead_id: input.lead_id,
    session_id: input.session_id ?? null,
    attempt_number: attemptNumber,
    started_at: input.started_at,
    ended_at: endedAt,
    duration_seconds: input.duration_seconds,
    disposition: input.disposition,
    objection: input.objection ?? null,
    notes: input.notes ?? null,
    follow_up_at: input.follow_up_at ?? null,
    created_at: timestamp,
  });

  const isTerminal = TERMINAL_DISPOSITIONS.has(input.disposition);
  const isDnc = input.disposition === 'do_not_call';

  updateLead(input.lead_id, {
    status: nextStatusForDisposition(input.disposition),
    do_not_call: isDnc ? 1 : lead.do_not_call,
    next_action_at: input.follow_up_at ?? null,
  });

  db.prepare(
    `UPDATE leads SET attempt_count = attempt_count + 1, last_call_at = @started_at WHERE id = @id`
  ).run({ id: input.lead_id, started_at: input.started_at });

  if (input.session_id) {
    const isConnected = CONNECTED_DISPOSITIONS.has(input.disposition);
    db.prepare(
      `UPDATE sessions SET calls_made = calls_made + 1, connects = connects + @connect WHERE id = @id`
    ).run({ id: input.session_id, connect: isConnected ? 1 : 0 });
  }

  void isTerminal; // status already reflects terminal transitions above

  return db.prepare(`SELECT * FROM calls WHERE id = ?`).get(id) as CallRecord;
}

export function listCallsForLead(leadId: string): CallRecord[] {
  return db
    .prepare(`SELECT * FROM calls WHERE lead_id = ? ORDER BY started_at DESC`)
    .all(leadId) as CallRecord[];
}

export function listRecentCalls(limit = 50): (CallRecord & { lead_name: string; phone: string })[] {
  return db
    .prepare(
      `SELECT c.*, (COALESCE(l.first_name,'') || ' ' || COALESCE(l.last_name,'')) as lead_name, l.phone
       FROM calls c JOIN leads l ON l.id = c.lead_id
       ORDER BY c.started_at DESC LIMIT ?`
    )
    .all(limit) as (CallRecord & { lead_name: string; phone: string })[];
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function getSetting(key: string): string | undefined {
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as
    | { value: string }
    | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = db.prepare(`SELECT key, value FROM settings`).all() as {
    key: string;
    value: string;
  }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
