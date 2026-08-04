'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { DispositionBadge } from '@/components/DispositionBadge';
import { formatPhone, telHref } from '@/lib/phone';
import { formatDateTime, formatDuration, leadName } from '@/lib/format';
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '@/lib/types';
import type { Lead, CallRecord, Disposition, Objection } from '@/lib/types';
import { OBJECTION_LABELS } from '@/lib/types';

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [leadRes, callsRes] = await Promise.all([
      fetch(`/api/leads/${params.id}`),
      fetch(`/api/leads/${params.id}/calls`),
    ]);
    const leadData = await leadRes.json();
    const callsData = await callsRes.json();
    setLead(leadData.lead);
    setNotes(leadData.lead?.notes ?? '');
    setCalls(callsData.calls);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateLead(patch: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/leads/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setLead(data.lead);
    setSaving(false);
  }

  if (!lead) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-1">
        <div className="card space-y-3">
          <h1 className="text-xl font-semibold text-slate-900">{leadName(lead)}</h1>
          <p className="text-sm text-slate-500">{lead.company ?? '—'} {lead.title ? `· ${lead.title}` : ''}</p>

          <a
            href={telHref(lead.phone)}
            className="btn-primary w-full justify-center"
          >
            📞 Call {formatPhone(lead.phone)}
          </a>

          <div className="space-y-2 text-sm">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={lead.status}
                onChange={(e) => updateLead({ status: e.target.value })}
                disabled={saving}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {LEAD_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="dnc"
                type="checkbox"
                checked={!!lead.do_not_call}
                onChange={(e) => updateLead({ do_not_call: e.target.checked })}
                disabled={saving}
              />
              <label htmlFor="dnc" className="text-sm text-slate-700">
                Do Not Call
              </label>
            </div>
            <div className="text-xs text-slate-500">
              <div>Email: {lead.email ?? '—'}</div>
              <div>
                {lead.city ?? ''} {lead.state ?? ''} {lead.postal_code ?? ''}
              </div>
              <div>Attempts: {lead.attempt_count}</div>
              <div>Last call: {formatDateTime(lead.last_call_at)}</div>
              <div>Next action: {formatDateTime(lead.next_action_at)}</div>
              <div>Time zone (est.): {lead.timezone ?? 'unknown'}</div>
              <div>Source: {lead.source ?? 'manual'}</div>
            </div>
          </div>

          <div>
            <label className="label">Lead Notes</label>
            <textarea
              className="input"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => updateLead({ notes })}
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="card">
          <h2 className="mb-3 font-semibold text-slate-900">Call History ({calls.length})</h2>
          {calls.length === 0 ? (
            <p className="text-sm text-slate-500">No calls logged for this lead yet.</p>
          ) : (
            <ul className="space-y-3">
              {calls.map((call) => (
                <li key={call.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <DispositionBadge disposition={call.disposition as Disposition} />
                    <span className="text-xs text-slate-500">{formatDateTime(call.started_at)}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Attempt #{call.attempt_number} · {formatDuration(call.duration_seconds)}
                    {call.objection && ` · Objection: ${OBJECTION_LABELS[call.objection as Objection]}`}
                  </div>
                  {call.notes && <p className="mt-2 text-sm text-slate-700">{call.notes}</p>}
                  {call.follow_up_at && (
                    <p className="mt-1 text-xs text-blue-700">
                      Follow-up scheduled: {formatDateTime(call.follow_up_at)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
