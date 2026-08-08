import { pctChange, dayRange, addDaysYmd, localYmd } from './dashboard-day.util';

describe('dashboard-day.util', () => {
  it('dayRange is 24h exclusive end', () => {
    const { start, end } = dayRange('2026-08-08');
    expect(end.getTime() - start.getTime()).toBe(86_400_000);
    expect(start.toISOString()).toBe('2026-08-08T04:00:00.000Z');
  });

  it('addDaysYmd steps calendar days', () => {
    expect(addDaysYmd('2026-08-08', -1)).toBe('2026-08-07');
  });

  it('pctChange returns null when yesterday is 0', () => {
    expect(pctChange(10, 0)).toBeNull();
    expect(pctChange(20, 10)).toBe(100);
  });

  it('localYmd returns YYYY-MM-DD', () => {
    expect(localYmd(new Date('2026-08-08T12:00:00-04:00'))).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });
});
