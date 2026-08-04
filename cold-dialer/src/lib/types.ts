// Shared domain types + the controlled vocabularies that make the
// analytics meaningful. Keeping these as const tuples (not free text)
// is what makes "track everything so I can improve" actually work —
// consistent values are what you can aggregate later.

export const DISPOSITIONS = [
  'connected_interested',
  'connected_not_interested',
  'connected_callback',
  'connected_gatekeeper',
  'meeting_booked',
  'voicemail',
  'no_answer',
  'busy',
  'wrong_number',
  'disconnected',
  'not_now',
  'do_not_call',
] as const;

export type Disposition = (typeof DISPOSITIONS)[number];

export const DISPOSITION_LABELS: Record<Disposition, string> = {
  connected_interested: 'Connected — Interested',
  connected_not_interested: 'Connected — Not Interested',
  connected_callback: 'Connected — Requested Callback',
  connected_gatekeeper: 'Connected — Gatekeeper/Screener',
  meeting_booked: 'Meeting/Demo Booked',
  voicemail: 'Left Voicemail',
  no_answer: 'No Answer',
  busy: 'Busy',
  wrong_number: 'Wrong Number',
  disconnected: 'Disconnected / Invalid Number',
  not_now: 'Not Now — Follow Up Later',
  do_not_call: 'Requested Do Not Call',
};

// Dispositions that count as a "connect" for connect-rate analytics —
// i.e. you got a live human on the line.
export const CONNECTED_DISPOSITIONS: ReadonlySet<Disposition> = new Set([
  'connected_interested',
  'connected_not_interested',
  'connected_callback',
  'connected_gatekeeper',
  'meeting_booked',
  'do_not_call',
]);

// Dispositions that count as a positive outcome for conversion-rate analytics.
export const POSITIVE_DISPOSITIONS: ReadonlySet<Disposition> = new Set([
  'connected_interested',
  'connected_callback',
  'meeting_booked',
]);

// Dispositions after which the lead should immediately stop being dialed.
export const TERMINAL_DISPOSITIONS: ReadonlySet<Disposition> = new Set([
  'do_not_call',
  'wrong_number',
  'disconnected',
]);

export const OBJECTIONS = [
  'price_budget',
  'no_need',
  'bad_timing',
  'has_competitor',
  'not_decision_maker',
  'trust_credibility',
  'send_info_instead',
  'other',
] as const;

export type Objection = (typeof OBJECTIONS)[number];

export const OBJECTION_LABELS: Record<Objection, string> = {
  price_budget: 'Price / Budget',
  no_need: 'No Perceived Need',
  bad_timing: 'Bad Timing',
  has_competitor: 'Already Has a Competitor/Solution',
  not_decision_maker: 'Not the Decision Maker',
  trust_credibility: 'Trust / Credibility',
  send_info_instead: 'Wants Info Sent Instead',
  other: 'Other',
};

export const LEAD_STATUSES = [
  'new',
  'queued',
  'contacted',
  'callback_scheduled',
  'qualified',
  'not_interested',
  'bad_number',
  'dnc',
  'closed_won',
  'closed_lost',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  queued: 'Queued',
  contacted: 'Contacted',
  callback_scheduled: 'Callback Scheduled',
  qualified: 'Qualified',
  not_interested: 'Not Interested',
  bad_number: 'Bad Number',
  dnc: 'Do Not Call',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

export interface Lead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  title: string | null;
  phone: string;
  phone_raw: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  timezone: string | null;
  source: string | null;
  status: LeadStatus;
  priority: number;
  tags: string; // JSON-encoded string[]
  notes: string | null;
  attempt_count: number;
  last_call_at: string | null;
  next_action_at: string | null;
  do_not_call: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface CallRecord {
  id: string;
  lead_id: string;
  session_id: string | null;
  attempt_number: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  disposition: Disposition;
  objection: Objection | null;
  notes: string | null;
  follow_up_at: string | null;
  created_at: string;
}

export interface DialerSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  calls_made: number;
  connects: number;
  notes: string | null;
}

export interface ImportBatch {
  id: string;
  filename: string | null;
  imported_at: string;
  row_count: number;
  inserted_count: number;
  duplicate_count: number;
  error_count: number;
  errors: string | null;
}
