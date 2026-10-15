const TZ = undefined;

export function formatTimeAmPm(iso) {
  if (!iso) return '—';
  return new Date(iso + 'Z').toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TZ,
  });
}

export function formatDateShort(iso) {
  if (!iso) return '';
  return new Date(iso + 'Z').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: TZ,
  });
}

export function formatDateTimeAmPm(iso) {
  if (!iso) return '—';
  return `${formatDateShort(iso)} · ${formatTimeAmPm(iso)}`;
}

export function formatClock(date = new Date()) {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}
