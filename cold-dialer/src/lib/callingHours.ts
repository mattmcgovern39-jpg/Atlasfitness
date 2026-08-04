// Guard against dialing outside generally-accepted cold-calling hours
// (widely cited as 8am-9pm local time to the *called party*, echoing the
// TCPA's outer bound in the US). This is advisory only — the app never
// blocks a call, it just warns, since the user is the one placing the
// call manually.

export interface CallingHoursWindow {
  startHour: number; // 0-23
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export const DEFAULT_CALLING_HOURS: CallingHoursWindow = {
  startHour: 8,
  startMinute: 0,
  endHour: 21,
  endMinute: 0,
};

export function parseHHMM(value: string, fallback: { hour: number; minute: number }) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return fallback;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
  return { hour, minute };
}

/** Returns { hour, minute } for `date` as observed in `timeZone`. */
function localClock(date: Date, timeZone: string): { hour: number; minute: number } | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(date);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return { hour, minute };
  } catch {
    return null;
  }
}

export interface CallingHoursCheck {
  /** true = within window, false = outside, null = unknown time zone */
  withinWindow: boolean | null;
  localTimeLabel: string | null;
}

export function checkCallingHours(
  timeZone: string | null,
  window: CallingHoursWindow,
  now: Date = new Date()
): CallingHoursCheck {
  if (!timeZone) return { withinWindow: null, localTimeLabel: null };

  const clock = localClock(now, timeZone);
  if (!clock) return { withinWindow: null, localTimeLabel: null };

  const minutesNow = clock.hour * 60 + clock.minute;
  const minutesStart = window.startHour * 60 + window.startMinute;
  const minutesEnd = window.endHour * 60 + window.endMinute;

  const withinWindow = minutesNow >= minutesStart && minutesNow <= minutesEnd;
  const localTimeLabel = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(now);

  return { withinWindow, localTimeLabel };
}
