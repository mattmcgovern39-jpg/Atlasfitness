'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/StatCard';
import { DispositionBadge } from '@/components/DispositionBadge';
import { formatDuration, formatPercent, formatDateTime } from '@/lib/format';
import { formatPhone } from '@/lib/phone';
import type { AnalyticsSummary } from '@/lib/analytics';
import type { CallRecord, Disposition } from '@/lib/types';

interface QueueInfo {
  queueCount: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [queue, setQueue] = useState<QueueInfo | null>(null);
  const [recentCalls, setRecentCalls] = useState<
    (CallRecord & { lead_name: string; phone: string })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [analyticsRes, queueRes, callsRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/queue/next'),
        fetch('/api/calls/recent?limit=8'),
      ]);
      const analytics = await analyticsRes.json();
      const queueData = await queueRes.json();
      const calls = await callsRes.json();
      setSummary(analytics.summary);
      setQueue({ queueCount: queueData.queueCount });
      setRecentCalls(calls.calls);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Everything you need before you start dialing.</p>
        </div>
        <Link href="/dialer" className="btn-primary">
          🚀 Start Power Dialer Session
        </Link>
      </div>

      {loading || !summary ? (
        <div className="card text-sm text-slate-500">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Leads in Queue" value={queue?.queueCount ?? 0} />
            <StatCard label="Calls Today" value={summary.callsToday} sublabel={`${summary.callsThisWeek} this week`} />
            <StatCard label="Connect Rate" value={formatPercent(summary.connectRate)} sublabel={`${summary.connects} connects`} />
            <StatCard
              label="Conversion Rate"
              value={formatPercent(summary.conversionRate)}
              sublabel={`${summary.positiveOutcomes} positive outcomes`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Meetings Booked" value={summary.meetingsBooked} />
            <StatCard label="Avg Talk Time" value={formatDuration(summary.avgTalkTimeSeconds)} />
            <StatCard
              label="Follow-Ups Due Today"
              value={summary.followUpsDueToday}
              sublabel={
                <Link href="/follow-ups" className="text-brand-600">
                  view →
                </Link>
              }
            />
            <StatCard label="Follow-Ups Overdue" value={summary.followUpsOverdue} />
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Recent Calls</h2>
              <Link href="/analytics" className="text-sm text-brand-600 hover:underline">
                View analytics →
              </Link>
            </div>
            {recentCalls.length === 0 ? (
              <p className="text-sm text-slate-500">
                No calls logged yet. Import some leads and start a power dialer session.
              </p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {recentCalls.map((call) => (
                    <tr key={call.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3 font-medium text-slate-800">
                        {call.lead_name.trim() || formatPhone(call.phone)}
                      </td>
                      <td className="py-2 pr-3 text-slate-500">{formatPhone(call.phone)}</td>
                      <td className="py-2 pr-3">
                        <DispositionBadge disposition={call.disposition as Disposition} />
                      </td>
                      <td className="py-2 pr-3 text-slate-500">{formatDuration(call.duration_seconds)}</td>
                      <td className="py-2 text-slate-500">{formatDateTime(call.started_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
