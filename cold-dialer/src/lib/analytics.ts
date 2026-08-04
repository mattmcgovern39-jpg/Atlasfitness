import { db } from '../../db/client';
import { CONNECTED_DISPOSITIONS, POSITIVE_DISPOSITIONS, DISPOSITIONS, OBJECTIONS } from './types';
import type { Disposition, Objection } from './types';

export interface AnalyticsSummary {
  totalLeads: number;
  totalCalls: number;
  callsToday: number;
  callsThisWeek: number;
  connects: number;
  connectRate: number; // 0-1
  positiveOutcomes: number;
  conversionRate: number; // 0-1, of calls
  meetingsBooked: number;
  avgTalkTimeSeconds: number;
  followUpsDueToday: number;
  followUpsOverdue: number;
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeekIso(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday as start of week
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const totalLeads = (db.prepare(`SELECT COUNT(*) c FROM leads`).get() as { c: number }).c;
  const totalCalls = (db.prepare(`SELECT COUNT(*) c FROM calls`).get() as { c: number }).c;

  const callsToday = (
    db.prepare(`SELECT COUNT(*) c FROM calls WHERE started_at >= ?`).get(startOfTodayIso()) as {
      c: number;
    }
  ).c;
  const callsThisWeek = (
    db.prepare(`SELECT COUNT(*) c FROM calls WHERE started_at >= ?`).get(startOfWeekIso()) as {
      c: number;
    }
  ).c;

  const dispositionCounts = db
    .prepare(`SELECT disposition, COUNT(*) c, AVG(duration_seconds) avg_dur FROM calls GROUP BY disposition`)
    .all() as { disposition: Disposition; c: number; avg_dur: number }[];

  let connects = 0;
  let positiveOutcomes = 0;
  let meetingsBooked = 0;
  let connectedDurationTotal = 0;
  let connectedDurationCount = 0;

  for (const row of dispositionCounts) {
    if (CONNECTED_DISPOSITIONS.has(row.disposition)) {
      connects += row.c;
      connectedDurationTotal += (row.avg_dur ?? 0) * row.c;
      connectedDurationCount += row.c;
    }
    if (POSITIVE_DISPOSITIONS.has(row.disposition)) positiveOutcomes += row.c;
    if (row.disposition === 'meeting_booked') meetingsBooked = row.c;
  }

  const followUps = db
    .prepare(
      `SELECT
         SUM(CASE WHEN next_action_at IS NOT NULL AND next_action_at < ? THEN 1 ELSE 0 END) overdue,
         SUM(CASE WHEN next_action_at IS NOT NULL AND next_action_at >= ? AND next_action_at < ? THEN 1 ELSE 0 END) today
       FROM leads`
    )
    .get(
      startOfTodayIso(),
      startOfTodayIso(),
      new Date(new Date(startOfTodayIso()).getTime() + 86400000).toISOString()
    ) as { overdue: number | null; today: number | null };

  return {
    totalLeads,
    totalCalls,
    callsToday,
    callsThisWeek,
    connects,
    connectRate: totalCalls ? connects / totalCalls : 0,
    positiveOutcomes,
    conversionRate: totalCalls ? positiveOutcomes / totalCalls : 0,
    meetingsBooked,
    avgTalkTimeSeconds: connectedDurationCount ? connectedDurationTotal / connectedDurationCount : 0,
    followUpsDueToday: followUps.today ?? 0,
    followUpsOverdue: followUps.overdue ?? 0,
  };
}

export function getDispositionBreakdown(): { disposition: Disposition; count: number }[] {
  const rows = db
    .prepare(`SELECT disposition, COUNT(*) count FROM calls GROUP BY disposition`)
    .all() as { disposition: Disposition; count: number }[];
  const map = new Map(rows.map((r) => [r.disposition, r.count]));
  return DISPOSITIONS.map((d) => ({ disposition: d, count: map.get(d) ?? 0 }));
}

export function getObjectionBreakdown(): { objection: Objection; count: number }[] {
  const rows = db
    .prepare(
      `SELECT objection, COUNT(*) count FROM calls WHERE objection IS NOT NULL GROUP BY objection`
    )
    .all() as { objection: Objection; count: number }[];
  const map = new Map(rows.map((r) => [r.objection, r.count]));
  return OBJECTIONS.map((o) => ({ objection: o, count: map.get(o) ?? 0 }));
}

export interface HourBucket {
  hour: number; // 0-23, local machine time
  calls: number;
  connects: number;
  connectRate: number;
}

/** "Best time to call" heatmap data — calls & connect rate by hour of day. */
export function getCallsByHour(): HourBucket[] {
  const rows = db
    .prepare(
      `SELECT
         CAST(strftime('%H', started_at, 'localtime') AS INTEGER) hour,
         disposition
       FROM calls`
    )
    .all() as { hour: number; disposition: Disposition }[];

  const buckets: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    calls: 0,
    connects: 0,
    connectRate: 0,
  }));

  for (const row of rows) {
    const bucket = buckets[row.hour];
    if (!bucket) continue;
    bucket.calls += 1;
    if (CONNECTED_DISPOSITIONS.has(row.disposition)) bucket.connects += 1;
  }
  for (const bucket of buckets) {
    bucket.connectRate = bucket.calls ? bucket.connects / bucket.calls : 0;
  }
  return buckets;
}

export interface DailyTrendPoint {
  date: string; // YYYY-MM-DD
  calls: number;
  connects: number;
  positiveOutcomes: number;
}

export function getDailyTrend(days = 14): DailyTrendPoint[] {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const rows = db
    .prepare(
      `SELECT
         strftime('%Y-%m-%d', started_at, 'localtime') date,
         disposition
       FROM calls WHERE started_at >= ?`
    )
    .all(since.toISOString()) as { date: string; disposition: Disposition }[];

  const byDate = new Map<string, DailyTrendPoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDate.set(key, { date: key, calls: 0, connects: 0, positiveOutcomes: 0 });
  }

  for (const row of rows) {
    const point = byDate.get(row.date);
    if (!point) continue;
    point.calls += 1;
    if (CONNECTED_DISPOSITIONS.has(row.disposition)) point.connects += 1;
    if (POSITIVE_DISPOSITIONS.has(row.disposition)) point.positiveOutcomes += 1;
  }

  return Array.from(byDate.values());
}

export interface SessionStat {
  id: string;
  started_at: string;
  ended_at: string | null;
  calls_made: number;
  connects: number;
  callsPerHour: number | null;
}

export function getRecentSessionStats(limit = 10): SessionStat[] {
  const rows = db
    .prepare(`SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?`)
    .all(limit) as {
    id: string;
    started_at: string;
    ended_at: string | null;
    calls_made: number;
    connects: number;
  }[];

  return rows.map((r) => {
    const end = r.ended_at ? new Date(r.ended_at) : new Date();
    const hours = (end.getTime() - new Date(r.started_at).getTime()) / 3_600_000;
    return {
      ...r,
      callsPerHour: hours > 0.01 ? r.calls_made / hours : null,
    };
  });
}
