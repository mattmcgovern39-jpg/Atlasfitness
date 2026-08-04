'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('21:00');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setStart(data.settings.calling_hours_start ?? '08:00');
        setEnd(data.settings.calling_hours_end ?? '21:00');
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaved(false);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calling_hours_start: start, calling_hours_end: end }),
    });
    setSaved(true);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">
          This app runs entirely on your machine. Your leads and call data live in a local SQLite
          file and never leave this computer.
        </p>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-slate-900">Calling Hours Warning</h2>
        <p className="text-xs text-slate-500">
          The power dialer warns you (it never blocks you) when a lead&apos;s estimated local time
          falls outside this window — a widely used courtesy/compliance guideline for outbound
          calls.
        </p>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <div className="flex items-center gap-3">
            <div>
              <label className="label">Start</label>
              <input type="time" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="label">End</label>
              <input type="time" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
        )}
        <button className="btn-primary" onClick={save}>
          Save
        </button>
        {saved && <p className="text-xs text-emerald-700">Saved.</p>}
      </div>

      <div className="card space-y-2">
        <h2 className="font-semibold text-slate-900">Export Your Data</h2>
        <p className="text-xs text-slate-500">
          Download everything as CSV any time — it&apos;s your data.
        </p>
        <div className="flex gap-2">
          <a href="/api/export/leads" className="btn-secondary">
            Export Leads
          </a>
          <a href="/api/export/calls" className="btn-secondary">
            Export Call Log
          </a>
        </div>
      </div>

      <div className="card space-y-2">
        <h2 className="font-semibold text-slate-900">Data & Security</h2>
        <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
          <li>All data is stored locally in <code>data/dialer.db</code> (SQLite).</li>
          <li>No external accounts, API keys, or cloud services are required.</li>
          <li>Calls are placed manually via your device&apos;s own phone/softphone — this app never auto-dials.</li>
          <li>Mark a lead &quot;Do Not Call&quot; any time from its detail page; it is permanently excluded from the dialer queue.</li>
        </ul>
      </div>
    </div>
  );
}
