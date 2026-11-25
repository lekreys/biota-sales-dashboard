export type Channel = 'Shopee' | 'TikTok Shop' | 'Tokopedia';

export const CHANNELS: Channel[] = ['Shopee', 'TikTok Shop', 'Tokopedia'];

export type StatusCategory = 'counted' | 'cancelled' | 'returned' | 'unknown';

export type RawRow = Record<string, string>;

export interface SourceFile {
  name: string;
  rows: RawRow[];
}

export interface CleanRow {
  orderId: string;
  day: string;
  time: string | null;
  channel: Channel;
  sku: string;
  skuRecovered: boolean;
  productName: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  statusRaw: string;
  status: StatusCategory;
  buyerCity: string;
}

export interface RejectedRow {
  file: string;
  line: number;
  reason: string;
}

export interface FormatExample {
  field: 'date' | 'money';
  format: string;
  example: string;
}

export interface CleanResult {
  rows: CleanRow[];
  rowsRead: number;
  rejected: RejectedRow[];
  duplicatesRemoved: number;
  duplicateValue: number;
  skuMissing: number;
  skuRecovered: number;
  priceMismatches: number;
  productNames: Record<string, string>;
  formats: FormatExample[];
  channelSpellings: string[];
}
