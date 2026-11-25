import { classifyStatus, normalizeChannel, parseQty, readMoney, readOrderDate } from './parse';
import type { Channel, CleanResult, CleanRow, FormatStat, RejectedRow, SourceFile } from './types';

const clean = (s: string | undefined) => (s ?? '').trim().replace(/\s+/g, ' ');

/** Rows without a recoverable SKU are grouped by their listing name instead. */
export function productKey(row: Pick<CleanRow, 'sku' | 'productName'>): string {
  return row.sku || `TANPA SKU: ${row.productName}`;
}

/** A parsed row plus the raw formats it was written in (for the data-quality report). */
interface ParsedRow {
  row: CleanRow;
  seen: { field: FormatStat['field']; format: string; example: string }[];
  rawChannel: string;
}

function parseRow(raw: Record<string, string>): ParsedRow | string {
  const orderId = clean(raw.order_id);
  if (!orderId) return 'order_id kosong';

  const date = readOrderDate(raw.order_date);
  if (!date) return `tanggal tidak dikenali: "${clean(raw.order_date)}"`;

  const channel = normalizeChannel(raw.channel);
  if (!channel) return `channel tidak dikenali: "${clean(raw.channel)}"`;

  const qty = parseQty(raw.qty);
  if (qty === null) return `qty tidak valid: "${clean(raw.qty)}"`;

  const unit = readMoney(raw.unit_price);
  if (unit === null) return `unit_price tidak valid: "${clean(raw.unit_price)}"`;

  const total = readMoney(raw.total_price);
  if (total === null) return `total_price tidak valid: "${clean(raw.total_price)}"`;

  const statusRaw = clean(raw.status);
  return {
    row: {
      orderId,
      day: date.day,
      time: date.time,
      channel,
      sku: clean(raw.sku).toUpperCase(),
      skuRecovered: false,
      productName: clean(raw.product_name),
      qty,
      unitPrice: unit.value,
      totalPrice: total.value,
      statusRaw,
      status: classifyStatus(statusRaw),
      buyerCity: clean(raw.buyer_city),
    },
    seen: [
      { field: 'date', format: date.format, example: clean(raw.order_date) },
      { field: 'money', format: unit.format, example: clean(raw.unit_price) },
      { field: 'money', format: total.format, example: clean(raw.total_price) },
    ],
    rawChannel: clean(raw.channel),
  };
}

/**
 * Turns one or more marketplace exports into one clean list of order lines:
 * 1. parse and normalise every row (rows that cannot be read are rejected with a reason),
 * 2. fill in empty SKUs from other rows with the same channel + listing name,
 * 3. drop exact duplicate lines (same order, product, qty, price, status, date, city).
 */
export function cleanRows(files: SourceFile[]): CleanResult {
  const parsed: CleanRow[] = [];
  const rejected: RejectedRow[] = [];
  const formats = new Map<string, FormatStat>();
  const spellings = new Map<string, { raw: string; channel: Channel; count: number }>();
  let rowsRead = 0;

  for (const file of files) {
    file.rows.forEach((raw, i) => {
      rowsRead++;
      const result = parseRow(raw);
      if (typeof result === 'string') {
        rejected.push({ file: file.name, line: i + 2, reason: result });
        return;
      }
      const { row } = result;
      parsed.push(row);
      for (const s of result.seen) {
        const key = `${s.field}|${s.format}`;
        const stat = formats.get(key) ?? { field: s.field, format: s.format, example: s.example, count: 0, channels: [] };
        stat.count++;
        if (!stat.channels.includes(row.channel)) stat.channels.push(row.channel);
        formats.set(key, stat);
      }
      const spelling = spellings.get(result.rawChannel) ?? { raw: result.rawChannel, channel: row.channel, count: 0 };
      spelling.count++;
      spellings.set(result.rawChannel, spelling);
    });
  }

  // Learn listing name -> SKU from rows that do have a SKU.
  const byChannelName = new Map<string, Set<string>>();
  const byName = new Map<string, Set<string>>();
  const add = (map: Map<string, Set<string>>, key: string, sku: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(sku);
  };
  for (const r of parsed) {
    if (!r.sku) continue;
    add(byChannelName, `${r.channel}|${r.productName.toLowerCase()}`, r.sku);
    add(byName, r.productName.toLowerCase(), r.sku);
  }
  const only = (set?: Set<string>) => (set && set.size === 1 ? [...set][0] : undefined);

  for (const r of parsed) {
    if (r.sku) continue;
    const sku =
      only(byChannelName.get(`${r.channel}|${r.productName.toLowerCase()}`)) ??
      only(byName.get(r.productName.toLowerCase()));
    if (sku) {
      r.sku = sku;
      r.skuRecovered = true;
    }
  }

  const seen = new Set<string>();
  const rows: CleanRow[] = [];
  let duplicateValue = 0;
  for (const r of parsed) {
    const key = [
      r.orderId, r.channel, r.day, r.time, r.sku, r.productName,
      r.qty, r.unitPrice, r.totalPrice, r.statusRaw.toLowerCase(), r.buyerCity,
    ].join('|');
    if (seen.has(key)) {
      if (r.status === 'counted') duplicateValue += r.totalPrice;
      continue;
    }
    seen.add(key);
    rows.push(r);
  }

  // Display name per product: the shortest listing name across marketplaces.
  const productNames: Record<string, string> = {};
  for (const r of rows) {
    const key = productKey(r);
    const current = productNames[key];
    if (
      current === undefined ||
      r.productName.length < current.length ||
      (r.productName.length === current.length && r.productName < current)
    ) {
      productNames[key] = r.productName;
    }
  }

  return {
    rows,
    rowsRead,
    rejected,
    duplicatesRemoved: parsed.length - rows.length,
    // Counted on the clean lines (after duplicates are removed), so a duplicate is not counted twice.
    skuMissing: rows.filter((r) => r.skuRecovered || !r.sku).length,
    skuRecovered: rows.filter((r) => r.skuRecovered).length,
    priceMismatches: rows.filter((r) => r.qty * r.unitPrice !== r.totalPrice).length,
    duplicateValue,
    productNames,
    formats: [...formats.values()].sort((a, b) => a.field.localeCompare(b.field) || b.count - a.count),
    channelSpellings: [...spellings.values()].sort((a, b) => a.channel.localeCompare(b.channel) || b.count - a.count),
  };
}
