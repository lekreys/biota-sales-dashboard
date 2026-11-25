import Papa from 'papaparse';
import type { CleanRow, RawRow, SourceFile } from './types';

const REQUIRED_COLUMNS = [
  'order_id',
  'order_date',
  'channel',
  'sku',
  'product_name',
  'qty',
  'unit_price',
  'total_price',
  'status',
];

export type CsvReadResult = { ok: true; rows: RawRow[] } | { ok: false; error: string };

export interface NamedFile {
  name: string;
  text: () => Promise<string>;
}

export function readCsv(text: string): CsvReadResult {
  const result = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.replace(/^﻿/, '').trim().toLowerCase(),
  });
  const columns = result.meta.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length > 0) return { ok: false, error: `Kolom wajib tidak ditemukan: ${missing.join(', ')}` };
  return { ok: true, rows: result.data };
}

export async function readFiles(list: NamedFile[]): Promise<{ files: SourceFile[]; problems: string[] }> {
  const files: SourceFile[] = [];
  const problems: string[] = [];
  for (const file of list) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      problems.push(`${file.name}: bukan file CSV. Simpan/ekspor sebagai .csv terlebih dahulu.`);
      continue;
    }
    const result = readCsv(await file.text());
    if (!result.ok) problems.push(`${file.name}: ${result.error}`);
    else if (result.rows.length === 0) problems.push(`${file.name}: file tidak berisi data.`);
    else files.push({ name: file.name, rows: result.rows });
  }
  return { files, problems };
}

export function toCsv(rows: CleanRow[]): string {
  return Papa.unparse(
    rows.map((row) => ({
      order_id: row.orderId,
      order_date: row.time ? `${row.day} ${row.time}` : row.day,
      channel: row.channel,
      sku: row.sku,
      sku_dipulihkan: row.skuRecovered ? 'ya' : 'tidak',
      product_name: row.productName,
      qty: row.qty,
      unit_price: row.unitPrice,
      total_price: row.totalPrice,
      status: row.statusRaw,
      kategori_status: row.status,
      dihitung_net_revenue: row.status === 'counted' ? 'ya' : 'tidak',
      buyer_city: row.buyerCity,
    })),
  );
}

export function downloadCsv(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
