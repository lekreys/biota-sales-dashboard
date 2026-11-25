import { describe, expect, it } from 'vitest';
import { cleanRows } from './clean';
import type { RawRow } from './types';

function row(overrides: Partial<RawRow> = {}): RawRow {
  return {
    order_id: 'SHP1',
    order_date: '2026-10-01 10:00',
    channel: 'Shopee',
    sku: 'BIO-CAM-BF',
    product_name: 'BIOTA Smart Camera Battery Fixed',
    qty: '1',
    unit_price: 'Rp1.099.000',
    total_price: 'Rp1.099.000',
    status: 'Selesai',
    buyer_city: 'Bogor',
    ...overrides,
  };
}

describe('cleanRows', () => {
  it('removes exact duplicate lines, also across files', () => {
    const result = cleanRows([
      { name: 'a.csv', rows: [row(), row()] },
      { name: 'b.csv', rows: [row()] },
    ]);
    expect(result.rowsRead).toBe(3);
    expect(result.rows).toHaveLength(1);
    expect(result.duplicatesRemoved).toBe(2);
  });

  it('treats the same line written in different formats as a duplicate', () => {
    const result = cleanRows([
      { name: 'a.csv', rows: [row(), row({ channel: 'SHOPEE', total_price: 'Rp 1.099.000' })] },
    ]);
    expect(result.rows).toHaveLength(1);
  });

  it('keeps two different products in the same order', () => {
    const otherProduct = row({
      sku: 'BIO-SD-S64',
      product_name: 'MicroSD 64GB',
      unit_price: '119000',
      total_price: '119000',
    });
    const result = cleanRows([{ name: 'a.csv', rows: [row(), otherProduct] }]);
    expect(result.rows).toHaveLength(2);
    expect(result.duplicatesRemoved).toBe(0);
  });

  it('recovers an empty SKU from another row with the same channel and listing name', () => {
    const result = cleanRows([{ name: 'a.csv', rows: [row({ order_id: 'SHP2', sku: '' }), row()] }]);
    expect(result.skuMissing).toBe(1);
    expect(result.skuRecovered).toBe(1);
    expect(result.rows[0]).toMatchObject({ sku: 'BIO-CAM-BF', skuRecovered: true });
  });

  it('counts recovered SKUs on clean lines only, so duplicates are not counted twice', () => {
    const emptySku = row({ order_id: 'SHP2', sku: '' });
    const result = cleanRows([
      { name: 'a.csv', rows: [emptySku, row()] },
      { name: 'b.csv', rows: [emptySku, row()] },
    ]);
    expect(result.rows).toHaveLength(2);
    expect(result.skuMissing).toBe(1);
    expect(result.skuRecovered).toBe(1);
  });

  it('leaves the SKU empty when the listing name is never seen with a SKU', () => {
    const result = cleanRows([{ name: 'a.csv', rows: [row({ sku: '', product_name: 'Produk Baru' })] }]);
    expect(result.skuRecovered).toBe(0);
    expect(result.rows[0].sku).toBe('');
  });

  it('rejects unreadable rows with a reason instead of dropping them silently', () => {
    const result = cleanRows([
      {
        name: 'a.csv',
        rows: [row(), row({ order_date: 'kemarin' }), row({ channel: 'Lazada' }), row({ total_price: '' })],
      },
    ]);
    expect(result.rows).toHaveLength(1);
    expect(result.rejected.map((r) => r.line)).toEqual([3, 4, 5]);
    expect(result.rejected[0].reason).toContain('tanggal');
    expect(result.rejected[1].reason).toContain('channel');
    expect(result.rejected[2].reason).toContain('total_price');
  });

  it('keeps rows with an unknown status but marks them as unknown', () => {
    const result = cleanRows([{ name: 'a.csv', rows: [row({ status: 'Menunggu Pembayaran' })] }]);
    expect(result.rows[0].status).toBe('unknown');
  });

  it('uses the shortest listing name as the product name', () => {
    const tokopedia = row({ order_id: 'TKP1', channel: 'Tokopedia', product_name: 'Kamera BF BIOTA' });
    const result = cleanRows([{ name: 'a.csv', rows: [row(), tokopedia] }]);
    expect(result.productNames['BIO-CAM-BF']).toBe('Kamera BF BIOTA');
  });

  it('reports the formats and channel spellings it found, and the value of removed duplicates', () => {
    const tiktok = row({
      order_id: 'TTS1',
      channel: 'TIKTOK SHOP',
      order_date: '21/10/2026 08:24:00',
      unit_price: '1,099,000',
      total_price: 'IDR 1,099,000',
    });
    const result = cleanRows([{ name: 'a.csv', rows: [row(), row(), tiktok] }]);
    expect(result.duplicateValue).toBe(1099000);
    expect(result.formats).toEqual([
      { field: 'date', format: 'YYYY-MM-DD HH:mm', example: '2026-10-01 10:00' },
      { field: 'money', format: 'Rp 1.234.567', example: 'Rp1.099.000' },
      { field: 'date', format: 'DD/MM/YYYY HH:mm:ss', example: '21/10/2026 08:24:00' },
      { field: 'money', format: '1,234,567', example: '1,099,000' },
      { field: 'money', format: 'IDR 1,234,567', example: 'IDR 1,099,000' },
    ]);
    expect(result.channelSpellings).toEqual(['Shopee', 'TIKTOK SHOP']);
  });

  it('counts lines where qty x unit_price does not match total_price', () => {
    const result = cleanRows([{ name: 'a.csv', rows: [row({ qty: '2' })] }]);
    expect(result.priceMismatches).toBe(1);
  });
});
