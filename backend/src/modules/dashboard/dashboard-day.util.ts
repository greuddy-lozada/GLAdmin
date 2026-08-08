/** Venezuela default — America/Caracas is fixed UTC−4 (no DST). */
export const DASHBOARD_TZ = 'America/Caracas';
export const DASHBOARD_TZ_OFFSET = '-04:00';

/** Calendar YYYY-MM-DD in America/Caracas. */
export function localYmd(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DASHBOARD_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function addDaysYmd(ymd: string, days: number): string {
  const noon = new Date(`${ymd}T12:00:00${DASHBOARD_TZ_OFFSET}`);
  noon.setTime(noon.getTime() + days * 86_400_000);
  return localYmd(noon);
}

/** Inclusive start, exclusive end [start, end) for a Caracas calendar day. */
export function dayRange(ymd: string): { start: Date; end: Date } {
  const start = new Date(`${ymd}T00:00:00${DASHBOARD_TZ_OFFSET}`);
  const end = new Date(start.getTime() + 86_400_000);
  return { start, end };
}

export function pctChange(today: number, yesterday: number): number | null {
  if (yesterday === 0) return null;
  return ((today - yesterday) / yesterday) * 100;
}
