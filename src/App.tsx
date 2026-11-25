import { useMemo, useState } from 'react';
import { ChannelSection } from './components/ChannelSection';
import { DateFilter } from './components/DateFilter';
import { ProductSection } from './components/ProductSection';
import { Reconciliation } from './components/Reconciliation';
import { UploadArea } from './components/UploadArea';
import { cleanRows } from './lib/clean';
import { readCsv, toCsv } from './lib/csv';
import { formatDay, formatNumber, formatRupiah } from './lib/format';
import { filterByDate, summarize } from './lib/metrics';
import type { SourceFile } from './lib/types';

export default function App() {
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const cleaned = useMemo(() => (files.length ? cleanRows(files) : null), [files]);
  const bounds = useMemo(() => {
    if (!cleaned || cleaned.rows.length === 0) return null;
    const days = cleaned.rows.map((r) => r.day).sort();
    return { min: days[0], max: days[days.length - 1] };
  }, [cleaned]);
  const invalidRange = Boolean(from && to && from > to);
  const inRange = useMemo(
    () => (cleaned && !invalidRange ? filterByDate(cleaned.rows, from, to) : []),
    [cleaned, from, to, invalidRange],
  );
  const summary = useMemo(() => (cleaned ? summarize(inRange, cleaned.productNames) : null), [cleaned, inRange]);

  async function addFiles(list: { name: string; text: () => Promise<string> }[]) {
    const added: SourceFile[] = [];
    const problems: string[] = [];
    for (const file of list) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        problems.push(`${file.name}: bukan file CSV. Simpan/ekspor sebagai .csv terlebih dahulu.`);
        continue;
      }
      const result = readCsv(await file.text());
      if (!result.ok) problems.push(`${file.name}: ${result.error}`);
      else if (result.rows.length === 0) problems.push(`${file.name}: file tidak berisi data.`);
      else added.push({ name: file.name, rows: result.rows });
    }
    setErrors(problems);
    if (added.length) {
      // A file with the same name replaces the earlier upload.
      setFiles((current) => [...current.filter((f) => !added.some((a) => a.name === f.name)), ...added]);
    }
  }

  async function loadSample() {
    const { default: text } = await import('../data/biota_orders_oct2026.csv?raw');
    await addFiles([{ name: 'biota_orders_oct2026.csv', text: async () => text }]);
  }

  function reset() {
    setFiles([]);
    setErrors([]);
    setFrom('');
    setTo('');
  }

  function download() {
    const blob = new Blob([toCsv(inRange)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_bersih_${from || bounds?.min}_sd_${to || bounds?.max}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const periodLabel = bounds
    ? `${formatDay(from || bounds.min)} – ${formatDay(to || bounds.max)}`
    : '';

  return (
    <div className="page">
      <header className="header">
        <h1>Dashboard Penjualan</h1>
        <p className="muted">BIOTA Smart Home · Shopee, TikTok Shop dan Tokopedia</p>
      </header>

      <UploadArea
        files={files}
        errors={errors}
        onFiles={addFiles}
        onSample={loadSample}
        onReset={reset}
      />

      {cleaned && bounds && summary && (
        <>
          <DateFilter
            from={from}
            to={to}
            min={bounds.min}
            max={bounds.max}
            invalid={invalidRange}
            onChange={(f, t) => {
              setFrom(f);
              setTo(t);
            }}
          />

          <section className="card hero">
            <div>
              <p className="label">Total net revenue</p>
              <p className="hero-value">{formatRupiah(summary.netRevenue)}</p>
              <p className="muted">
                {periodLabel} · {formatNumber(summary.orders)} pesanan · {formatNumber(summary.units)} unit
              </p>
            </div>
            <button className="button secondary" onClick={download} disabled={inRange.length === 0}>
              Unduh data bersih (CSV)
            </button>
          </section>

          <div className="grid">
            <ChannelSection summary={summary} />
            <ProductSection title="Top 10 produk" products={summary.byProduct.slice(0, 10)} total={summary.netRevenue} ranked />
          </div>

          <ProductSection title="Net revenue per produk" products={summary.byProduct} total={summary.netRevenue} />

          <Reconciliation cleaned={cleaned} summary={summary} />
        </>
      )}

      <footer className="footer muted">
        Net revenue = total harga dari pesanan yang tidak dibatalkan dan tidak diretur/refund. Pesanan yang sudah selesai
        maupun yang masih dalam pengiriman tetap dihitung. Semua data diproses di browser kamu dan tidak dikirim ke
        server.
      </footer>
    </div>
  );
}
