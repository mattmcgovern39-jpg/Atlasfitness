'use client';

import { useState } from 'react';
import {
  DISPOSITION_LABELS,
  OBJECTIONS,
  OBJECTION_LABELS,
  type Disposition,
  type Objection,
} from '@/lib/types';

const OBJECTION_APPLICABLE_DISPOSITIONS: ReadonlySet<Disposition> = new Set([
  'connected_not_interested',
  'connected_gatekeeper',
  'not_now',
]);

const GROUPS: { title: string; items: Disposition[] }[] = [
  {
    title: 'Connected',
    items: [
      'connected_interested',
      'meeting_booked',
      'connected_callback',
      'connected_not_interested',
      'connected_gatekeeper',
    ],
  },
  {
    title: 'Not Connected',
    items: ['voicemail', 'no_answer', 'busy'],
  },
  {
    title: 'Data Issue / Compliance',
    items: ['wrong_number', 'disconnected', 'not_now', 'do_not_call'],
  },
];

export interface DispositionSubmission {
  disposition: Disposition;
  objection: Objection | null;
  notes: string;
  follow_up_at: string | null;
}

export function DispositionForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (data: DispositionSubmission) => void;
  submitting: boolean;
}) {
  const [disposition, setDisposition] = useState<Disposition | null>(null);
  const [objection, setObjection] = useState<Objection | ''>('');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState('');

  const wantsFollowUp = disposition === 'connected_callback' || disposition === 'not_now';
  const wantsObjection = disposition ? OBJECTION_APPLICABLE_DISPOSITIONS.has(disposition) : false;

  function reset() {
    setDisposition(null);
    setObjection('');
    setNotes('');
    setFollowUp('');
  }

  function submit() {
    if (!disposition) return;
    onSubmit({
      disposition,
      objection: objection || null,
      notes,
      follow_up_at: followUp ? new Date(followUp).toISOString() : null,
    });
    reset();
  }

  return (
    <div className="space-y-4">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <div className="label">{group.title}</div>
          <div className="flex flex-wrap gap-2">
            {group.items.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDisposition(d)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  disposition === d
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {DISPOSITION_LABELS[d]}
              </button>
            ))}
          </div>
        </div>
      ))}

      {wantsObjection && (
        <div>
          <label className="label">Primary Objection (optional)</label>
          <select
            className="input"
            value={objection}
            onChange={(e) => setObjection(e.target.value as Objection)}
          >
            <option value="">— None —</option>
            {OBJECTIONS.map((o) => (
              <option key={o} value={o}>
                {OBJECTION_LABELS[o]}
              </option>
            ))}
          </select>
        </div>
      )}

      {wantsFollowUp && (
        <div>
          <label className="label">Follow-Up Date &amp; Time</label>
          <input
            type="datetime-local"
            className="input"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
          />
        </div>
      )}

      <div>
        <label className="label">Call Notes</label>
        <textarea
          className="input"
          rows={3}
          placeholder="What did they say? Key details for next time…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button
        type="button"
        className="btn-primary w-full justify-center"
        disabled={!disposition || submitting}
        onClick={submit}
      >
        {submitting ? 'Logging…' : 'Log Call & Continue'}
      </button>
    </div>
  );
}
