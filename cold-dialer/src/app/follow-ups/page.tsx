'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPhone, telHref } from '@/lib/phone';
import { formatRelativeDue, leadName } from '@/lib/format';
import type { Lead } from '@/lib/types';

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leads?dueOnly=true&limit=200')
      .then((r) => r.json())
      .then((data) => setLeads(data.leads))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Follow-Ups Due</h1>
        <p className="text-sm text-slate-500">
          Callbacks and scheduled next-steps that are due now or overdue.
        </p>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing due right now. Nice work staying on top of it.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between py-3">
                <div>
                  <Link href={`/leads/${lead.id}`} className="font-medium text-slate-800 hover:text-brand-600">
                    {leadName(lead)}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {lead.company ?? '—'} · {formatPhone(lead.phone)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`badge ${
                      formatRelativeDue(lead.next_action_at).includes('overdue')
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {formatRelativeDue(lead.next_action_at)}
                  </span>
                  <a href={telHref(lead.phone)} className="btn-primary">
                    Call
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
