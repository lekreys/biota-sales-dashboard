import { classifyStatus, normalizeChannel, parseMoney, parseOrderDate, parseQty } from './parse';
import type { CleanResult, CleanRow, FormatExample, RawRow, RejectedRow, SourceFile } from './types';

interface ParsedRow {
  row: CleanRow;
  formats: FormatExample[];
  rawChannel: string;
}

const tidy = (text: string | undefined) => (text ?? '').trim().replace(/\s+/g, ' ');

export function productKey(row: Pick<CleanRow, 'sku' | 'productName'>): string {
  return row.sku || `TANPA SKU: ${row.productName}`;
}

function parseRow(raw: RawRow): ParsedRow | string {
  const orderId = tidy(raw.order_id);
  if (!orderId) return 'order_id kosong';

  const date = parseOrderDate(raw.order_date);
  if (!date) return `tanggal tidak dikenali: "${tidy(raw.order_date)}"`;

  const channel = normalizeChannel(raw.channel);
  if (!channel) return `channel tidak dikenali: "${tidy(raw.channel)}"`;

  const qty = parseQty(raw.qty);
  if (qty === null) return `qty tidak valid: "${tidy(raw.qty)}"`;

  const unitPrice = parseMoney(raw.unit_price);
  if (!unitPrice) return `unit_price tidak valid: "${tidy(raw.unit_price)}"`;

  const totalPrice = parseMoney(raw.total_price);
  if (!totalPrice) return `total_price tidak valid: "${tidy(raw.total_price)}"`;

  const statusRaw = tidy(raw.status);
  return {
    row: {
      orderId,
      day: date.day,
      time: date.time,
      channel,
      sku: tidy(raw.sku).toUpperCase(),
      skuRecovered: false,
      productName: tidy(raw.product_name),
      qty,
      unitPrice: unitPrice.value,
      totalPrice: totalPrice.value,
      statusRaw,
      status: classifyStatus(statusRaw),
      buyerCity: tidy(raw.buyer_city),
    },
    formats: [
      { field: 'date', format: date.format, example: tidy(raw.order_date) },
      { field: 'money', format: unitPrice.format, example: tidy(raw.unit_price) },
      { field: 'money', format: totalPrice.format, example: tidy(raw.total_price) },
    ],
    rawChannel: tidy(raw.channel),
  };
}

function recoverSkus(rows: CleanRow[]): void {
  const byChannelName = new Map<string, Set<string>>();
  const byName = new Map<string, Set<string>>();
  const remember = (map: Map<string, Set<string>>, key: string, sku: string) =>
    map.set(key, (map.get(key) ?? new Set()).add(sku));
  const onlyOne = (skus?: Set<string>) => (skus?.size === 1 ? [...skus][0] : undefined);

  for (const row of rows) {
    if (!row.sku) continue;
    remember(byChannelName, `${row.channel}|${row.productName.toLowerCase()}`, row.sku);
    remember(byName, row.productName.toLowerCase(), row.sku);
  }

  for (const row of rows) {
    if (row.sku) continue;
    const sku =
      onlyOne(byChannelName.get(`${row.channel}|${row.productName.toLowerCase()}`)) ??
      onlyOne(byName.get(row.productName.toLowerCase()));
    if (sku) {
      row.sku = sku;
      row.skuRecovered = true;
    }
  }
}

function removeDuplicates(rows: CleanRow[]): { unique: CleanRow[]; duplicateValue: number } {
  const seen = new Set<string>();
  const unique: CleanRow[] = [];
  let duplicateValue = 0;

  for (const row of rows) {
    const key = [
      row.orderId,
      row.channel,
      row.day,
      row.time,
      row.sku,
      row.productName,
      row.qty,
      row.unitPrice,
      row.totalPrice,
      row.statusRaw.toLowerCase(),
      row.buyerCity,
    ].join('|');

    if (seen.has(key)) {
      if (row.status === 'counted') duplicateValue += row.totalPrice;
      continue;
    }
    seen.add(key);
    unique.push(row);
  }
  return { unique, duplicateValue };
}

function shortestNames(rows: CleanRow[]): Record<string, string> {
  const names: Record<string, string> = {};
  for (const row of rows) {
    const key = productKey(row);
    const current = names[key];
    const shorter = current === undefined || row.productName.length < current.length;
    const sameLengthFirst = row.productName.length === current?.length && row.productName < current;
    if (shorter || sameLengthFirst) names[key] = row.productName;
  }
  return names;
}

export function cleanRows(files: SourceFile[]): CleanResult {
  const parsed: CleanRow[] = [];
  const rejected: RejectedRow[] = [];
  const formats = new Map<string, FormatExample>();
  const spellings = new Set<string>();
  let rowsRead = 0;

  for (const file of files) {
    file.rows.forEach((raw, index) => {
      rowsRead++;
      const result = parseRow(raw);
      if (typeof result === 'string') {
        rejected.push({ file: file.name, line: index + 2, reason: result });
        return;
      }
      parsed.push(result.row);
      spellings.add(result.rawChannel);
      for (const format of result.formats) {
        const key = `${format.field}|${format.format}`;
        if (!formats.has(key)) formats.set(key, format);
      }
    });
  }

  recoverSkus(parsed);
  const { unique, duplicateValue } = removeDuplicates(parsed);

  return {
    rows: unique,
    rowsRead,
    rejected,
    duplicatesRemoved: parsed.length - unique.length,
    duplicateValue,
    skuMissing: unique.filter((row) => row.skuRecovered || !row.sku).length,
    skuRecovered: unique.filter((row) => row.skuRecovered).length,
    priceMismatches: unique.filter((row) => row.qty * row.unitPrice !== row.totalPrice).length,
    productNames: shortestNames(unique),
    formats: [...formats.values()],
    channelSpellings: [...spellings],
  };
}
