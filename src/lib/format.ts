const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const WEEKDAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const number = new Intl.NumberFormat('id-ID');
const compact = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

export const formatNumber = (n: number) => number.format(n);

export const formatRupiah = (n: number) => `Rp ${number.format(n)}`;

export const formatPercent = (part: number, total: number) => `${total ? compact.format((part / total) * 100) : 0}%`;

export function formatCompact(n: number): string {
  if (n >= 1e9) return `${compact.format(n / 1e9)} M`;
  if (n >= 1e6) return `${compact.format(n / 1e6)} jt`;
  if (n >= 1e3) return `${compact.format(n / 1e3)} rb`;
  return compact.format(n);
}

export function formatDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return `${date} ${MONTHS_ID[month - 1]} ${year}`;
}

export function formatDayLong(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return `${WEEKDAYS_ID[new Date(Date.UTC(year, month - 1, date)).getUTCDay()]}, ${formatDay(day)}`;
}

export function endOfMonth(day: string): string {
  const [year, month] = day.split('-').map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${day.slice(0, 7)}-${String(last).padStart(2, '0')}`;
}

export const monthName = (day: string) => MONTHS_ID[Number(day.slice(5, 7)) - 1];
