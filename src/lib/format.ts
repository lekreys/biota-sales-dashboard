const number = new Intl.NumberFormat('id-ID');

export const formatNumber = (n: number) => number.format(n);
export const formatRupiah = (n: number) => `Rp ${number.format(n)}`;

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** "2026-10-01" -> "1 Okt 2026" (string based, no time-zone conversion). */
export function formatDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return `${d} ${MONTHS_ID[m - 1]} ${y}`;
}

/** Last calendar day of the month of "YYYY-MM-DD". */
export function endOfMonth(day: string): string {
  const [y, m] = day.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${day.slice(0, 7)}-${String(last).padStart(2, '0')}`;
}

export const monthName = (day: string) => MONTHS_ID[Number(day.slice(5, 7)) - 1];

const WEEKDAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

/** "2026-10-15" -> "Kam, 15 Okt 2026". */
export function formatDayLong(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return `${WEEKDAYS_ID[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${formatDay(day)}`;
}

const compact = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

/** Short form for chart axes: 0, 500 rb, 10 jt, 1,5 M. */
export function formatCompact(n: number): string {
  if (n >= 1e9) return `${compact.format(n / 1e9)} M`;
  if (n >= 1e6) return `${compact.format(n / 1e6)} jt`;
  if (n >= 1e3) return `${compact.format(n / 1e3)} rb`;
  return compact.format(n);
}
