import { useState } from 'react';
import { formatDay, formatNumber, formatRupiah } from '../lib/format';
import type { CleanRow, StatusCategory } from '../lib/types';
import { Swatch } from './channelColor';
import { DownloadIcon } from './Icons';

const PAGE_SIZE = 25;

const STATUS_BADGE: Record<StatusCategory, string> = {
  counted: 'Dihitung',
  cancelled: 'Batal',
  returned: 'Retur',
  unknown: 'Tidak dikenal',
};

type StatusFilter = 'all' | StatusCategory;

interface Props {
  rows: CleanRow[]; // already filtered by the dashboard filters
  onDownload: () => void;
}

export function CleanDataTable({ rows, onDownload }: Props) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [newestFirst, setNewestFirst] = useState(false);
  const [page, setPage] = useState(0);

  const q = query.trim().toLowerCase();
  const searched = rows.filter(
    (r) =>
      !q ||
      r.orderId.toLowerCase().includes(q) ||
      r.productName.toLowerCase().includes(q) ||
      r.sku.toLowerCase().includes(q) ||
      r.buyerCity.toLowerCase().includes(q),
  );
  const counts = {
    all: searched.length,
    counted: searched.filter((r) => r.status === 'counted').length,
    cancelled: searched.filter((r) => r.status === 'cancelled').length,
    returned: searched.filter((r) => r.status === 'returned').length,
    unknown: searched.filter((r) => r.status === 'unknown').length,
  };
  const shown = searched
    .filter((r) => status === 'all' || r.status === status)
    .sort((a, b) => {
      const d = `${a.day} ${a.time ?? ''}`.localeCompare(`${b.day} ${b.time ?? ''}`) || a.orderId.localeCompare(b.orderId);
      return newestFirst ? -d : d;
    });
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const pageRows = shown.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const pageTotal = pageRows.filter((r) => r.status === 'counted').reduce((a, r) => a + r.totalPrice, 0);

  const statusOptions: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'Semua' },
    { id: 'counted', label: 'Dihitung' },
    { id: 'cancelled', label: 'Batal' },
    { id: 'returned', label: 'Retur' },
    ...(counts.unknown ? [{ id: 'unknown' as const, label: 'Tidak dikenal' }] : []),
  ];

  return (
    <section className="card fill-card">
      <div className="card-head">
        <div>
          <h2>Data bersih</h2>
          <p className="secondary small">
            {formatNumber(rows.length)} baris sesuai filter, setelah format disatukan, SKU dipulihkan dan duplikat dibuang.
          </p>
        </div>
        <button className="button" onClick={onDownload} disabled={rows.length === 0}>
          <DownloadIcon /> Unduh CSV
        </button>
      </div>

      <div className="table-tools">
        <input
          className="search"
          type="search"
          placeholder="Cari order, produk, SKU atau kota…"
          aria-label="Cari baris"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />
        <div className="segmented" role="group" aria-label="Filter status">
          {statusOptions.map((o) => (
            <button
              key={o.id}
              className={status === o.id ? 'active' : ''}
              aria-pressed={status === o.id}
              onClick={() => {
                setStatus(o.id);
                setPage(0);
              }}
            >
              {o.label} <span className="count">{formatNumber(counts[o.id])}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-area">
        <table className="data-table">
          <thead>
            <tr>
              <th aria-sort={newestFirst ? 'descending' : 'ascending'}>
                <button className="sort active" onClick={() => setNewestFirst(!newestFirst)}>
                  Tanggal {newestFirst ? '↓' : '↑'}
                </button>
              </th>
              <th>Order</th>
              <th>Produk</th>
              <th className="num">Qty</th>
              <th className="num">Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={`${r.channel}|${r.orderId}|${r.sku}|${r.productName}|${i}`} className={r.status === 'counted' ? '' : 'excluded'}>
                <td className="nowrap">
                  {formatDay(r.day)}
                  <div className="secondary small">{r.time ?? 'tanpa jam'}</div>
                </td>
                <td className="nowrap">
                  <span className="inline-channel">
                    <Swatch channel={r.channel} />
                    {r.channel}
                  </span>
                  <div className="secondary small mono">{r.orderId}</div>
                </td>
                <td>
                  <div className="cell-product">{r.productName}</div>
                  <div className="secondary small">
                    <span className="mono">{r.sku || 'SKU tidak diketahui'}</span>
                    {r.skuRecovered && <span className="pill-mini">dipulihkan</span>}
                    {r.buyerCity && ` · ${r.buyerCity}`}
                  </div>
                </td>
                <td className="num">{r.qty}</td>
                <td className="num strong">{formatRupiah(r.totalPrice)}</td>
                <td className="nowrap">
                  <span className={`badge b-${r.status}`}>{STATUS_BADGE[r.status]}</span>
                  <div className="secondary small">{r.statusRaw}</div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="secondary">
                  Tidak ada baris yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span className="secondary small">
          {shown.length ? `${current * PAGE_SIZE + 1}–${current * PAGE_SIZE + pageRows.length}` : 0} dari{' '}
          {formatNumber(shown.length)} baris · dihitung di halaman ini {formatRupiah(pageTotal)}
        </span>
        <span className="pager-buttons">
          <button className="button secondary small-button" onClick={() => setPage(current - 1)} disabled={current === 0}>
            ← Sebelumnya
          </button>
          <span className="secondary small">
            {current + 1}/{pages}
          </span>
          <button className="button secondary small-button" onClick={() => setPage(current + 1)} disabled={current >= pages - 1}>
            Berikutnya →
          </button>
        </span>
      </div>
    </section>
  );
}
