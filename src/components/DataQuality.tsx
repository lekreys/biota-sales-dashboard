import { formatDay, formatNumber, formatRupiah } from '../lib/format';
import type { Summary } from '../lib/metrics';
import { parseMoney, parseOrderDate } from '../lib/parse';
import { CHANNELS } from '../lib/types';
import type { CleanResult, FormatStat, StatusCategory } from '../lib/types';
import { Swatch } from './channelColor';
import { AlertIcon, CheckIcon } from './Icons';

const CATEGORY_LABEL: Record<StatusCategory, string> = {
  counted: 'Dihitung',
  cancelled: 'Batal',
  returned: 'Retur / refund',
  unknown: 'Tidak dikenal',
};

function readAs(f: FormatStat): string {
  if (f.field === 'money') return formatRupiah(parseMoney(f.example) ?? 0);
  const d = parseOrderDate(f.example);
  return d ? `${formatDay(d.day)}${d.time ? `, ${d.time}` : ' (tanpa jam)'}` : '-';
}

function FormatRows({ formats }: { formats: FormatStat[] }) {
  return (
    <>
      {formats.map((f) => (
        <tr key={f.format}>
          <td>
            <code>{f.example}</code>
            <div className="muted small">{f.format}</div>
          </td>
          <td>
            <div className="strong">{readAs(f)}</div>
            <div className="small">
              {f.channels.map((c) => (
                <span key={c} className="inline-channel">
                  <Swatch channel={c} />
                  {c}
                </span>
              ))}
            </div>
          </td>
          <td className="num secondary">{formatNumber(f.count)}</td>
        </tr>
      ))}
    </>
  );
}

interface Props {
  cleaned: CleanResult;
  file: Summary; // the whole file, no filters
}

