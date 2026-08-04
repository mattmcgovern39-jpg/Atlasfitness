# Cold Dialer

A local-first cold-calling power dialer: import a CSV of leads, dial through
them with a click-to-call queue, and log every call so you can see what's
actually working. Everything runs on your machine — there's no cloud
backend, no external accounts, and no telephony API keys required.

## Why this exists

Cold calling only improves if you track it. This app is built around a
handful of well-known cold-calling best practices, baked into the data
model instead of left to a spreadsheet:

- **Structured dispositions**, not free text — every call ends with one of
  12 standard outcomes (connected/interested, voicemail, gatekeeper, do not
  call, etc.) so the analytics are aggregable from day one.
- **Objection tracking** on connected-but-not-converted calls, so you can
  see your top three objections instead of guessing.
- **Follow-up scheduling** built into the disposition flow — a "callback
  requested" call creates a due date that resurfaces the lead automatically.
- **Best-time-to-call analytics** — connect rate by hour of day, from your
  own call history.
- **Session pacing** — calls made, connect rate, and calls/hour per power
  dialer sitting, so you can see burnout coming instead of after.
- **A calling-hours guard** that warns (never blocks) when a lead's
  estimated local time falls outside a configurable window.
- **Do Not Call is permanent and queue-excluding** — once set, a lead is
  removed from the dialer entirely.

## Quick start

Requires Node.js 18.18+.

```bash
cd cold-dialer
npm install
npm run dev
```

Open <http://localhost:3000> (`127.0.0.1:3000` works too — both are
allow-listed in `next.config.js` via `allowedDevOrigins`, which the dev
server requires or it will 403 its own assets).

Optionally generate a sample CSV to try the import flow before using your
own list:

```bash
npm run db:seed:sample   # writes sample_leads.csv
```

For a production-style run (matches what you'd actually use day to day):

```bash
npm run build
npm run start   # binds to 127.0.0.1 only
```

## How dialing works

There is no telephony integration and no auto-dialer. The power dialer
queues leads and, when you click **Call**, opens a `tel:` link — your OS
hands that off to whatever you already use to make calls (phone app,
FaceTime, Google Voice, a softphone, etc.). A timer starts the moment you
click, you hang up in your own calling app, then come back and log the
outcome. This was a deliberate choice, not a limitation:

- **Zero cost, zero setup.** No Twilio account, no per-minute billing, no
  API keys to manage.
- **No autodialer compliance exposure.** Every call is manually initiated
  by you, so this tool doesn't fall under predictive/autodialer regulation
  the way an auto-connect power dialer would.
- **Fully private.** Call audio never touches this app or any server —
  only the outcome you choose to log does.

## Project structure

```
cold-dialer/
├── db/
│   ├── schema.ts        # SQLite schema (source of truth), applied on boot
│   ├── client.ts         # Singleton better-sqlite3 connection
│   └── migrate.ts        # Standalone `npm run db:migrate` CLI
├── src/
│   ├── app/
│   │   ├── page.tsx               # Dashboard
│   │   ├── dialer/                # Power dialer session
│   │   ├── leads/                 # Lead list + lead detail/call history
│   │   ├── import/                # CSV import wizard
│   │   ├── follow-ups/            # Callbacks due
│   │   ├── analytics/             # Charts & KPIs
│   │   ├── settings/              # Calling hours, data export
│   │   └── api/                   # Route handlers (see below)
│   ├── components/        # DialerSession, DispositionForm, ImportWizard, charts...
│   ├── lib/
│   │   ├── db.ts           # All data-access queries (leads/calls/sessions/queue)
│   │   ├── analytics.ts    # Aggregation queries behind the Analytics page
│   │   ├── types.ts        # Dispositions, objections, lead statuses (controlled vocab)
│   │   ├── phone.ts        # Normalization, formatting, area-code timezone guess
│   │   ├── callingHours.ts # Local-time calling-window check
│   │   ├── csv.ts          # CSV parsing, column-mapping, export sanitization
│   │   └── validation.ts   # zod schemas for every API input
│   └── proxy.ts            # Origin check on all /api/* writes (see Security)
├── scripts/generate-sample-csv.ts
└── data/                    # SQLite file lives here (git-ignored)
```

**API routes** (`src/app/api/**/route.ts`): `leads`, `leads/[id]`,
`leads/[id]/calls`, `import/preview`, `import/commit`, `queue/next`,
`sessions`, `sessions/[id]`, `calls`, `calls/recent`, `analytics`,
`settings`, `export/leads`, `export/calls`.

## The power-dialer queue algorithm

`getNextQueueLead` in `src/lib/db.ts` picks the next lead in this order:

1. **Due follow-ups** — any lead with a scheduled callback that's now due,
   earliest first.
2. **Fresh leads** — never-called leads, highest priority first.
3. **Retries** — previously-attempted leads with no fresh disposition
   ("no answer", "voicemail", etc.), fewest attempts first.

Leads marked Do Not Call, plus terminal statuses (wrong number, closed,
qualified), are excluded permanently — a "qualified" lead won't loop back
into the cold-call queue; further contact happens via its scheduled
follow-up instead.

## CSV import

Any header names work. Common variants (`Phone`, `Phone Number`, `Mobile`,
`Cell`, ...) are auto-matched to the right field; anything unmatched is
left for you to map by hand before anything is imported. A `phone` mapping
is required. Duplicate phone numbers (normalized, so formatting doesn't
matter) are skipped, not duplicated.

## Security & privacy

This app is designed to run only on your own machine:

- **All data is local.** SQLite file at `data/dialer.db` (git-ignored).
  Nothing is sent anywhere — there's no external API call in the entire
  app besides the optional area-code timezone guess, which is a local
  lookup table, not a network call.
- **No auth, by design, with a mitigation.** A single-user localhost tool
  doesn't need a login. But without a login there's also no session for a
  malicious webpage to ride, so `src/proxy.ts` (Next.js's request
  interceptor, formerly called `middleware`) independently rejects any
  state-changing request (`POST`/`PATCH`/etc.) whose `Origin` header
  doesn't match the server's own host — this stops another browser tab
  from silently writing to your local data.
- **Parameterized SQL everywhere.** No string-built queries from user
  input; the one dynamic `UPDATE ... SET` clause is built from a hardcoded
  column whitelist, never from arbitrary field names.
- **Zod validation on every API input**, with length caps to keep a
  malformed CSV or request from bloating the database.
- **CSV export is formula-injection-safe** (values starting with
  `=`, `+`, `-`, `@` are prefixed before being written), per the OWASP CSV
  injection guidance.
- **Basic security headers** (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`) are set in `next.config.js`.
- Keep dependencies current: `npm audit` should report 0 vulnerabilities;
  re-run it periodically.

## Backing up / owning your data

Everything is exportable as CSV any time from **Settings** (or
`/api/export/leads`, `/api/export/calls`). To back up the whole database,
just copy `data/dialer.db`.
