// Cold Dialer local schema (SQLite), applied idempotently on every app
// startup by db/client.ts. All IDs are UUIDv4 strings generated in
// application code.
//
// This lives as a TS string (not a loose .sql file read via fs) so it gets
// bundled with the route handlers that import it — a plain file next to
// the compiled output isn't guaranteed to survive Next.js's build tracing.
export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

-- One row per lead/contact. Phone is normalized to digits-only (with
-- optional leading "+") for de-duplication; phone_raw preserves what was
-- in the source CSV for display/debugging.
CREATE TABLE IF NOT EXISTS leads (
  id                TEXT PRIMARY KEY,
  first_name        TEXT,
  last_name         TEXT,
  company           TEXT,
  title             TEXT,
  phone             TEXT NOT NULL,
  phone_raw         TEXT,
  email             TEXT,
  address           TEXT,
  city              TEXT,
  state             TEXT,
  postal_code       TEXT,
  country           TEXT,
  timezone          TEXT,
  source            TEXT,
  status            TEXT NOT NULL DEFAULT 'new',
  priority          INTEGER NOT NULL DEFAULT 0,
  tags              TEXT NOT NULL DEFAULT '[]',
  notes             TEXT,
  attempt_count     INTEGER NOT NULL DEFAULT 0,
  last_call_at      TEXT,
  next_action_at    TEXT,
  do_not_call       INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_next_action_at ON leads(next_action_at);
CREATE INDEX IF NOT EXISTS idx_leads_do_not_call ON leads(do_not_call);

-- One power-dialer sitting. Groups calls together so pace/burnout metrics
-- (calls per hour, breaks) can be tracked per session, per best practice.
CREATE TABLE IF NOT EXISTS sessions (
  id                TEXT PRIMARY KEY,
  started_at        TEXT NOT NULL,
  ended_at          TEXT,
  calls_made        INTEGER NOT NULL DEFAULT 0,
  connects          INTEGER NOT NULL DEFAULT 0,
  notes             TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);

-- One row per dial. This is the core activity log the analytics are built
-- from — every field here maps to a well-known cold-calling KPI.
CREATE TABLE IF NOT EXISTS calls (
  id                TEXT PRIMARY KEY,
  lead_id           TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  session_id        TEXT REFERENCES sessions(id) ON DELETE SET NULL,
  attempt_number    INTEGER NOT NULL,
  started_at        TEXT NOT NULL,
  ended_at          TEXT,
  duration_seconds  INTEGER NOT NULL DEFAULT 0,
  disposition       TEXT NOT NULL,
  objection         TEXT,
  notes             TEXT,
  follow_up_at      TEXT,
  created_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_session_id ON calls(session_id);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls(started_at);
CREATE INDEX IF NOT EXISTS idx_calls_disposition ON calls(disposition);

-- One row per CSV import, kept for an audit trail of where leads came from
-- and to surface duplicate/error counts back to the user.
CREATE TABLE IF NOT EXISTS import_batches (
  id                TEXT PRIMARY KEY,
  filename          TEXT,
  imported_at       TEXT NOT NULL,
  row_count         INTEGER NOT NULL DEFAULT 0,
  inserted_count    INTEGER NOT NULL DEFAULT 0,
  duplicate_count   INTEGER NOT NULL DEFAULT 0,
  error_count       INTEGER NOT NULL DEFAULT 0,
  errors            TEXT
);

-- Simple key/value app settings (calling hours window, active list filter,
-- auto-advance delay, etc.) editable from the Settings page.
CREATE TABLE IF NOT EXISTS settings (
  key               TEXT PRIMARY KEY,
  value             TEXT NOT NULL
);
`;