export function DataQuality({ cleaned, file }: Props) {
  const counted = cleaned.rows.filter((r) => r.status === 'counted').length;
  const { cancelled, returned, unknown } = file.excluded;
  const parts = [
    { label: 'Dihitung', value: counted, tone: 'p-counted' },
    { label: 'Batal', value: cancelled.lines, tone: 'p-cancel' },
    { label: 'Retur / refund', value: returned.lines, tone: 'p-return' },
    { label: 'Status tidak dikenal', value: unknown.lines, tone: 'p-unknown' },
    { label: 'Duplikat', value: cleaned.duplicatesRemoved, tone: 'p-dup' },
    { label: 'Ditolak', value: cleaned.rejected.length, tone: 'p-rejected' },
  ];
  const recoveredExamples = [
    ...new Map(cleaned.rows.filter((r) => r.skuRecovered).map((r) => [`${r.channel}|${r.productName}`, r])).values(),
  ].slice(0, 3);

  const checks = [
    { ok: cleaned.rejected.length === 0, text: `Semua ${formatNumber(cleaned.rowsRead)} baris terbaca`, bad: `${cleaned.rejected.length} baris tidak bisa dibaca` },
    { ok: unknown.lines === 0, text: 'Semua status dikenali', bad: `${unknown.lines} baris status tidak dikenal` },
    { ok: cleaned.skuRecovered === cleaned.skuMissing, text: 'Semua SKU kosong dipulihkan', bad: `${cleaned.skuMissing - cleaned.skuRecovered} baris tanpa SKU` },
    { ok: cleaned.priceMismatches === 0, text: 'qty × harga = total di semua baris', bad: `${cleaned.priceMismatches} baris qty × harga ≠ total` },
  ];

  return (
    <div className="quality">
      <section className="card flow-card">
        <div className="card-head">
          <div>
            <h2>Dari file ke angka</h2>
            <p className="secondary small">Seluruh file yang diupload (tidak terpengaruh filter). Setiap baris berakhir di salah satu kotak.</p>
          </div>
          <ul className="checks">
            {checks.map((c) => (
              <li key={c.text} className={c.ok ? 'ok' : 'bad'}>
                <span className="check-icon">{c.ok ? <CheckIcon /> : <AlertIcon />}</span>
                {c.ok ? c.text : c.bad}
              </li>
            ))}
          </ul>
        </div>

        <ol className="flow">
          <li className="flow-step">
            <span className="flow-value">{formatNumber(cleaned.rowsRead)}</span>
            <span className="flow-label">baris dibaca</span>
          </li>
          <li className="flow-step minus">
            <span className="flow-value">−{formatNumber(cleaned.duplicatesRemoved + cleaned.rejected.length)}</span>
            <span className="flow-label">
              {formatNumber(cleaned.duplicatesRemoved)} duplikat · {formatNumber(cleaned.rejected.length)} ditolak
            </span>
          </li>
          <li className="flow-step">
            <span className="flow-value">{formatNumber(cleaned.rows.length)}</span>
            <span className="flow-label">baris bersih</span>
          </li>
          <li className="flow-step minus">
            <span className="flow-value">−{formatNumber(cancelled.lines + returned.lines + unknown.lines)}</span>
            <span className="flow-label">
              {formatNumber(cancelled.lines)} batal · {formatNumber(returned.lines)} retur
              {unknown.lines > 0 && ` · ${unknown.lines} tidak dikenal`}
            </span>
          </li>
          <li className="flow-step final">
            <span className="flow-value">{formatNumber(counted)}</span>
            <span className="flow-label">dihitung · {formatRupiah(file.netRevenue)}</span>
          </li>
        </ol>

        <div className="segbar" role="img" aria-label={parts.map((p) => `${p.label} ${p.value} baris`).join(', ')}>
          {parts
            .filter((p) => p.value > 0)
            .map((p) => {
              const pct = (p.value / cleaned.rowsRead) * 100;
              return (
                <span key={p.label} className={`seg-part ${p.tone}`} style={{ flexGrow: p.value }} title={`${p.label}: ${p.value} baris`}>
                  {pct >= 9 && `${Math.round(pct)}%`}
                </span>
              );
            })}
        </div>
        <ul className="seg-legend">
          {parts.map((p) => (
            <li key={p.label}>
              <span className={`seg-key ${p.tone}`} aria-hidden />
              {p.label} <span className="strong">{formatNumber(p.value)}</span>
            </li>
          ))}
        </ul>

        {cleaned.rejected.length > 0 && (
          <details open>
            <summary>Baris yang ditolak ({cleaned.rejected.length})</summary>
            <ul className="rejected">
              {cleaned.rejected.slice(0, 50).map((r) => (
                <li key={`${r.file}-${r.line}`}>
                  {r.file} baris {r.line}: {r.reason}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="card fill-card">
        <div className="card-head">
          <div>
            <h2>Format yang disatukan</h2>
            <p className="secondary small">Contoh asli dari file dan cara aplikasi membacanya</p>
          </div>
        </div>
        <div className="scroll-area">
          <table className="compact">
            <thead>
              <tr>
                <th>Tanggal di file</th>
                <th>Dibaca sebagai</th>
                <th className="num">Baris</th>
              </tr>
            </thead>
            <tbody>
              <FormatRows formats={cleaned.formats.filter((f) => f.field === 'date')} />
            </tbody>
            <thead>
              <tr>
                <th className="th-gap">Harga di file</th>
                <th className="th-gap">Dibaca sebagai</th>
                <th className="num th-gap">Nilai</th>
              </tr>
            </thead>
            <tbody>
              <FormatRows formats={cleaned.formats.filter((f) => f.field === 'money')} />
            </tbody>
          </table>
          <p className="muted small footnote">
            TikTok menulis tanggal dulu baru bulan: <code>03/10/2026</code> = 3 Oktober, bukan 10 Maret.
          </p>
        </div>
      </section>

      <section className="card fill-card">
        <div className="card-head">
          <div>
            <h2>Channel, SKU & duplikat</h2>
            <p className="secondary small">
              {cleaned.channelSpellings.length} cara penulisan → {CHANNELS.length} channel
            </p>
          </div>
        </div>
        <div className="scroll-area">
          <div className="spellings">
            {CHANNELS.map((ch) => (
              <div key={ch} className="spelling-row">
                <span className="spelling-target">
                  <Swatch channel={ch} />
                  {ch}
                </span>
                <span className="spelling-raw">
                  {cleaned.channelSpellings
                    .filter((s) => s.channel === ch)
                    .map((s) => (
                      <code key={s.raw}>
                        {s.raw} <span className="muted">{s.count}</span>
                      </code>
                    ))}
                </span>
              </div>
            ))}
          </div>
          <div className="mini-stats">
            <div>
              <p className="mini-value">
                {formatNumber(cleaned.skuRecovered)}/{formatNumber(cleaned.skuMissing)}
              </p>
              <p className="secondary small">SKU kosong dipulihkan dari nama listing di channel yang sama</p>
            </div>
            <div>
              <p className="mini-value">{formatNumber(cleaned.duplicatesRemoved)}</p>
              <p className="secondary small">baris identik dibuang, kalau tidak revenue lebih {formatRupiah(cleaned.duplicateValue)}</p>
            </div>
          </div>
          {recoveredExamples.length > 0 && (
            <ul className="examples">
              {recoveredExamples.map((r) => (
                <li key={`${r.channel}|${r.productName}`}>
                  <Swatch channel={r.channel} />
                  <span className="truncate">{r.productName}</span>
                  <span className="muted">→</span>
                  <code>{r.sku}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card fill-card">
        <div className="card-head">
          <div>
            <h2>Status pesanan</h2>
            <p className="secondary small">{file.statuses.length} status → dihitung, batal, retur</p>
          </div>
        </div>
        <div className="scroll-area">
          <table className="compact">
            <thead>
              <tr>
                <th>Status di file</th>
                <th>Perlakuan</th>
                <th className="num">Baris</th>
              </tr>
            </thead>
            <tbody>
              {file.statuses.map((s) => (
                <tr key={s.statusRaw}>
                  <td>
                    {s.statusRaw || '(kosong)'}
                    <div className="muted small">{formatRupiah(s.value)}</div>
                  </td>
                  <td>
                    <span className={`badge b-${s.category}`}>{CATEGORY_LABEL[s.category]}</span>
                  </td>
                  <td className="num secondary">{formatNumber(s.lines)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
