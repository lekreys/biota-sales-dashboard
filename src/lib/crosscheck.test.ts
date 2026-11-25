import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cleanRows } from './clean';
import { readCsv } from './csv';
import { buildDashboard } from './metrics';
import type { Channel } from './types';

const csvPath = resolve(__dirname, '../../data/biota_orders_oct2026.csv');
const scriptPath = resolve(__dirname, '../../scripts/verify_numbers.py');

interface PythonScenario {
  name: string;
  filter: { from: string; to: string; channels: Channel[]; product: string | null };
  totals: { net: number; orders: number; units: number; excluded_lines: number };
  channels: Record<Channel, { net: number; orders: number; units: number }>;
  products: Record<string, { net: number; units: number; by_channel: Record<Channel, number> }>;
  daily: Record<string, Record<Channel, number>>;
}

interface PythonResult {
  file: {
    rows_read: number;
    duplicates: number;
    clean_lines: number;
    sku_missing: number;
    sku_recovered: number;
    statuses: Record<string, { lines: number; value: number }>;
  };
  scenarios: PythonScenario[];
}

function runPython(): PythonResult | null {
  try {
    return JSON.parse(execFileSync('python3', [scriptPath, '--json', csvPath], { encoding: 'utf-8' }));
  } catch {
    return null;
  }
}

const python = runPython();

describe.skipIf(python === null)('dashboard numbers = independent Python implementation', () => {
  const csv = readCsv(readFileSync(csvPath, 'utf-8'));
  if (!csv.ok) throw new Error(csv.error);
  const cleaned = cleanRows([{ name: 'oct.csv', rows: csv.rows }]);

  it('file cleaning counts and statuses', () => {
    const { file } = buildDashboard(cleaned, python!.scenarios[0].filter)!;
    expect({
      rows_read: cleaned.rowsRead,
      duplicates: cleaned.duplicatesRemoved,
      clean_lines: cleaned.rows.length,
      sku_missing: cleaned.skuMissing,
      sku_recovered: cleaned.skuRecovered,
      statuses: Object.fromEntries(file.statuses.map((s) => [s.statusRaw, { lines: s.lines, value: s.value }])),
    }).toEqual(python!.file);
  });

  it('runs every scenario', () => {
    expect(python!.scenarios.length).toBeGreaterThanOrEqual(8);
  });

  for (const scenario of python?.scenarios ?? []) {
    describe(scenario.name, () => {
      const dashboard = buildDashboard(cleaned, scenario.filter)!;

      it('headline numbers', () => {
        const { summary } = dashboard;
        expect({
          net: summary.netRevenue,
          orders: summary.orders,
          units: summary.units,
          excluded_lines: summary.excludedLines,
        }).toEqual(scenario.totals);
      });

      it('channel panel', () => {
        expect(
          Object.fromEntries(
            dashboard.channels.map((c) => [c.channel, { net: c.netRevenue, orders: c.orders, units: c.units }]),
          ),
        ).toEqual(scenario.channels);
      });

      it('every product, with its split per channel', () => {
        expect(
          Object.fromEntries(
            dashboard.products.map((p) => [p.sku, { net: p.netRevenue, units: p.units, by_channel: p.byChannel }]),
          ),
        ).toEqual(scenario.products);
      });

      it('every day of the daily chart', () => {
        expect(Object.fromEntries(dashboard.daily.map((d) => [d.day, d.byChannel]))).toEqual(scenario.daily);
      });
    });
  }
});
