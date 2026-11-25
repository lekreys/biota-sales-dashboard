/**
 * Locks the final numbers for the real October 2026 file.
 * The expected values were produced independently by scripts/verify_numbers.py
 * (a separate Python implementation), not by this TypeScript code.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cleanRows } from './clean';
import { readCsv } from './csv';
import { applyFilters, dailyRevenue, filterByDate, NO_FILTERS, summarize } from './metrics';

const text = readFileSync(resolve(__dirname, '../../data/biota_orders_oct2026.csv'), 'utf-8');
const csv = readCsv(text);
if (!csv.ok) throw new Error(csv.error);
const result = cleanRows([{ name: 'biota_orders_oct2026.csv', rows: csv.rows }]);

const byChannel = (from: string, to: string) =>
  Object.fromEntries(
    summarize(filterByDate(result.rows, from, to), result.productNames).byChannel.map((c) => [c.channel, c.netRevenue]),
  );

describe('October 2026 export', () => {
  it('cleans the file as expected', () => {
    expect(result.rowsRead).toBe(495);
    expect(result.rejected).toEqual([]);
    expect(result.duplicatesRemoved).toBe(22);
    expect(result.rows).toHaveLength(473);
    // 76 raw rows have an empty SKU; 74 of them remain after duplicates are removed. All are recovered.
    expect(result.skuMissing).toBe(74);
    expect(result.skuRecovered).toBe(74);
    expect(result.priceMismatches).toBe(0);
    expect(result.rows.filter((r) => r.status === 'unknown')).toEqual([]);
  });

  it('net revenue for the whole month', () => {
    const s = summarize(result.rows, result.productNames);
    expect(s.netRevenue).toBe(298_937_000);
    expect(s.orders).toBe(366);
    expect(s.units).toBe(473);
    expect(byChannel('', '')).toEqual({
      Shopee: 180_315_000,
      'TikTok Shop': 70_461_000,
      Tokopedia: 48_161_000,
    });
  });

  it('net revenue for 1-15 October', () => {
    const s = summarize(filterByDate(result.rows, '2026-10-01', '2026-10-15'), result.productNames);
    expect(s.netRevenue).toBe(146_226_000);
    expect(byChannel('2026-10-01', '2026-10-15')).toEqual({
      Shopee: 83_050_000,
      'TikTok Shop': 36_812_000,
      Tokopedia: 26_364_000,
    });
  });

  it('net revenue for 16-31 October adds up to the month', () => {
    const s = summarize(filterByDate(result.rows, '2026-10-16', '2026-10-31'), result.productNames);
    expect(s.netRevenue).toBe(152_711_000);
    expect(146_226_000 + 152_711_000).toBe(298_937_000);
  });

  it('top 10 products by net revenue with units', () => {
    const top = summarize(result.rows, result.productNames).byProduct.slice(0, 10);
    expect(top.map((p) => [p.sku, p.netRevenue, p.units])).toEqual([
      ['BIO-CAM-BF', 60_445_000, 55],
      ['BIO-CAM-E4G', 39_582_000, 18],
      ['BIO-PET-FD', 36_859_000, 41],
      ['BIO-CAM-BBY', 36_372_000, 28],
      ['BIO-CAM-OPZ', 27_960_000, 40],
      ['BIO-CAM-DB', 25_568_000, 32],
      ['BIO-CAM-IPZ', 18_409_000, 41],
      ['BIO-CAM-IPL', 13_960_000, 40],
      ['BIO-SD-V128', 10_971_000, 69],
      ['BIO-PET-WF', 10_773_000, 27],
    ]);
  });

  it('the daily chart adds up to the same totals', () => {
    const days = dailyRevenue(result.rows, '2026-10-01', '2026-10-31');
    expect(days).toHaveLength(31);
    expect(days.reduce((a, d) => a + d.total, 0)).toBe(298_937_000);
    expect(days.slice(0, 15).reduce((a, d) => a + d.total, 0)).toBe(146_226_000);
  });

  it('the channel and product filters give the same numbers as the tables', () => {
    const shopee = applyFilters(result.rows, { ...NO_FILTERS, channels: ['Shopee'] });
    expect(summarize(shopee, result.productNames).netRevenue).toBe(180_315_000);
    const camera = applyFilters(result.rows, { ...NO_FILTERS, product: 'BIO-CAM-BF' });
    expect(summarize(camera, result.productNames).netRevenue).toBe(60_445_000);
  });

  it('every line is either counted or excluded for a known reason', () => {
    const s = summarize(result.rows, result.productNames);
    const counted = result.rows.filter((r) => r.status === 'counted').length;
    expect(counted + s.excluded.cancelled.lines + s.excluded.returned.lines).toBe(473);
  });
});
