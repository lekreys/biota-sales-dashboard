import type { Channel, StatusCategory } from './types';

export interface ParsedMoney {
  value: number;
  format: string;
}

export interface ParsedDate {
  day: string;
  time: string | null;
  format: string;
}

export function parseMoney(input: string | undefined): ParsedMoney | null {
  if (input == null) return null;
  const text = input.trim();
  const prefix = /^rp/i.test(text) ? 'Rp ' : /^idr/i.test(text) ? 'IDR ' : '';
  const digits = text.replace(/^(rp|idr)\.?/i, '').replace(/\s+/g, '');

  if (/^\d+$/.test(digits)) return { value: Number(digits), format: `${prefix}1234567` };
  if (/^\d{1,3}(\.\d{3})+$/.test(digits)) {
    return { value: Number(digits.replace(/\./g, '')), format: `${prefix}1.234.567` };
  }
  if (/^\d{1,3}(,\d{3})+$/.test(digits)) {
    return { value: Number(digits.replace(/,/g, '')), format: `${prefix}1,234,567` };
  }
  if (/^\d+\.\d{1,2}$/.test(digits) && Number.isInteger(Number(digits))) {
    return { value: Number(digits), format: `${prefix}1234567.0` };
  }
  return null;
}

export function parseQty(input: string | undefined): number | null {
  const text = (input ?? '').trim();
  if (!/^\d+(\.0+)?$/.test(text)) return null;
  const qty = Number(text);
  return qty > 0 ? qty : null;
}

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  mei: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  agu: 8,
  agt: 8,
  sep: 9,
  oct: 10,
  okt: 10,
  nov: 11,
  dec: 12,
  des: 12,
};

const TIME = String.raw`(?:(?:\s+|T)(\d{1,2}):(\d{2})(?::(\d{2}))?)?`;

type DateParts = [year: number, month: number, day: number];

const monthNumber = (name: string) => MONTHS[name.slice(0, 3).toLowerCase()];

const DATE_PATTERNS: { regex: RegExp; format: string; parts: (m: RegExpMatchArray) => DateParts | null }[] = [
  {
    regex: new RegExp(String.raw`^(\d{4})-(\d{1,2})-(\d{1,2})${TIME}$`),
    format: 'YYYY-MM-DD',
    parts: (m) => [+m[1], +m[2], +m[3]],
  },
  {
    regex: new RegExp(String.raw`^(\d{1,2})/(\d{1,2})/(\d{4})${TIME}$`),
    format: 'DD/MM/YYYY',
    parts: (m) => [+m[3], +m[2], +m[1]],
  },
  {
    regex: new RegExp(String.raw`^([a-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})${TIME}$`, 'i'),
    format: 'Mon D, YYYY',
    parts: (m) => (monthNumber(m[1]) ? [+m[3], monthNumber(m[1]), +m[2]] : null),
  },
  {
    regex: new RegExp(String.raw`^(\d{1,2})\s+([a-z]{3,})\.?\s+(\d{4})${TIME}$`, 'i'),
    format: 'D Mon YYYY',
    parts: (m) => (monthNumber(m[2]) ? [+m[3], monthNumber(m[2]), +m[1]] : null),
  },
];

const pad = (n: number) => String(n).padStart(2, '0');

function toDate([year, month, day]: DateParts, hour: string | undefined, minute: string | undefined) {
  if (month < 1 || month > 12 || day < 1) return null;
  if (day > new Date(Date.UTC(year, month, 0)).getUTCDate()) return null;
  if (hour === undefined || minute === undefined) return { day: `${year}-${pad(month)}-${pad(day)}`, time: null };
  if (Number(hour) > 23 || Number(minute) > 59) return null;
  return { day: `${year}-${pad(month)}-${pad(day)}`, time: `${pad(Number(hour))}:${minute}` };
}

export function parseOrderDate(input: string | undefined): ParsedDate | null {
  const text = (input ?? '').trim();
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern.regex);
    if (!match) continue;
    const parts = pattern.parts(match);
    const date = parts && toDate(parts, match[4], match[5]);
    if (!date) return null;
    const timeFormat = match[4] ? (match[6] ? ' HH:mm:ss' : ' HH:mm') : '';
    return { ...date, format: pattern.format + timeFormat };
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

export function normalizeChannel(input: string | undefined): Channel | null {
  const key = (input ?? '').toLowerCase().replace(/[^a-z]/g, '');
  return CHANNEL_ALIASES[key] ?? null;
}

const STATUS_CATEGORIES: Record<string, StatusCategory> = {
  selesai: 'counted',
  'pesanan selesai': 'counted',
  completed: 'counted',
  dikirim: 'counted',
  'sedang dikirim': 'counted',
  'in transit': 'counted',
  batal: 'cancelled',
  dibatalkan: 'cancelled',
  cancelled: 'cancelled',
  'pengembalian dana': 'returned',
  refunded: 'returned',
  'dikomplain - retur': 'returned',
};

export function classifyStatus(input: string | undefined): StatusCategory {
  const key = (input ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  return STATUS_CATEGORIES[key] ?? 'unknown';
}
