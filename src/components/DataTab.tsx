import { formatNumber, formatRupiah } from '../lib/format';
import type { Summary } from '../lib/metrics';
import type { CleanResult } from '../lib/types';
import { DownloadIcon } from './Icons';

interface Props {
  cleaned: CleanResult;
  file: Summary; // the whole file, no filters
  onDownload: () => void;
}

/** How the file became the numbers, in plain words. */
export function DataTab({ cleaned, file, onDownload }: Props) {
  const counted = cleaned.rows.length - file.excludedLines;
  const dateExamples = cleaned.formats.filter((f) => f.field === 'date').map((f) => f.example);
  const moneyExamples = cleaned.formats.filter((f) => f.field === 'money').map((f) => f.example);
  const statuses = (category: string) =>
    file.statuses.filter((s) => s.category === category).map((s) => s.statusRaw).join(', ');
  const excludedStatuses = file.statuses.filter((s) => s.category === 'cancelled' || s.category === 'returned');
  const unknown = file.statuses.filter((s) => s.category === 'unknown');

  return (
    <div className="data-tab">
      <section className="card">
        <h2>Dari file ke angka</h2>
        <p className="secondary small">Seluruh file yang diupload, tanpa filter.</p>

        <dl className="ledger">
          <div>
            <dt>Baris di file</dt>
            <dd>{formatNumber(cleaned.rowsRead)}</dd>
          </div>
          <div className="minus">
            <dt>Duplikat dibuang</dt>
            <dd>−{formatNumber(cleaned.duplicatesRemoved)}</dd>
          </div>
          {cleaned.rejected.length > 0 && (
            <div className="minus warn">
              <dt>Tidak bisa dibaca</dt>
              <dd>−{formatNumber(cleaned.rejected.length)}</dd>
            </div>
          )}
          <div className="subtotal">
            <dt>Baris bersih</dt>
            <dd>{formatNumber(cleaned.rows.length)}</dd>
          </div>
          <div className="minus">
            <dt>Batal / retur, tidak dihitung</dt>
            <dd>−{formatNumber(file.excludedLines)}</dd>
          </div>
          <div className="subtotal">
            <dt>Baris dihitung</dt>
            <dd>{formatNumber(counted)}</dd>
          </div>
        </dl>

        <div className="ledger-total">
          <span>Net revenue</span>
          <strong>{formatRupiah(file.netRevenue)}</strong>
        </div>

        <button className="button" onClick={onDownload}>
          <DownloadIcon /> Unduh data bersih (CSV)
        </button>
      </section>

      <section className="card">
        <h2>Yang dibersihkan otomatis</h2>
        <ul className="cleaned">
          <li>
            <strong>Nama channel.</strong> {cleaned.channelSpellings.length} cara penulisan (misalnya <code>SHOPEE</code>,{' '}
            <code>Tiktok</code>, <code>Tokped</code>) disatukan jadi 3 channel.
          </li>
          <li>
            <strong>Tanggal.</strong> Tiap marketplace beda format:{' '}
            {dateExamples.map((e) => (
              <span key={e}>
                <code>{e}</code>{' '}
              </span>
            ))}
            Tanggal TikTok dibaca tanggal dulu baru bulan.
          </li>
          <li>
            <strong>Harga.</strong>{' '}
            {moneyExamples.map((e) => (
              <span key={e}>
                <code>{e}</code>{' '}
              </span>
            ))}
            semua dibaca sebagai rupiah biasa.
          </li>
          <li>
            <strong>SKU kosong.</strong> {formatNumber(cleaned.skuRecovered)} dari {formatNumber(cleaned.skuMissing)} baris
            dipulihkan dari nama produknya.
          </li>
          <li>
            <strong>Duplikat.</strong> {formatNumber(cleaned.duplicatesRemoved)} baris yang sama persis dibuang. Kalau tidak,
            net revenue jadi lebih besar {formatRupiah(cleaned.duplicateValue)}.
          </li>
          <li>
            <strong>Status.</strong> Dihitung: {statuses('counted')}. Tidak dihitung:{' '}
            {excludedStatuses.map((s) => s.statusRaw).join(', ')}.
          </li>
        </ul>

        {(cleaned.rejected.length > 0 || unknown.length > 0) && (
          <div className="alert">
            {cleaned.rejected.slice(0, 5).map((r) => (
              <p key={`${r.file}-${r.line}`}>
                {r.file} baris {r.line}: {r.reason}
              </p>
            ))}
            {unknown.length > 0 && (
              <p>Status belum dikenal, belum dihitung: {unknown.map((s) => s.statusRaw).join(', ')}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
