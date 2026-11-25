/**
 * Every number on the dashboard, checked against a second, independent implementation.
 *
 * scripts/verify_numbers.py recomputes everything in plain Python (no shared code) for
 * several filter scenarios. This test runs it and requires the TypeScript logic used by
 * the dashboard to produce exactly the same numbers: totals, the four KPI tiles, the channel
 * panel, every product (with its split per channel), every day of the daily chart, and the
 * file-level cleaning counts. Skipped only when python3 is not installed.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cleanRows } from './clean';
import { readCsv } from './csv';
import { applyFilters, dailyRevenue, summarize } from './metrics';
import type { Filters } from './metrics';
import type { Channel } from './types';

const csvPath = resolve(__dirname, '../../data/biota_orders_oct2026.csv');
const script = resolve(__dirname, '../../scripts/verify_numbers.py');

function python(): string | null {
  try {
    return execFileSync('python3', [script, '--json', csvPath], { encoding: 'utf-8' });
  } catch {
    return null;
  }
}

interface PyScenario {
  name: string;
  filter: { from: string; to: string; channels: Channel[]; product: string | null };
  totals: Record<string, number>;
  channels: Record<Channel, { net: number; orders: number; units: number }>;
  products: Record<string, { net: number; units: number; by_channel: Record<Channel, number> }>;
  daily: Record<string, Record<Channel, number>>;
}

const output = python();

describe.skipIf(output === null)('dashboard numbers = independent Python implementation', () => {
  const py = JSON.parse(output!) as {
    file: { rows_read: number; duplicates: number; clean_lines: number; sku_missing: number; sku_recovered: number; statuses: Record<string, { lines: number; value: number }> };
    scenarios: PyScenario[];
  };
  const csv = readCsv(readFileSync(csvPath, 'utf-8'));
  if (!csv.ok) throw new Error(csv.error);
  const cleaned = cleanRows([{ name: 'oct.csv', rows: csv.rows }]);
  const names = cleaned.productNames;
  const days = cleaned.rows.map((r) => r.day).sort();

  it('file cleaning counts and the status table', () => {
    const statuses = Object.fromEntries(
      summarize(cleaned.rows, names).statuses.map((s) => [s.statusRaw, { lines: s.lines, value: s.value }]),
    );
    expect({
      rows_read: cleaned.rowsRead,
      duplicates: cleaned.duplicatesRemoved,
      clean_lines: cleaned.rows.length,
      sku_missing: cleaned.skuMissing,
      sku_recovered: cleaned.skuRecovered,
      statuses,
    }).toEqual(py.file);
  });

  it('runs every scenario', () => {
    expect(py.scenarios.length).toBeGreaterThanOrEqual(8);
  });

  for (const s of py.scenarios) {
    describe(s.name, () => {
      const f: Filters = { ...s.filter };
      const all = summarize(applyFilters(cleaned.rows, f), names);

      it('headline number and KPI tiles', () => {
        expect({
          net: all.netRevenue,
          orders: all.orders,
          units: all.units,
          average: all.averageOrderValue,
          excluded_value: all.excludedValue,
          excluded_lines: all.excludedLines,
        }).toEqual(s.totals);
      });

      it('channel panel', () => {
        const channels = summarize(applyFilters(cleaned.rows, f, { channel: true }), names).byChannel;
        expect(Object.fromEntries(channels.map((c) => [c.channel, { net: c.netRevenue, orders: c.orders, units: c.units }]))).toEqual(
          s.channels,
        );
      });

      it('every product, with its split per channel', () => {
        const products = summarize(applyFilters(cleaned.rows, f, { product: true }), names).byProduct;
        expect(
          Object.fromEntries(products.map((p) => [p.sku, { net: p.netRevenue, units: p.units, by_channel: p.byChannel }])),
        ).toEqual(s.products);
      });

      it('every day of the daily chart', () => {
        const daily = dailyRevenue(applyFilters(cleaned.rows, f, { date: true }), days[0], days[days.length - 1]);
        expect(Object.fromEntries(daily.map((d) => [d.day, d.byChannel]))).toEqual(s.daily);
      });
    });
  }
});
