import { describe, expect, it } from 'vitest';
import { filterByDate, summarize } from './metrics';
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

describe('filterByDate', () => {
  const rows = [
    line({ day: '2026-10-01', time: null }),
    line({ day: '2026-10-15', time: '22:36' }),
    line({ day: '2026-10-16', time: '00:00' }),
  ];

  it('includes both ends of the range, including late on the last day', () => {
    expect(filterByDate(rows, '2026-10-01', '2026-10-15').map((r) => r.day)).toEqual(['2026-10-01', '2026-10-15']);
  });

  it('treats an empty bound as no limit', () => {
    expect(filterByDate(rows, '', '')).toHaveLength(3);
    expect(filterByDate(rows, '2026-10-16', '')).toHaveLength(1);
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

  it('reports what was excluded and why', () => {
    expect(summary.excluded.cancelled).toEqual({ lines: 1, value: 999 });
    expect(summary.excluded.returned).toEqual({ lines: 1, value: 777 });
    expect(summary.excluded.unknown).toEqual({ lines: 0, value: 0 });
  });
});
