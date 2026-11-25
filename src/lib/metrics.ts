import { productKey } from './clean';
import { CHANNELS } from './types';
import type { Channel, CleanRow, StatusCategory } from './types';

export interface Filters {
  from: string; // YYYY-MM-DD, '' = no limit
  to: string; // YYYY-MM-DD, '' = no limit
  channels: Channel[]; // selected channels; all three = no channel filter
  product: string | null; // product key (see productKey), null = all products
}

export const NO_FILTERS: Filters = { from: '', to: '', channels: [...CHANNELS], product: null };

/** Inclusive date filter on calendar days ("YYYY-MM-DD"). Empty bound = no limit. */
export function filterByDate(rows: CleanRow[], from: string, to: string): CleanRow[] {
  return rows.filter((r) => inDateRange(r, from, to));
}

function inDateRange(r: CleanRow, from: string, to: string): boolean {
  return (!from || r.day >= from) && (!to || r.day <= to);
}

/**
 * Applies the dashboard filters. `ignore` lets a panel keep its own context visible:
 * the channel panel ignores the channel filter (unselected channels are shown dimmed),
 * the trend chart ignores the date filter (the selected range is highlighted on the full period),
 * the product tables ignore the product filter (the selected product is highlighted).
 */
export function applyFilters(
  rows: CleanRow[],
  f: Filters,
  ignore: { date?: boolean; channel?: boolean; product?: boolean } = {},
): CleanRow[] {
  return rows.filter(
    (r) =>
      (ignore.date || inDateRange(r, f.from, f.to)) &&
      (ignore.channel || f.channels.includes(r.channel)) &&
      (ignore.product || f.product === null || productKey(r) === f.product),
  );
}

export interface ChannelSummary {
  channel: Channel;
  netRevenue: number;
  orders: number;
  units: number;
}

export interface ProductSummary {
  key: string;
  sku: string;
  name: string;
  netRevenue: number;
  units: number;
  byChannel: Record<Channel, number>;
}

export interface StatusSummary {
  statusRaw: string;
  category: StatusCategory;
  lines: number;
  value: number;
}

export interface Summary {
  netRevenue: number;
  orders: number;
  units: number;
  averageOrderValue: number; // net revenue / orders, rounded to whole rupiah
  excludedValue: number; // total_price of cancelled, returned and unknown-status lines
  excludedLines: number;
  byChannel: ChannelSummary[];
  byProduct: ProductSummary[];
  excluded: Record<Exclude<StatusCategory, 'counted'>, { lines: number; value: number }>;
  statuses: StatusSummary[];
  linesInRange: number;
}

const orderKey = (r: CleanRow) => `${r.channel}|${r.orderId}`;
const emptyByChannel = (): Record<Channel, number> => ({ Shopee: 0, 'TikTok Shop': 0, Tokopedia: 0 });

/** Net revenue = sum of total_price over lines whose status is "counted". */
export function summarize(rows: CleanRow[], productNames: Record<string, string>): Summary {
  const counted = rows.filter((r) => r.status === 'counted');

  const byChannel = CHANNELS.map((channel) => {
    const lines = counted.filter((r) => r.channel === channel);
    return {
      channel,
      netRevenue: sum(lines.map((r) => r.totalPrice)),
      orders: new Set(lines.map(orderKey)).size,
      units: sum(lines.map((r) => r.qty)),
    };
  });

  const products = new Map<string, ProductSummary>();
  for (const r of counted) {
    const key = productKey(r);
    const p = products.get(key) ?? {
      key,
      sku: r.sku,
      name: productNames[key] ?? r.productName,
      netRevenue: 0,
      units: 0,
      byChannel: emptyByChannel(),
    };
    p.netRevenue += r.totalPrice;
    p.units += r.qty;
    p.byChannel[r.channel] += r.totalPrice;
    products.set(key, p);
  }
  const byProduct = [...products.values()].sort(
    (a, b) => b.netRevenue - a.netRevenue || a.name.localeCompare(b.name),
  );

  const excluded = { cancelled: { lines: 0, value: 0 }, returned: { lines: 0, value: 0 }, unknown: { lines: 0, value: 0 } };
  const statuses = new Map<string, StatusSummary>();
  for (const r of rows) {
    if (r.status !== 'counted') {
      excluded[r.status].lines++;
      excluded[r.status].value += r.totalPrice;
    }
    const s = statuses.get(r.statusRaw) ?? { statusRaw: r.statusRaw, category: r.status, lines: 0, value: 0 };
    s.lines++;
    s.value += r.totalPrice;
    statuses.set(r.statusRaw, s);
  }

  const netRevenue = sum(counted.map((r) => r.totalPrice));
  const orders = new Set(counted.map(orderKey)).size;
  return {
    netRevenue,
    orders,
    units: sum(counted.map((r) => r.qty)),
    averageOrderValue: orders ? Math.round(netRevenue / orders) : 0,
    excludedValue: excluded.cancelled.value + excluded.returned.value + excluded.unknown.value,
    excludedLines: excluded.cancelled.lines + excluded.returned.lines + excluded.unknown.lines,
    byChannel,
    byProduct,
    excluded,
    statuses: [...statuses.values()].sort((a, b) => b.lines - a.lines),
    linesInRange: rows.length,
  };
}

export interface DayPoint {
  day: string;
  byChannel: Record<Channel, number>;
  total: number;
}

/** Every calendar day from first to last (inclusive), as "YYYY-MM-DD". */
export function daysBetween(first: string, last: string): string[] {
  const [y, m, d] = first.split('-').map(Number);
  const days: string[] = [];
  for (let i = 0; ; i++) {
    const day = new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10);
    if (day > last) return days;
    days.push(day);
  }
}

/** Net revenue per day and channel. Days without sales are included with zero. */
export function dailyRevenue(rows: CleanRow[], first: string, last: string): DayPoint[] {
  const points = daysBetween(first, last).map((day) => ({ day, byChannel: emptyByChannel(), total: 0 }));
  const index = new Map(points.map((p, i) => [p.day, i]));
  for (const r of rows) {
    const i = index.get(r.day);
    if (r.status !== 'counted' || i === undefined) continue;
    points[i].byChannel[r.channel] += r.totalPrice;
    points[i].total += r.totalPrice;
  }
  return points;
}

/** Trailing average over `window` days; null until a full window of days is available. */
export function movingAverage(values: number[], window = 7): (number | null)[] {
  return values.map((_, i) => (i + 1 < window ? null : sum(values.slice(i + 1 - window, i + 1)) / window));
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
