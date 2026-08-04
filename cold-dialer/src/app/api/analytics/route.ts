import { NextResponse } from 'next/server';
import {
  getAnalyticsSummary,
  getDispositionBreakdown,
  getObjectionBreakdown,
  getCallsByHour,
  getDailyTrend,
  getRecentSessionStats,
} from '@/lib/analytics';
import { handleApiError } from '@/lib/apiUtils';

export async function GET() {
  try {
    return NextResponse.json({
      summary: getAnalyticsSummary(),
      dispositions: getDispositionBreakdown(),
      objections: getObjectionBreakdown(),
      byHour: getCallsByHour(),
      dailyTrend: getDailyTrend(14),
      sessions: getRecentSessionStats(10),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
