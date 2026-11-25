export type Channel = 'Shopee' | 'TikTok Shop' | 'Tokopedia';
export const CHANNELS: Channel[] = ['Shopee', 'TikTok Shop', 'Tokopedia'];

/** counted = selesai / sedang dikirim; the rest are excluded from net revenue. */
export type StatusCategory = 'counted' | 'cancelled' | 'returned' | 'unknown';

/** One CSV row as read from the file, keyed by lower-cased column name. */
export type RawRow = Record<string, string>;

export interface SourceFile {
  name: string;
  rows: RawRow[];
}

export interface CleanRow {
  orderId: string;
  day: string; // YYYY-MM-DD (Jakarta local time, as exported)
  time: string | null; // HH:mm, null when the export has no time (Tokopedia)
  channel: Channel;
  sku: string; // '' when it could not be recovered
  skuRecovered: boolean;
  productName: string;
  qty: number;
  unitPrice: number; // whole rupiah
  totalPrice: number; // whole rupiah
  statusRaw: string;
  status: StatusCategory;
  buyerCity: string;
}

export interface RejectedRow {
  file: string;
  line: number; // line number in the file, header = line 1
  reason: string;
}

export interface CleanResult {
  rows: CleanRow[];
  rowsRead: number;
  rejected: RejectedRow[];
  duplicatesRemoved: number;
  skuMissing: number;
  skuRecovered: number;
  priceMismatches: number; // qty x unit_price != total_price (total_price is used)
  productNames: Record<string, string>; // product key -> display name
}
