import { describe, expect, it } from 'vitest';
import { applyFilters, dailyRevenue, daysBetween, isValidRange, movingAverage, NO_FILTERS, summarize } from './metrics';
import type { CleanRow } from './types';

function line(overrides: Partial<CleanRow> = {}): CleanRow {
  return {
    orderId: 'O1',
    day: '2026-10-01',
    time: '10:00',
    channel: 'Shopee',
    sku: 'A',
    skuRecovered: false,
    productName: 'Produk A',
    qty: 1,
    unitPrice: 100,
    totalPrice: 100,
    statusRaw: 'Selesai',
    status: 'counted',
    buyerCity: 'Bogor',
    ...overrides,
  };
}

describe('applyFilters', () => {
  const byDay = [
    line({ day: '2026-10-01', time: null }),
    line({ day: '2026-10-15', time: '22:36' }),
    line({ day: '2026-10-16', time: '00:00' }),
  ];

  it('includes both ends of the date range, including late on the last day', () => {
    const rows = applyFilters(byDay, { ...NO_FILTERS, from: '2026-10-01', to: '2026-10-15' });
    expect(rows.map((r) => r.day)).toEqual(['2026-10-01', '2026-10-15']);
  });

  it('treats an empty date bound as no limit', () => {
    expect(applyFilters(byDay, NO_FILTERS)).toHaveLength(3);
    expect(applyFilters(byDay, { ...NO_FILTERS, from: '2026-10-16' })).toHaveLength(1);
  });

  const mixed = [
    line({ day: '2026-10-01', channel: 'Shopee', sku: 'A' }),
    line({ day: '2026-10-10', channel: 'Tokopedia', sku: 'B' }),
    line({ day: '2026-10-20', channel: 'TikTok Shop', sku: '', productName: 'Tanpa SKU' }),
  ];

  it('combines date, channel and product filters', () => {
    expect(applyFilters(mixed, { ...NO_FILTERS, from: '2026-10-05' })).toHaveLength(2);
    expect(applyFilters(mixed, { ...NO_FILTERS, channels: ['Shopee', 'Tokopedia'] })).toHaveLength(2);
    expect(applyFilters(mixed, { ...NO_FILTERS, product: 'B' }).map((r) => r.sku)).toEqual(['B']);
    expect(applyFilters(mixed, { ...NO_FILTERS, product: 'TANPA SKU: Tanpa SKU' })).toHaveLength(1);
    expect(applyFilters(mixed, { ...NO_FILTERS, from: '2026-10-05', channels: ['Shopee'] })).toHaveLength(0);
  });

  it('can ignore one filter so a panel keeps its context', () => {
    const filters = { ...NO_FILTERS, from: '2026-10-05', channels: ['Shopee' as const] };
    expect(applyFilters(mixed, filters, { channel: true })).toHaveLength(2);
    expect(applyFilters(mixed, filters, { date: true })).toHaveLength(1);
  });

  it('knows when a date range is invalid', () => {
    expect(isValidRange({ ...NO_FILTERS, from: '2026-10-20', to: '2026-10-10' })).toBe(false);
    expect(isValidRange({ ...NO_FILTERS, from: '2026-10-10', to: '2026-10-10' })).toBe(true);
  });
});

describe('summarize', () => {
  const rows = [
    line({ orderId: 'O1', sku: 'A', qty: 2, totalPrice: 200 }),
    line({ orderId: 'O1', sku: 'B', productName: 'Produk B', totalPrice: 50 }),
    line({ orderId: 'O2', channel: 'Tokopedia', sku: 'A', totalPrice: 100, statusRaw: 'Sedang Dikirim' }),
    line({ orderId: 'O3', sku: 'A', totalPrice: 999, statusRaw: 'Batal', status: 'cancelled' }),
    line({ orderId: 'O4', sku: 'B', totalPrice: 777, statusRaw: 'Refunded', status: 'returned' }),
  ];
  const summary = summarize(rows, { A: 'Produk A', B: 'Produk B' });

  it('counts only finished and in-delivery lines', () => {
    expect(summary.netRevenue).toBe(350);
    expect(summary.units).toBe(4);
    expect(summary.orders).toBe(2);
    expect(summary.excludedLines).toBe(2);
  });

  it('splits net revenue per channel and always lists all three channels', () => {
    expect(summary.byChannel.map((c) => [c.channel, c.netRevenue])).toEqual([
      ['Shopee', 250],
      ['TikTok Shop', 0],
      ['Tokopedia', 100],
    ]);
  });

  it('ranks products by net revenue with units sold', () => {
    expect(summary.byProduct.map((p) => [p.sku, p.netRevenue, p.units])).toEqual([
      ['A', 300, 3],
      ['B', 50, 1],
    ]);
  });

  it('splits each product by channel, adding up to its net revenue', () => {
    const productA = summary.byProduct.find((p) => p.sku === 'A')!;
    expect(productA.byChannel).toEqual({ Shopee: 200, 'TikTok Shop': 0, Tokopedia: 100 });
  });

  it('lists every raw status with its treatment', () => {
    expect(summary.statuses.map((s) => [s.statusRaw, s.category, s.lines])).toEqual([
      ['Selesai', 'counted', 2],
      ['Sedang Dikirim', 'counted', 1],
      ['Batal', 'cancelled', 1],
      ['Refunded', 'returned', 1],
    ]);
  });
});

describe('dailyRevenue', () => {
  it('lists every day, including days without sales, and counts only counted lines', () => {
    const rows = [
      line({ day: '2026-10-01', channel: 'Shopee', totalPrice: 100 }),
      line({ day: '2026-10-01', channel: 'Tokopedia', totalPrice: 50 }),
      line({ day: '2026-10-03', channel: 'Shopee', totalPrice: 70 }),
      line({ day: '2026-10-03', totalPrice: 999, status: 'cancelled' }),
      line({ day: '2026-11-01', totalPrice: 5 }),
    ];
    const days = dailyRevenue(rows, '2026-10-01', '2026-10-03');
    expect(days.map((d) => [d.day, d.total])).toEqual([
      ['2026-10-01', 150],
      ['2026-10-02', 0],
      ['2026-10-03', 70],
    ]);
    expect(days[0].byChannel).toEqual({ Shopee: 100, 'TikTok Shop': 0, Tokopedia: 50 });
  });

  it('computes a trailing moving average only once a full window exists', () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
    expect(movingAverage([7, 7], 7)).toEqual([null, null]);
  });

  it('walks across month ends', () => {
    expect(daysBetween('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });
});
