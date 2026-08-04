'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { StatCard } from '@/components/StatCard';
import { formatDuration, formatPercent } from '@/lib/format';
import { DISPOSITION_LABELS, OBJECTION_LABELS } from '@/lib/types';
import type { AnalyticsSummary, HourBucket, DailyTrendPoint, SessionStat } from '@/lib/analytics';
import type { Disposition, Objection } from '@/lib/types';

interface AnalyticsResponse {
  summary: AnalyticsSummary;
  dispositions: { disposition: Disposition; count: number }[];
  objections: { objection: Objection; count: number }[];
  byHour: HourBucket[];
  dailyTrend: DailyTrendPoint[];
  sessions: SessionStat[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  const dispositionChartData = data.dispositions
    .filter((d) => d.count > 0)
    .map((d) => ({ name: DISPOSITION_LABELS[d.disposition], count: d.count }));

  const objectionChartData = data.objections
    .filter((o) => o.count > 0)
    .map((o) => ({ name: OBJECTION_LABELS[o.objection], count: o.count }));

  const hourChartData = data.byHour.map((h) => ({
    hour: `${h.hour}:00`,
    calls: h.calls,
    connectRate: Math.round(h.connectRate * 100),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">
          Every metric you need to see what&apos;s working and improve your cold-calling process.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Leads" value={data.summary.totalLeads} />
        <StatCard label="Total Calls" value={data.summary.totalCalls} />
        <StatCard label="Connect Rate" value={formatPercent(data.summary.connectRate)} />
        <StatCard label="Conversion Rate" value={formatPercent(data.summary.conversionRate)} />
        <StatCard label="Meetings Booked" value={data.summary.meetingsBooked} />
        <StatCard label="Avg Talk Time" value={formatDuration(data.summary.avgTalkTimeSeconds)} />
        <StatCard label="Follow-Ups Due Today" value={data.summary.followUpsDueToday} />
        <StatCard label="Follow-Ups Overdue" value={data.summary.followUpsOverdue} />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold text-slate-900">Calls & Connects — Last 14 Days</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="calls" stroke="#2563eb" name="Calls" />
              <Line type="monotone" dataKey="connects" stroke="#059669" name="Connects" />
              <Line type="monotone" dataKey="positiveOutcomes" stroke="#7c3aed" name="Positive Outcomes" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold text-slate-900">Best Times to Call</h2>
          <p className="mb-2 text-xs text-slate-500">Connect rate (%) by hour of day, your local time.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="connectRate" fill="#2563eb" name="Connect Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold text-slate-900">Disposition Breakdown</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dispositionChartData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold text-slate-900">Top Objections</h2>
        {objectionChartData.length === 0 ? (
          <p className="text-sm text-slate-500">No objections logged yet.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={objectionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#d97706" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold text-slate-900">Recent Sessions</h2>
        {data.sessions.length === 0 ? (
          <p className="text-sm text-slate-500">No power dialer sessions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2">Started</th>
                <th className="pb-2">Calls</th>
                <th className="pb-2">Connects</th>
                <th className="pb-2">Pace (calls/hr)</th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-2">{new Date(s.started_at).toLocaleString()}</td>
                  <td className="py-2">{s.calls_made}</td>
                  <td className="py-2">{s.connects}</td>
                  <td className="py-2">{s.callsPerHour ? s.callsPerHour.toFixed(1) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
