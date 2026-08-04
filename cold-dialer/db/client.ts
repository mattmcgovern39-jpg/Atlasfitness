import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { SCHEMA_SQL } from './schema';

// process.cwd() is the project root for every way this app is run
// (npm run dev/start/db:migrate always run from here). We deliberately
// avoid __dirname: Next.js bundles this module into its own server
// output directory, so __dirname no longer points at the source tree
// once built.
// Next.js's build tracer warns that this path is "dynamic" because it's
// env-configurable. That warning targets serverless deployments with
// strict output-size limits; this app only ever runs as a local `next
// start`/`next dev` process, so it doesn't apply.
const DB_PATH = path.resolve(process.cwd(), process.env.DIALER_DB_PATH ?? './data/dialer.db');

declare global {
  // eslint-disable-next-line no-var
  var __dialerDb: Database.Database | undefined;
}

function createConnection(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);

  return db;
}

// Reuse a single connection across hot-reloads in dev (Next.js re-evaluates
// modules on every request in dev mode without this guard).
export const db = global.__dialerDb ?? createConnection();

if (process.env.NODE_ENV !== 'production') {
  global.__dialerDb = db;
}
