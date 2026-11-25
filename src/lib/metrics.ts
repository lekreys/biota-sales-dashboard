import { productKey } from './clean';
import { CHANNELS } from './types';
import type { Channel, CleanRow, StatusCategory } from './types';

/** Inclusive date filter on calendar days ("YYYY-MM-DD"). Empty bound = no limit. */
export function filterByDate(rows: CleanRow[], from: string, to: string): CleanRow[] {
  return rows.filter((r) => (!from || r.day >= from) && (!to || r.day <= to));
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
  byChannel: ChannelSummary[];
  byProduct: ProductSummary[];
  excluded: Record<Exclude<StatusCategory, 'counted'>, { lines: number; value: number }>;
  statuses: StatusSummary[];
  linesInRange: number;
}

const orderKey = (r: CleanRow) => `${r.channel}|${r.orderId}`;

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
    const p = products.get(key) ?? { key, sku: r.sku, name: productNames[key] ?? r.productName, netRevenue: 0, units: 0 };
    p.netRevenue += r.totalPrice;
    p.units += r.qty;
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

  return {
    netRevenue: sum(counted.map((r) => r.totalPrice)),
    orders: new Set(counted.map(orderKey)).size,
    units: sum(counted.map((r) => r.qty)),
    byChannel,
    byProduct,
    excluded,
    statuses: [...statuses.values()].sort((a, b) => b.lines - a.lines),
    linesInRange: rows.length,
  };
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
