'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { DispositionForm, type DispositionSubmission } from '@/components/DispositionForm';
import { formatPhone, telHref } from '@/lib/phone';
import { formatDuration, leadName } from '@/lib/format';
import { checkCallingHours, DEFAULT_CALLING_HOURS, parseHHMM } from '@/lib/callingHours';
import type { Lead, DialerSession as SessionType } from '@/lib/types';

type CallState = 'idle' | 'dialing';

const SCRIPT_TIPS = [
  'Open with a permission-based line: "Hi, this is [name] from [company] — did I catch you at a bad time?"',
  'State your reason for calling in one sentence. Lead with value, not features.',
  'Ask an open question early and then stop talking — let them respond.',
  'Listen for the real objection before answering it. Acknowledge, then reframe.',
  'Always ask for a specific next step (a meeting time, not "I\'ll follow up").',
  'Log the call immediately after hanging up while details are fresh.',
];

export function DialerSession() {
  const [session, setSession] = useState<SessionType | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [callState, setCallState] = useState<CallState>('idle');
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(4);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callingHours, setCallingHours] = useState(DEFAULT_CALLING_HOURS);
  const [showScript, setShowScript] = useState(false);
  const [sessionStats, setSessionStats] = useState({ callsMade: 0, connects: 0 });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const start = data.settings.calling_hours_start;
        const end = data.settings.calling_hours_end;
        if (!start || !end) return;

        const startParsed = parseHHMM(start, {
          hour: DEFAULT_CALLING_HOURS.startHour,
          minute: DEFAULT_CALLING_HOURS.startMinute,
        });
        const endParsed = parseHHMM(end, {
          hour: DEFAULT_CALLING_HOURS.endHour,
          minute: DEFAULT_CALLING_HOURS.endMinute,
        });

        setCallingHours({
          startHour: startParsed.hour,
          startMinute: startParsed.minute,
          endHour: endParsed.hour,
          endMinute: endParsed.minute,
        });
      })
      .catch(() => {});
  }, []);

  const loadNextLead = useCallback(async (exclude: string[]) => {
    setError(null);
    const params = exclude.length ? `?exclude=${exclude.join(',')}` : '';
    const res = await fetch(`/api/queue/next${params}`);
    const data = await res.json();
    setLead(data.lead);
    setQueueCount(data.queueCount);
    setCallState('idle');
    setCallStartedAt(null);
    setElapsed(0);
  }, []);

  async function handleStartSession() {
    const res = await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const data = await res.json();
    setSession(data.session);
    setSessionStats({ callsMade: 0, connects: 0 });
    setExcludeIds([]);
    await loadNextLead([]);
  }

  async function handleEndSession() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (session) {
      await fetch(`/api/sessions/${session.id}`, { method: 'PATCH' });
    }
    setSession(null);
    setLead(null);
    setCallState('idle');
    setCountdown(null);
  }

  function handleCallClick() {
    const startedAt = Date.now();
    setCallStartedAt(startedAt);
    setCallState('dialing');
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAt) / 1000));
    }, 1000);
  }

  async function handleDispositionSubmit(data: DispositionSubmission) {
    if (!lead || !callStartedAt) return;
    setSubmitting(true);
    setError(null);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          session_id: session?.id ?? null,
          disposition: data.disposition,
          objection: data.objection,
          notes: data.notes,
          duration_seconds: elapsed,
          started_at: new Date(callStartedAt).toISOString(),
          follow_up_at: data.follow_up_at,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error ?? 'Failed to log call');

      setSessionStats((s) => ({
        callsMade: s.callsMade + 1,
        connects: s.connects + (data.disposition.startsWith('connected') || data.disposition === 'meeting_booked' ? 1 : 0),
      }));

      const nextExclude = [...excludeIds, lead.id];
      setExcludeIds(nextExclude);
      setCallState('idle');
      setCallStartedAt(null);
      setElapsed(0);

      if (autoAdvance) {
        let remaining = autoAdvanceSeconds;
        setCountdown(remaining);
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setCountdown(null);
            loadNextLead(nextExclude);
          } else {
            setCountdown(remaining);
          }
        }, 1000);
      } else {
        await loadNextLead(nextExclude);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkip() {
    if (!lead) return;
    const nextExclude = [...excludeIds, lead.id];
    setExcludeIds(nextExclude);
    loadNextLead(nextExclude);
  }

  function handleNextNow() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
    loadNextLead(excludeIds);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  if (!session) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div className="card space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Power Dialer</h1>
          <p className="text-sm text-slate-500">
            Starts a tracked session. You&apos;ll click to call each lead, log the outcome, and
            we&apos;ll auto-advance to the next one.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm">
            <input
              id="auto"
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
            />
            <label htmlFor="auto">Auto-advance after logging a call</label>
          </div>
          {autoAdvance && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <span>Delay:</span>
              <input
                type="number"
                min={0}
                max={30}
                className="input w-20"
                value={autoAdvanceSeconds}
                onChange={(e) => setAutoAdvanceSeconds(Number(e.target.value))}
              />
              <span>seconds</span>
            </div>
          )}

          <button className="btn-primary w-full justify-center" onClick={handleStartSession}>
            Start Session
          </button>
        </div>
      </div>
    );
  }

  const hoursCheck = lead ? checkCallingHours(lead.timezone, callingHours) : { withinWindow: null, localTimeLabel: null };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {error && <div className="card border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}

        {!lead ? (
          <div className="card text-center">
            <p className="text-slate-700">🎉 Queue is empty — no leads due to call right now.</p>
            <p className="mt-1 text-sm text-slate-500">
              Import more leads or check back when follow-ups come due.
            </p>
          </div>
        ) : (
          <div className="card space-y-4">
            {lead.do_not_call === 1 && (
              <div className="rounded-lg bg-red-100 p-2 text-sm font-medium text-red-800">
                ⚠ This lead is marked Do Not Call. Skip immediately.
              </div>
            )}
            {hoursCheck.withinWindow === false && (
              <div className="rounded-lg bg-amber-100 p-2 text-sm text-amber-800">
                ⚠ It&apos;s {hoursCheck.localTimeLabel} for this lead — outside your configured
                calling window.
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold text-slate-900">{leadName(lead)}</h2>
              <p className="text-sm text-slate-500">
                {lead.company ?? '—'} {lead.title ? `· ${lead.title}` : ''}
              </p>
              <p className="mt-1 text-lg font-medium text-slate-800">{formatPhone(lead.phone)}</p>
              <p className="text-xs text-slate-500">
                Attempt #{lead.attempt_count + 1} · {lead.city ?? ''} {lead.state ?? ''}
              </p>
            </div>

            {lead.notes && (
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <strong>Notes:</strong> {lead.notes}
              </div>
            )}

            {callState === 'idle' ? (
              <div className="flex gap-2">
                <a href={telHref(lead.phone)} onClick={handleCallClick} className="btn-primary flex-1 justify-center text-base">
                  📞 Call {formatPhone(lead.phone)}
                </a>
                <button className="btn-secondary" onClick={handleSkip}>
                  Skip
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
                  <span className="text-sm font-medium text-emerald-800">Call in progress</span>
                  <span className="font-mono text-lg text-emerald-900">{formatDuration(elapsed)}</span>
                </div>
                <DispositionForm onSubmit={handleDispositionSubmit} submitting={submitting} />
              </div>
            )}

            {countdown !== null && (
              <div className="flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <span>Next lead in {countdown}s…</span>
                <button className="btn-secondary" onClick={handleNextNow}>
                  Next Now
                </button>
              </div>
            )}
          </div>
        )}

        <button className="text-sm text-slate-500 underline" onClick={() => setShowScript((s) => !s)}>
          {showScript ? 'Hide' : 'Show'} cold-calling best-practice checklist
        </button>
        {showScript && (
          <ul className="card list-disc space-y-1 pl-5 text-sm text-slate-700">
            {SCRIPT_TIPS.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4">
        <div className="card space-y-2">
          <h3 className="font-semibold text-slate-900">Session</h3>
          <div className="text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Calls made</span>
              <span className="font-medium">{sessionStats.callsMade}</span>
            </div>
            <div className="flex justify-between">
              <span>Connects</span>
              <span className="font-medium">{sessionStats.connects}</span>
            </div>
            <div className="flex justify-between">
              <span>Queue remaining</span>
              <span className="font-medium">{queueCount}</span>
            </div>
          </div>
          <button className="btn-danger mt-2 w-full justify-center" onClick={handleEndSession}>
            End Session
          </button>
        </div>
        <Link href="/analytics" className="block text-center text-sm text-brand-600 hover:underline">
          View full analytics →
        </Link>
      </div>
    </div>
  );
}
