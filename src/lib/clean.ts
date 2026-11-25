import { classifyStatus, normalizeChannel, parseMoney, parseOrderDate, parseQty } from './parse';
import type { CleanResult, CleanRow, RejectedRow, SourceFile } from './types';

const clean = (s: string | undefined) => (s ?? '').trim().replace(/\s+/g, ' ');

/** Rows without a recoverable SKU are grouped by their listing name instead. */
export function productKey(row: Pick<CleanRow, 'sku' | 'productName'>): string {
  return row.sku || `TANPA SKU: ${row.productName}`;
}

function parseRow(raw: Record<string, string>): CleanRow | string {
  const orderId = clean(raw.order_id);
  if (!orderId) return 'order_id kosong';

  const date = parseOrderDate(raw.order_date);
  if (!date) return `tanggal tidak dikenali: "${clean(raw.order_date)}"`;

  const channel = normalizeChannel(raw.channel);
  if (!channel) return `channel tidak dikenali: "${clean(raw.channel)}"`;

  const qty = parseQty(raw.qty);
  if (qty === null) return `qty tidak valid: "${clean(raw.qty)}"`;

  const unitPrice = parseMoney(raw.unit_price);
  if (unitPrice === null) return `unit_price tidak valid: "${clean(raw.unit_price)}"`;

  const totalPrice = parseMoney(raw.total_price);
  if (totalPrice === null) return `total_price tidak valid: "${clean(raw.total_price)}"`;

  const statusRaw = clean(raw.status);
  return {
    orderId,
    day: date.day,
    time: date.time,
    channel,
    sku: clean(raw.sku).toUpperCase(),
    skuRecovered: false,
    productName: clean(raw.product_name),
    qty,
    unitPrice,
    totalPrice,
    statusRaw,
    status: classifyStatus(statusRaw),
    buyerCity: clean(raw.buyer_city),
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
  let rowsRead = 0;

  for (const file of files) {
    file.rows.forEach((raw, i) => {
      rowsRead++;
      const result = parseRow(raw);
      if (typeof result === 'string') rejected.push({ file: file.name, line: i + 2, reason: result });
      else parsed.push(result);
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
  for (const r of parsed) {
    const key = [
      r.orderId, r.channel, r.day, r.time, r.sku, r.productName,
      r.qty, r.unitPrice, r.totalPrice, r.statusRaw.toLowerCase(), r.buyerCity,
    ].join('|');
    if (seen.has(key)) continue;
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
    productNames,
  };
}
