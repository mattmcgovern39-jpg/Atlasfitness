'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type Lead, type LeadStatus } from '@/lib/types';
import { formatPhone } from '@/lib/phone';
import { formatDateTime, leadName } from '@/lib/format';
import { AddLeadForm } from '@/components/AddLeadForm';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    const res = await fetch(`/api/leads?${params.toString()}`);
    const data = await res.json();
    setLeads(data.leads);
    setTotal(data.total);
    setLoading(false);
  }, [search, status]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500">{total} total</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/leads" className="btn-secondary">
            Export CSV
          </a>
          <AddLeadForm onAdded={load} />
          <Link href="/import" className="btn-primary">
            Import CSV
          </Link>
        </div>
      </div>

      <div className="card flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search name, phone, company, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input max-w-xs"
          value={status}
          onChange={(e) => setStatus(e.target.value as LeadStatus | '')}
        >
          <option value="">All Statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-slate-500">
            No leads found. <Link href="/import" className="text-brand-600">Import a CSV</Link> to
            get started.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2">Name</th>
                <th className="pb-2">Company</th>
                <th className="pb-2">Phone</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Attempts</th>
                <th className="pb-2">Last Call</th>
                <th className="pb-2">Next Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-2 pr-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium text-slate-800 hover:text-brand-600">
                      {leadName(lead)}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-slate-600">{lead.company ?? '—'}</td>
                  <td className="py-2 pr-3 text-slate-600">{formatPhone(lead.phone)}</td>
                  <td className="py-2 pr-3">
                    <span className="badge bg-slate-100 text-slate-700">
                      {LEAD_STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-slate-600">{lead.attempt_count}</td>
                  <td className="py-2 pr-3 text-slate-500">{formatDateTime(lead.last_call_at)}</td>
                  <td className="py-2 text-slate-500">{formatDateTime(lead.next_action_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
