import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cleanRows } from './clean';
import { readCsv } from './csv';
import { buildDashboard, NO_FILTERS } from './metrics';
import type { Filters } from './metrics';

const csv = readCsv(readFileSync(resolve(__dirname, '../../data/biota_orders_oct2026.csv'), 'utf-8'));
if (!csv.ok) throw new Error(csv.error);
const cleaned = cleanRows([{ name: 'biota_orders_oct2026.csv', rows: csv.rows }]);

const dashboard = (filters: Partial<Filters> = {}) => buildDashboard(cleaned, { ...NO_FILTERS, ...filters })!;
const netByChannel = (filters: Partial<Filters> = {}) =>
  Object.fromEntries(dashboard(filters).channels.map((c) => [c.channel, c.netRevenue]));

describe('October 2026 export', () => {
  it('cleans the file as expected', () => {
    expect(cleaned.rowsRead).toBe(495);
    expect(cleaned.rejected).toEqual([]);
    expect(cleaned.duplicatesRemoved).toBe(22);
    expect(cleaned.duplicateValue).toBe(16_568_000);
    expect(cleaned.rows).toHaveLength(473);
    expect(cleaned.skuMissing).toBe(74);
    expect(cleaned.skuRecovered).toBe(74);
    expect(cleaned.priceMismatches).toBe(0);
    expect(cleaned.rows.filter((r) => r.status === 'unknown')).toEqual([]);
  });

  it('finds one date format per marketplace, four price formats and ten channel spellings', () => {
    const formatsOf = (field: 'date' | 'money') =>
      cleaned.formats
        .filter((f) => f.field === field)
        .map((f) => f.format)
        .sort();
    expect(formatsOf('date')).toEqual(['DD/MM/YYYY HH:mm:ss', 'Mon D, YYYY', 'YYYY-MM-DD HH:mm']);
    expect(formatsOf('money')).toEqual(['1,234,567', '1234567', 'IDR 1,234,567', 'Rp 1.234.567']);
    expect(cleaned.channelSpellings).toHaveLength(10);
  });

  it('net revenue for the whole month', () => {
    const { summary } = dashboard();
    expect(summary.netRevenue).toBe(298_937_000);
    expect(summary.orders).toBe(366);
    expect(summary.units).toBe(473);
    expect(summary.excludedLines).toBe(80);
    expect(netByChannel()).toEqual({ Shopee: 180_315_000, 'TikTok Shop': 70_461_000, Tokopedia: 48_161_000 });
  });

  it('net revenue for 1-15 October', () => {
    const firstHalf = { from: '2026-10-01', to: '2026-10-15' };
    expect(dashboard(firstHalf).summary.netRevenue).toBe(146_226_000);
    expect(netByChannel(firstHalf)).toEqual({ Shopee: 83_050_000, 'TikTok Shop': 36_812_000, Tokopedia: 26_364_000 });
  });

  it('net revenue for 16-31 October adds up to the month', () => {
    expect(dashboard({ from: '2026-10-16', to: '2026-10-31' }).summary.netRevenue).toBe(152_711_000);
    expect(146_226_000 + 152_711_000).toBe(298_937_000);
  });

  it('top 10 products by net revenue with units', () => {
    expect(
      dashboard()
        .products.slice(0, 10)
        .map((p) => [p.sku, p.netRevenue, p.units]),
    ).toEqual([
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
    const { daily } = dashboard();
    expect(daily).toHaveLength(31);
    expect(daily.reduce((sum, d) => sum + d.total, 0)).toBe(298_937_000);
    expect(daily.slice(0, 15).reduce((sum, d) => sum + d.total, 0)).toBe(146_226_000);
  });

  it('the channel and product filters give the same numbers as the tables', () => {
    expect(dashboard({ channels: ['Shopee'] }).summary.netRevenue).toBe(180_315_000);
    expect(dashboard({ product: 'BIO-CAM-BF' }).summary.netRevenue).toBe(60_445_000);
  });

  it('shows nothing for an invalid date range', () => {
    expect(dashboard({ from: '2026-10-20', to: '2026-10-10' }).summary.netRevenue).toBe(0);
  });
});
