import { describe, expect, it } from 'vitest';
import { classifyStatus, normalizeChannel, parseMoney, parseOrderDate, parseQty, readMoney, readOrderDate } from './parse';

describe('parseMoney', () => {
  it.each([
    ['Rp1.099.000', 1099000], // Shopee, dot = thousands
    ['Rp 699.000', 699000],
    ['Rp 2.198.000', 2198000],
    ['349,000', 349000], // TikTok, comma = thousands
    ['IDR 1,099,000', 1099000],
    ['119000', 119000], // Tokopedia
    ['349000.0', 349000],
    ['  Rp159.000 ', 159000],
  ])('%s -> %d', (input, expected) => {
    expect(parseMoney(input)).toBe(expected);
  });

  it.each(['', 'abc', 'Rp', '1.099,50', '12.5', '1,09,000'])('rejects %j', (input) => {
    expect(parseMoney(input)).toBeNull();
  });
});

describe('parseOrderDate', () => {
  it('reads Shopee ISO dates', () => {
    expect(parseOrderDate('2026-10-21 08:24')).toEqual({ day: '2026-10-21', time: '08:24' });
  });

  it('reads TikTok dates day-first, also when the day is 12 or less', () => {
    expect(parseOrderDate('21/10/2026 08:24:00')).toEqual({ day: '2026-10-21', time: '08:24' });
    // new Date('03/10/2026') would give March 10 - this must be 3 October.
    expect(parseOrderDate('03/10/2026 11:12:00')).toEqual({ day: '2026-10-03', time: '11:12' });
    expect(parseOrderDate('3/10/2026 23:59:00')).toEqual({ day: '2026-10-03', time: '23:59' });
  });

  it('accepts more than one space between date and time', () => {
    expect(parseOrderDate('21/10/2026  08:24:00')).toEqual({ day: '2026-10-21', time: '08:24' });
  });

  it('reads Tokopedia dates without time', () => {
    expect(parseOrderDate('Oct 1, 2026')).toEqual({ day: '2026-10-01', time: null });
    expect(parseOrderDate('Oct 01, 2026')).toEqual({ day: '2026-10-01', time: null });
    expect(parseOrderDate('1 Okt 2026')).toEqual({ day: '2026-10-01', time: null });
  });

  it('keeps late-evening times on the same day (no time-zone shift)', () => {
    expect(parseOrderDate('2026-10-31 23:43')?.day).toBe('2026-10-31');
    expect(parseOrderDate('15/10/2026 22:36:00')?.day).toBe('2026-10-15');
  });

  it.each(['', '10/21/2026 08:24:00', '31/09/2026', '2026-13-01', 'Foo 1, 2026', '2026-10-01 25:00'])(
    'rejects %j',
    (input) => {
      expect(parseOrderDate(input)).toBeNull();
    },
  );
});

describe('format names for the data-quality report', () => {
  it.each([
    ['Rp1.099.000', 'Rp 1.234.567'],
    ['Rp 699.000', 'Rp 1.234.567'],
    ['IDR 1,099,000', 'IDR 1,234,567'],
    ['349,000', '1,234,567'],
    ['119000', '1234567'],
    ['349000.0', '1234567.0'],
  ])('money %s is %s', (input, format) => {
    expect(readMoney(input)?.format).toBe(format);
  });

  it.each([
    ['2026-10-21 08:24', 'YYYY-MM-DD HH:mm'],
    ['21/10/2026 08:24:00', 'DD/MM/YYYY HH:mm:ss'],
    ['3/10/2026 08:24:00', 'DD/MM/YYYY HH:mm:ss'],
    ['Oct 1, 2026', 'Mon D, YYYY'],
    ['Oct 01, 2026', 'Mon D, YYYY'],
    ['1 Okt 2026', 'D Mon YYYY'],
  ])('date %s is %s', (input, format) => {
    expect(readOrderDate(input)?.format).toBe(format);
  });
});

describe('normalizeChannel', () => {
  it.each([
    ['Shopee', 'Shopee'], ['shopee', 'Shopee'], ['SHOPEE', 'Shopee'],
    ['TikTok Shop', 'TikTok Shop'], ['TIKTOK SHOP', 'TikTok Shop'], ['Tiktok', 'TikTok Shop'],
    ['Tokopedia', 'Tokopedia'], ['TOKOPEDIA', 'Tokopedia'], ['Tokped', 'Tokopedia'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeChannel(input)).toBe(expected);
  });

  it('returns null for unknown channels', () => {
    expect(normalizeChannel('Lazada')).toBeNull();
  });
});

describe('classifyStatus', () => {
  it.each(['Selesai', 'Pesanan Selesai', 'Completed', 'Dikirim', 'Sedang Dikirim', 'In transit'])(
    '%s is counted',
    (s) => expect(classifyStatus(s)).toBe('counted'),
  );
  it.each(['Batal', 'Dibatalkan', 'Cancelled'])('%s is cancelled', (s) => expect(classifyStatus(s)).toBe('cancelled'));
  it.each(['Pengembalian Dana', 'Refunded', 'Dikomplain - Retur'])('%s is returned', (s) =>
    expect(classifyStatus(s)).toBe('returned'),
  );
  it('ignores case and extra spaces', () => expect(classifyStatus('  in   TRANSIT ')).toBe('counted'));
  it('flags anything else as unknown', () => expect(classifyStatus('Menunggu Pembayaran')).toBe('unknown'));
});

describe('parseQty', () => {
  it('accepts whole numbers', () => {
    expect(parseQty('3')).toBe(3);
    expect(parseQty('2.0')).toBe(2);
  });
  it('rejects zero, negatives and fractions', () => {
    expect(parseQty('0')).toBeNull();
    expect(parseQty('-1')).toBeNull();
    expect(parseQty('1.5')).toBeNull();
  });
});
