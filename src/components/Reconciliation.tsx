import { formatNumber, formatRupiah } from '../lib/format';
import type { Summary } from '../lib/metrics';
import type { CleanResult, StatusCategory } from '../lib/types';

const CATEGORY_LABEL: Record<StatusCategory, string> = {
  counted: 'Dihitung',
  cancelled: 'Batal (tidak dihitung)',
  returned: 'Retur/refund (tidak dihitung)',
  unknown: 'Status tidak dikenal (tidak dihitung)',
};

export function Reconciliation({ cleaned, summary }: { cleaned: CleanResult; summary: Summary }) {
  const countedLines = summary.linesInRange - summary.excluded.cancelled.lines - summary.excluded.returned.lines - summary.excluded.unknown.lines;

  return (
    <section className="card">
      <h2>Dari file ke angka (rekonsiliasi)</h2>
      <p className="muted">Supaya angka di atas bisa dicek ulang: apa saja yang dibersihkan dan dikecualikan.</p>

      <div className="recon-grid">
        <div>
          <h3>Pembersihan (semua file)</h3>
          <dl className="facts">
            <dt>Baris dibaca dari file</dt>
            <dd>{formatNumber(cleaned.rowsRead)}</dd>
            <dt>Baris ditolak (tidak bisa dibaca)</dt>
            <dd className={cleaned.rejected.length ? 'warn' : ''}>{formatNumber(cleaned.rejected.length)}</dd>
            <dt>Baris duplikat dibuang</dt>
            <dd>{formatNumber(cleaned.duplicatesRemoved)}</dd>
            <dt>Baris bersih</dt>
            <dd className="strong">{formatNumber(cleaned.rows.length)}</dd>
            <dt>SKU kosong yang dipulihkan dari nama produk</dt>
            <dd>
              {formatNumber(cleaned.skuRecovered)} dari {formatNumber(cleaned.skuMissing)}
            </dd>
            {cleaned.priceMismatches > 0 && (
              <>
                <dt>Baris dengan qty × harga ≠ total (dipakai: total)</dt>
                <dd className="warn">{formatNumber(cleaned.priceMismatches)}</dd>
              </>
            )}
          </dl>
        </div>

        <div>
          <h3>Periode terpilih</h3>
          <dl className="facts">
            <dt>Baris dalam periode</dt>
            <dd>{formatNumber(summary.linesInRange)}</dd>
            <dt>Dihitung (selesai / dikirim)</dt>
            <dd className="strong">
              {formatNumber(countedLines)} · {formatRupiah(summary.netRevenue)}
            </dd>
            <dt>Batal</dt>
            <dd>
              {formatNumber(summary.excluded.cancelled.lines)} · {formatRupiah(summary.excluded.cancelled.value)}
            </dd>
            <dt>Retur / refund</dt>
            <dd>
              {formatNumber(summary.excluded.returned.lines)} · {formatRupiah(summary.excluded.returned.value)}
            </dd>
            {summary.excluded.unknown.lines > 0 && (
              <>
                <dt>Status tidak dikenal</dt>
                <dd className="warn">
                  {formatNumber(summary.excluded.unknown.lines)} · {formatRupiah(summary.excluded.unknown.value)}
                </dd>
              </>
            )}
          </dl>
        </div>
      </div>

      {summary.excluded.unknown.lines > 0 && (
        <p className="alert">
          Ada status yang belum dikenal aplikasi. Baris tersebut belum dihitung ke net revenue. Cek tabel status di bawah.
        </p>
      )}

      <details>
        <summary>Status dari marketplace dan cara menghitungnya</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status di file</th>
                <th>Perlakuan</th>
                <th className="num">Baris</th>
                <th className="num">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {summary.statuses.map((s) => (
                <tr key={s.statusRaw}>
                  <td>{s.statusRaw || '(kosong)'}</td>
                  <td className={s.category === 'unknown' ? 'warn' : s.category === 'counted' ? '' : 'muted'}>
                    {CATEGORY_LABEL[s.category]}
                  </td>
                  <td className="num">{formatNumber(s.lines)}</td>
                  <td className="num">{formatRupiah(s.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {cleaned.rejected.length > 0 && (
        <details open>
          <summary>Baris yang ditolak ({cleaned.rejected.length})</summary>
          <ul className="rejected">
            {cleaned.rejected.slice(0, 50).map((r) => (
              <li key={`${r.file}-${r.line}`}>
                {r.file} baris {r.line}: {r.reason}
              </li>
            ))}
            {cleaned.rejected.length > 50 && <li>…dan {cleaned.rejected.length - 50} baris lainnya</li>}
          </ul>
        </details>
      )}
    </section>
  );
}
