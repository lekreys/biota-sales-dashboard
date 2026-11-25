import Papa from 'papaparse';
import type { CleanRow, RawRow } from './types';

export const REQUIRED_COLUMNS = [
  'order_id', 'order_date', 'channel', 'sku', 'product_name', 'qty', 'unit_price', 'total_price', 'status',
];

export type CsvReadResult = { ok: true; rows: RawRow[] } | { ok: false; error: string };

/** Reads CSV text into rows keyed by lower-cased column name. */
export function readCsv(text: string): CsvReadResult {
  const result = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.replace(/^﻿/, '').trim().toLowerCase(),
  });
  const columns = result.meta.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length > 0) {
    return { ok: false, error: `Kolom wajib tidak ditemukan: ${missing.join(', ')}` };
  }
  return { ok: true, rows: result.data };
}

/** Cleaned lines back to CSV, for the "download clean data" button. */
export function toCsv(rows: CleanRow[]): string {
  return Papa.unparse(
    rows.map((r) => ({
      order_id: r.orderId,
      order_date: r.time ? `${r.day} ${r.time}` : r.day,
      channel: r.channel,
      sku: r.sku,
      sku_dipulihkan: r.skuRecovered ? 'ya' : 'tidak',
      product_name: r.productName,
      qty: r.qty,
      unit_price: r.unitPrice,
      total_price: r.totalPrice,
      status: r.statusRaw,
      kategori_status: r.status,
      dihitung_net_revenue: r.status === 'counted' ? 'ya' : 'tidak',
      buyer_city: r.buyerCity,
    })),
  );
}
