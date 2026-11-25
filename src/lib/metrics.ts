import { productKey } from './clean';
import { CHANNELS } from './types';
import type { Channel, CleanResult, CleanRow, StatusCategory } from './types';

export interface Filters {
  from: string;
  to: string;
  channels: Channel[];
  product: string | null;
}

export const NO_FILTERS: Filters = { from: '', to: '', channels: [...CHANNELS], product: null };

export const isValidRange = (filters: Filters) => !(filters.from && filters.to && filters.from > filters.to);

export function applyFilters(
  rows: CleanRow[],
  filters: Filters,
  ignore: { date?: boolean; channel?: boolean; product?: boolean } = {},
): CleanRow[] {
  return rows.filter(
    (row) =>
      (ignore.date || ((!filters.from || row.day >= filters.from) && (!filters.to || row.day <= filters.to))) &&
      (ignore.channel || filters.channels.includes(row.channel)) &&
      (ignore.product || filters.product === null || productKey(row) === filters.product),
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
  excludedLines: number;
  byChannel: ChannelSummary[];
  byProduct: ProductSummary[];
  statuses: StatusSummary[];
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const orderKey = (row: CleanRow) => `${row.channel}|${row.orderId}`;
const perChannel = (): Record<Channel, number> => ({ Shopee: 0, 'TikTok Shop': 0, Tokopedia: 0 });

export function summarize(rows: CleanRow[], productNames: Record<string, string>): Summary {
  const counted = rows.filter((row) => row.status === 'counted');

  const byChannel = CHANNELS.map((channel) => {
    const lines = counted.filter((row) => row.channel === channel);
    return {
      channel,
      netRevenue: sum(lines.map((row) => row.totalPrice)),
      orders: new Set(lines.map(orderKey)).size,
      units: sum(lines.map((row) => row.qty)),
    };
  });

  const products = new Map<string, ProductSummary>();
  for (const row of counted) {
    const key = productKey(row);
    const product = products.get(key) ?? {
      key,
      sku: row.sku,
      name: productNames[key] ?? row.productName,
      netRevenue: 0,
      units: 0,
      byChannel: perChannel(),
    };
    product.netRevenue += row.totalPrice;
    product.units += row.qty;
    product.byChannel[row.channel] += row.totalPrice;
    products.set(key, product);
  }

  const statuses = new Map<string, StatusSummary>();
  for (const row of rows) {
    const status = statuses.get(row.statusRaw) ?? {
      statusRaw: row.statusRaw,
      category: row.status,
      lines: 0,
      value: 0,
    };
    status.lines++;
    status.value += row.totalPrice;
    statuses.set(row.statusRaw, status);
  }

  return {
    netRevenue: sum(counted.map((row) => row.totalPrice)),
    orders: new Set(counted.map(orderKey)).size,
    units: sum(counted.map((row) => row.qty)),
    excludedLines: rows.length - counted.length,
    byChannel,
    byProduct: [...products.values()].sort((a, b) => b.netRevenue - a.netRevenue || a.name.localeCompare(b.name)),
    statuses: [...statuses.values()].sort((a, b) => b.lines - a.lines),
  };
}

export interface DayPoint {
  day: string;
  byChannel: Record<Channel, number>;
  total: number;
}

export function daysBetween(first: string, last: string): string[] {
  const [year, month, day] = first.split('-').map(Number);
  const days: string[] = [];
  for (let offset = 0; ; offset++) {
    const current = new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10);
    if (current > last) return days;
    days.push(current);
  }
}

export function dailyRevenue(rows: CleanRow[], first: string, last: string): DayPoint[] {
  const points = daysBetween(first, last).map((day) => ({ day, byChannel: perChannel(), total: 0 }));
  const index = new Map(points.map((point, i) => [point.day, i]));
  for (const row of rows) {
    const i = index.get(row.day);
    if (row.status !== 'counted' || i === undefined) continue;
    points[i].byChannel[row.channel] += row.totalPrice;
    points[i].total += row.totalPrice;
  }
  return points;
}

export function movingAverage(values: number[], window = 7): (number | null)[] {
  return values.map((_, i) => (i + 1 < window ? null : sum(values.slice(i + 1 - window, i + 1)) / window));
}

export interface Dashboard {
  first: string;
  last: string;
  summary: Summary;
  file: Summary;
  channels: ChannelSummary[];
  channelDaily: DayPoint[];
  products: ProductSummary[];
  daily: DayPoint[];
}

export function buildDashboard(cleaned: CleanResult, filters: Filters): Dashboard | null {
  if (cleaned.rows.length === 0) return null;

  const days = cleaned.rows.map((row) => row.day).sort();
  const first = days[0];
  const last = days[days.length - 1];
  const rows = isValidRange(filters) ? cleaned.rows : [];
  const names = cleaned.productNames;
  const allChannels = applyFilters(rows, filters, { channel: true });

  return {
    first,
    last,
    summary: summarize(applyFilters(rows, filters), names),
    file: summarize(cleaned.rows, names),
    channels: summarize(allChannels, names).byChannel,
    channelDaily: dailyRevenue(allChannels, filters.from || first, filters.to || last),
    products: summarize(applyFilters(rows, filters, { product: true }), names).byProduct,
    daily: dailyRevenue(applyFilters(cleaned.rows, filters, { date: true }), first, last),
  };
}
