// Seeds a realistic two weeks of demo leads and call history so you can
// explore the dashboard and analytics with populated charts before
// importing your own list.
//
//   npm run db:seed:demo     # add demo data
//   npm run db:reset         # wipe it and start clean
//
// Uses the same createLead/logCall paths the app itself uses, so the
// generated data is identical in shape to real activity.
import { createLead, logCall, startSession, endSession } from '../src/lib/db';
import { db } from '../db/client';
import { DISPOSITIONS, OBJECTIONS } from '../src/lib/types';
import type { Disposition, Objection } from '../src/lib/types';

const FIRST = ['Jordan','Casey','Morgan','Taylor','Alex','Riley','Jamie','Avery','Quinn','Drew','Skyler','Reese','Cameron','Hayden','Rowan','Emerson','Finley','Sawyer','Blake','Devon'];
const LAST = ['Blake','Nguyen','Reyes','Kim','Patel','Okafor','Silva','Novak','Haddad','Larsen','Moreau','Costa','Bauer','Ibrahim','Walsh','Duarte','Kowalski','Mensah','Ortiz','Fischer'];
const COMPANIES = ['Riverside Fitness','Summit CrossFit','Elevate Studio','Ironclad Gym','Peak Performance','Anchor Athletics','Vertex Training','Forge Fitness','Cadence Club','Nomad Strength','Basecamp Gym','Tidewater Athletic','Granite Barbell','Lumen Pilates','Wildcard Boxing'];
const TITLES = ['Owner','General Manager','Operations Manager','Head Coach','Franchise Owner'];
const CITIES: [string, string, string][] = [
  ['Dallas','TX','214'], ['Denver','CO','303'], ['Phoenix','AZ','602'],
  ['San Francisco','CA','415'], ['Chicago','IL','312'], ['Atlanta','GA','404'],
  ['Seattle','WA','206'], ['Boston','MA','617'], ['Nashville','TN','629'],
  ['Portland','OR','503'],
];

// Weighted toward realistic cold-call outcomes: most dials don't connect.
const DISPOSITION_WEIGHTS: [Disposition, number][] = [
  ['no_answer', 30],
  ['voicemail', 24],
  ['busy', 6],
  ['connected_gatekeeper', 10],
  ['connected_not_interested', 9],
  ['not_now', 6],
  ['connected_callback', 5],
  ['connected_interested', 4],
  ['meeting_booked', 2],
  ['wrong_number', 2],
  ['disconnected', 1],
  ['do_not_call', 1],
];

function weightedPick<T>(pairs: [T, number][]): T {
  const total = pairs.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of pairs) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return pairs[pairs.length - 1]![0];
}

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Real cold calling happens in concentrated blocks, not spread evenly over
// the day, so each demo day gets a 2-3 hour sitting. The starting hour is
// weighted toward the windows that actually convert (mid-morning and late
// afternoon beat lunch), which gives the "Best Times to Call" chart a
// realistic shape while keeping each session's calls/hour pace believable.
const START_HOUR_WEIGHTS: [number, number][] = [
  [8, 8], [9, 14], [10, 12], [11, 6], [13, 7], [14, 10], [15, 12], [16, 9],
];

console.log('Seeding demo data...');

const leadIds: string[] = [];
for (let i = 0; i < 40; i++) {
  const [city, state, areaCode] = pick(CITIES);
  // 555-01xx is the reserved fictional-number range, and the index keeps
  // each one unique so none are dropped as duplicates on import.
  const phone = `(${areaCode}) 555-${String(100 + i).padStart(4, '0')}`;
  const { lead, duplicate } = createLead({
    first_name: pick(FIRST),
    last_name: pick(LAST),
    company: pick(COMPANIES),
    title: pick(TITLES),
    phone,
    email: null,
    city,
    state,
    source: 'demo-seed',
  });
  if (!duplicate) leadIds.push(lead.id);
}
console.log(`  ${leadIds.length} leads created`);

let callCount = 0;
const DAYS = 14;

for (let dayOffset = DAYS - 1; dayOffset >= 0; dayOffset--) {
  const day = new Date();
  day.setDate(day.getDate() - dayOffset);
  if (day.getDay() === 0 || day.getDay() === 6) continue; // skip weekends

  const session = startSession(`Demo session, ${day.toDateString()}`);
  const callsToday = randInt(8, 18);
  let earliestCall: Date | null = null;
  let latestCall: Date | null = null;

  // One concentrated sitting per day: pick its start hour and length, then
  // scatter the day's calls inside that block.
  const blockStartHour = weightedPick(START_HOUR_WEIGHTS);
  const blockMinutes = randInt(120, 180);

  for (let c = 0; c < callsToday; c++) {
    const leadId = pick(leadIds);
    const startedAt = new Date(day);
    startedAt.setHours(blockStartHour, 0, 0, 0);
    startedAt.setMinutes(startedAt.getMinutes() + randInt(0, blockMinutes));
    startedAt.setSeconds(randInt(0, 59));

    const disposition = weightedPick(DISPOSITION_WEIGHTS);
    const connected = disposition.startsWith('connected') || disposition === 'meeting_booked';
    const duration = connected ? randInt(45, 420) : randInt(0, 35);

    const needsObjection = ['connected_not_interested', 'connected_gatekeeper', 'not_now'].includes(disposition);
    const objection: Objection | null = needsObjection ? pick(OBJECTIONS) : null;

    let followUp: string | null = null;
    if (disposition === 'connected_callback' || disposition === 'not_now') {
      const fu = new Date(startedAt);
      fu.setDate(fu.getDate() + randInt(1, 7));
      followUp = fu.toISOString();
    }

    try {
      logCall({
        lead_id: leadId,
        session_id: session.id,
        disposition,
        objection,
        notes: connected ? 'Demo call note — captured during the conversation.' : null,
        duration_seconds: duration,
        started_at: startedAt.toISOString(),
        follow_up_at: followUp,
      });
      callCount++;
      if (!earliestCall || startedAt < earliestCall) earliestCall = startedAt;
      if (!latestCall || startedAt > latestCall) latestCall = startedAt;
    } catch {
      // Lead hit a terminal state (DNC/bad number) — skip, as the real
      // queue would have excluded it anyway.
    }
  }
  endSession(session.id);

  // startSession/endSession stamp "now"; backdate them to span the calls
  // they actually contain so the session list and calls/hour pace reflect
  // a real sitting instead of a zero-length one.
  if (earliestCall && latestCall) {
    const endedAt = new Date(latestCall.getTime() + randInt(60, 400) * 1000);
    db.prepare(`UPDATE sessions SET started_at = ?, ended_at = ? WHERE id = ?`).run(
      earliestCall.toISOString(),
      endedAt.toISOString(),
      session.id
    );
  }
}

console.log(`  ${callCount} calls logged across ${DAYS} days`);
console.log('Done. Run `npm run db:reset` to wipe it and start clean.');

void DISPOSITIONS;
