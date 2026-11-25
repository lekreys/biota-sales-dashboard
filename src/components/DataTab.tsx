import { formatNumber, formatRupiah } from '../lib/format';
import type { Summary } from '../lib/metrics';
import { CHANNELS } from '../lib/types';
import type { CleanResult, StatusCategory } from '../lib/types';
import { DownloadIcon } from './Icons';

interface Props {
  cleaned: CleanResult;
  file: Summary;
  onDownload: () => void;
}

function Examples({ values }: { values: string[] }) {
  return (
    <>
      {values.map((value) => (
        <span key={value}>
          <code>{value}</code>{' '}
        </span>
      ))}
    </>
  );
}

export function DataTab({ cleaned, file, onDownload }: Props) {
  const countedLines = cleaned.rows.length - file.excludedLines;
  const examplesOf = (field: 'date' | 'money') =>
    cleaned.formats.filter((format) => format.field === field).map((format) => format.example);
  const statusesIn = (...categories: StatusCategory[]) =>
    file.statuses
      .filter((status) => categories.includes(status.category))
      .map((status) => status.statusRaw)
      .join(', ');
  const otherSpellings = cleaned.channelSpellings.filter((spelling) => !(CHANNELS as string[]).includes(spelling));
  const unknownStatuses = statusesIn('unknown');
  const hasWarnings = cleaned.rejected.length > 0 || cleaned.priceMismatches > 0 || unknownStatuses !== '';

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
            <dd>{formatNumber(countedLines)}</dd>
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
            <strong>Nama channel.</strong> {cleaned.channelSpellings.length} cara penulisan
            {otherSpellings.length > 0 && (
              <>
                {' '}
                (misalnya <Examples values={otherSpellings.slice(0, 3)} />)
              </>
            )}{' '}
            disatukan jadi {CHANNELS.length} channel.
          </li>
          <li>
            <strong>Tanggal.</strong> <Examples values={examplesOf('date')} />
            Tanggal dengan garis miring dibaca tanggal dulu baru bulan.
          </li>
          <li>
            <strong>Harga.</strong> <Examples values={examplesOf('money')} />
            semua dibaca sebagai rupiah biasa.
          </li>
          <li>
            <strong>SKU kosong.</strong> {formatNumber(cleaned.skuRecovered)} dari {formatNumber(cleaned.skuMissing)}{' '}
            baris dipulihkan dari nama produknya.
          </li>
          <li>
            <strong>Duplikat.</strong> {formatNumber(cleaned.duplicatesRemoved)} baris yang sama persis dibuang. Kalau
            tidak, net revenue jadi lebih besar {formatRupiah(cleaned.duplicateValue)}.
          </li>
          <li>
            <strong>Status.</strong> Dihitung: {statusesIn('counted')}. Tidak dihitung:{' '}
            {statusesIn('cancelled', 'returned')}.
          </li>
        </ul>

        {hasWarnings && (
          <div className="alert">
            {cleaned.rejected.slice(0, 5).map((row) => (
              <p key={`${row.file}-${row.line}`}>
                {row.file} baris {row.line}: {row.reason}
              </p>
            ))}
            {cleaned.priceMismatches > 0 && (
              <p>{cleaned.priceMismatches} baris dengan qty × harga ≠ total. Yang dipakai adalah total.</p>
            )}
            {unknownStatuses && <p>Status belum dikenal, belum dihitung: {unknownStatuses}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
