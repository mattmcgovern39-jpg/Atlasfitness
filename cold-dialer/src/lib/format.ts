export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 1000) / 10}%`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeDue(iso: string | null | undefined): string {
  if (!iso) return '—';
  const target = new Date(iso).getTime();
  const diffMs = target - Date.now();
  const diffMin = Math.round(diffMs / 60000);

  if (Math.abs(diffMin) < 60) return diffMin <= 0 ? 'Due now' : `In ${diffMin}m`;
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return diffHr <= 0 ? `${Math.abs(diffHr)}h overdue` : `In ${diffHr}h`;
  const diffDay = Math.round(diffHr / 24);
  return diffDay <= 0 ? `${Math.abs(diffDay)}d overdue` : `In ${diffDay}d`;
}

export function leadName(lead: { first_name: string | null; last_name: string | null }): string {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim();
  return name || 'Unknown';
}
