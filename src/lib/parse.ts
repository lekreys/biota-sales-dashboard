import type { Channel, StatusCategory } from './types';

/**
 * Rupiah text -> whole rupiah.
 * Handles every format seen in the exports:
 *   Shopee     "Rp1.099.000", "Rp 699.000"   (dot = thousands)
 *   TikTok     "349,000", "IDR 1,099,000"    (comma = thousands)
 *   Tokopedia  "119000"
 */
export function parseMoney(input: string | undefined): number | null {
  return readMoney(input)?.value ?? null;
}

/**
 * Same as parseMoney, and also names the format that was recognised
 * (e.g. "Rp 1.234.567", "IDR 1,234,567", "1234567") for the data-quality report.
 */
export function readMoney(input: string | undefined): { value: number; format: string } | null {
  if (input == null) return null;
  const t = input.trim();
  const prefix = /^rp/i.test(t) ? 'Rp ' : /^idr/i.test(t) ? 'IDR ' : '';
  const s = t.replace(/^(rp|idr)\.?/i, '').replace(/\s+/g, '');
  if (s === '') return null;
  if (/^\d+$/.test(s)) return { value: Number(s), format: `${prefix}1234567` };
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return { value: Number(s.replace(/\./g, '')), format: `${prefix}1.234.567` };
  if (/^\d{1,3}(,\d{3})+$/.test(s)) return { value: Number(s.replace(/,/g, '')), format: `${prefix}1,234,567` };
  // Plain decimal such as "349000.0" (rupiah has no cents, so it must be a whole number).
  if (/^\d+\.\d{1,2}$/.test(s)) {
    const n = Number(s);
    return Number.isInteger(n) ? { value: n, format: `${prefix}1234567.0` } : null;
  }
  return null;
}

/** Quantity must be a positive whole number ("1" or "1.0"). */
export function parseQty(input: string | undefined): number | null {
  const s = (input ?? '').trim();
  if (!/^\d+(\.0+)?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 ? n : null;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, mei: 5, jun: 6, jul: 7,
  aug: 8, agu: 8, agt: 8, sep: 9, oct: 10, okt: 10, nov: 11, dec: 12, des: 12,
};

export interface ParsedDate {
  day: string; // YYYY-MM-DD
  time: string | null; // HH:mm
}

const pad = (n: number) => String(n).padStart(2, '0');

function build(y: number, m: number, d: number, hh?: string, mm?: string): ParsedDate | null {
  if (m < 1 || m > 12 || d < 1) return null;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d > daysInMonth) return null;
  let time: string | null = null;
  if (hh !== undefined && mm !== undefined) {
    const h = Number(hh);
    const min = Number(mm);
    if (h > 23 || min > 59) return null;
    time = `${pad(h)}:${pad(min)}`;
  }
  return { day: `${y}-${pad(m)}-${pad(d)}`, time };
}

const TIME = String.raw`(?:(?:\s+|T)(\d{1,2}):(\d{2})(?::(\d{2}))?)?`;
const ISO = new RegExp(String.raw`^(\d{4})-(\d{1,2})-(\d{1,2})${TIME}$`);
const SLASH_DMY = new RegExp(String.raw`^(\d{1,2})/(\d{1,2})/(\d{4})${TIME}$`);
const MON_D_Y = new RegExp(String.raw`^([a-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})${TIME}$`, 'i');
const D_MON_Y = new RegExp(String.raw`^(\d{1,2})\s+([a-z]{3,})\.?\s+(\d{4})${TIME}$`, 'i');

/**
 * Order date text -> calendar day + time, exactly as written (no time-zone conversion).
 * We never use `new Date(text)`: it reads "03/10/2026" as March 10 and shifts dates across time zones.
 *   Shopee     "2026-10-21 08:24"
 *   TikTok     "21/10/2026 08:24:00"  (day first, Indonesian convention)
 *   Tokopedia  "Oct 1, 2026"          (no time)
 */
export function parseOrderDate(input: string | undefined): ParsedDate | null {
  const result = readOrderDate(input);
  return result && { day: result.day, time: result.time };
}

/**
 * Same as parseOrderDate, and also names the format that was recognised
 * (e.g. "DD/MM/YYYY HH:mm:ss") for the data-quality report.
 */
export function readOrderDate(input: string | undefined): (ParsedDate & { format: string }) | null {
  const s = (input ?? '').trim();
  const withFormat = (date: ParsedDate | null, pattern: string, m: RegExpMatchArray) =>
    date && { ...date, format: pattern + (m[4] ? (m[6] ? ' HH:mm:ss' : ' HH:mm') : '') };
  let m: RegExpMatchArray | null;
  if ((m = s.match(ISO))) return withFormat(build(+m[1], +m[2], +m[3], m[4], m[5]), 'YYYY-MM-DD', m);
  if ((m = s.match(SLASH_DMY))) return withFormat(build(+m[3], +m[2], +m[1], m[4], m[5]), 'DD/MM/YYYY', m);
  if ((m = s.match(MON_D_Y))) {
    const month = MONTHS[m[1].slice(0, 3).toLowerCase()];
    return month ? withFormat(build(+m[3], month, +m[2], m[4], m[5]), 'Mon D, YYYY', m) : null;
  }
  if ((m = s.match(D_MON_Y))) {
    const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
    return month ? withFormat(build(+m[3], month, +m[1], m[4], m[5]), 'D Mon YYYY', m) : null;
  }
  return null;
}

const CHANNEL_ALIASES: Record<string, Channel> = {
  shopee: 'Shopee',
  tiktokshop: 'TikTok Shop',
  tiktok: 'TikTok Shop',
  tokopedia: 'Tokopedia',
  tokped: 'Tokopedia',
};

/** "SHOPEE", "Tiktok", "Tokped", ... -> one of the three channel names. */
export function normalizeChannel(input: string | undefined): Channel | null {
  const key = (input ?? '').toLowerCase().replace(/[^a-z]/g, '');
  return CHANNEL_ALIASES[key] ?? null;
}

/**
 * Every status that appears in the exports. Anything else is "unknown":
 * it is NOT counted in net revenue and is shown as a warning, so a new status
 * never slips into the numbers silently.
 */
export const STATUS_MAP: Record<string, StatusCategory> = {
  // Finished or still being delivered -> counted
  'selesai': 'counted',
  'pesanan selesai': 'counted',
  'completed': 'counted',
  'dikirim': 'counted',
  'sedang dikirim': 'counted',
  'in transit': 'counted',
  // Cancelled -> not counted
  'batal': 'cancelled',
  'dibatalkan': 'cancelled',
  'cancelled': 'cancelled',
  // Returned / refunded -> not counted. "Dikomplain - Retur" = return in progress, treated as returned.
  'pengembalian dana': 'returned',
  'refunded': 'returned',
  'dikomplain - retur': 'returned',
};

export function classifyStatus(input: string | undefined): StatusCategory {
  const key = (input ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  return STATUS_MAP[key] ?? 'unknown';
}
