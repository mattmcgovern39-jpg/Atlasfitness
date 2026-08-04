import { DISPOSITION_LABELS, type Disposition } from '@/lib/types';

const COLORS: Record<Disposition, string> = {
  connected_interested: 'bg-emerald-100 text-emerald-800',
  connected_not_interested: 'bg-slate-200 text-slate-700',
  connected_callback: 'bg-blue-100 text-blue-800',
  connected_gatekeeper: 'bg-amber-100 text-amber-800',
  meeting_booked: 'bg-purple-100 text-purple-800',
  voicemail: 'bg-sky-100 text-sky-800',
  no_answer: 'bg-slate-100 text-slate-600',
  busy: 'bg-slate-100 text-slate-600',
  wrong_number: 'bg-red-100 text-red-700',
  disconnected: 'bg-red-100 text-red-700',
  not_now: 'bg-amber-100 text-amber-800',
  do_not_call: 'bg-red-200 text-red-900',
};

export function DispositionBadge({ disposition }: { disposition: Disposition }) {
  return (
    <span className={`badge ${COLORS[disposition]}`}>{DISPOSITION_LABELS[disposition]}</span>
  );
}
