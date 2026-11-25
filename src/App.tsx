import { useEffect, useMemo, useState } from 'react';
import { ChannelSection } from './components/ChannelSection';
import { FilterBar } from './components/FilterBar';
import { KpiRow } from './components/KpiRow';
import { ProductTable } from './components/ProductTable';
import { Reconciliation } from './components/Reconciliation';
import { TopProducts } from './components/TopProducts';
import { TrendChart } from './components/TrendChart';
import { UploadArea } from './components/UploadArea';
import { cleanRows } from './lib/clean';
import { readCsv, toCsv } from './lib/csv';
import { formatDay } from './lib/format';
import { applyFilters, dailyRevenue, NO_FILTERS, summarize } from './lib/metrics';
import type { Filters } from './lib/metrics';
import { CHANNELS } from './lib/types';
import type { Channel, SourceFile } from './lib/types';

type Theme = 'light' | 'dark' | null; // null = follow the operating system

function storedTheme(): Theme {
  try {
    const t = localStorage.getItem('theme');
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [theme, setTheme] = useState<Theme>(storedTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.dataset.theme = theme;
    else delete root.dataset.theme;
    try {
      if (theme) localStorage.setItem('theme', theme);
      else localStorage.removeItem('theme');
    } catch {
      // storage unavailable (private mode): the toggle still works for this visit
    }
  }, [theme]);
  const isDark = theme === 'dark' || (theme === null && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const cleaned = useMemo(() => (files.length ? cleanRows(files) : null), [files]);
  const bounds = useMemo(() => {
    if (!cleaned || cleaned.rows.length === 0) return null;
    const days = cleaned.rows.map((r) => r.day).sort();
    return { min: days[0], max: days[days.length - 1] };
  }, [cleaned]);
  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to);

  // Every panel uses the same filters. Some ignore one filter so they keep their context (see applyFilters).
  const view = useMemo(() => {
    if (!cleaned || !bounds) return null;
    const rows = invalidRange ? [] : cleaned.rows;
    const names = cleaned.productNames;
    const filtered = applyFilters(rows, filters);
    return {
      rows: filtered,
      summary: summarize(filtered, names),
      channels: summarize(applyFilters(rows, filters, { channel: true }), names).byChannel,
      products: summarize(applyFilters(rows, filters, { product: true }), names).byProduct,
      daily: dailyRevenue(applyFilters(cleaned.rows, filters, { date: true }), bounds.min, bounds.max),
    };
  }, [cleaned, bounds, filters, invalidRange]);

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
    setFilters(NO_FILTERS);
  }

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const soloChannel = (c: Channel) =>
    setFilters((f) => ({ ...f, channels: f.channels.length === 1 && f.channels[0] === c ? [...CHANNELS] : [c] }));
  const toggleProduct = (key: string) => setFilters((f) => ({ ...f, product: f.product === key ? null : key }));

  const productName = filters.product && cleaned ? (cleaned.productNames[filters.product] ?? filters.product) : null;
  const periodLabel = bounds ? `${formatDay(filters.from || bounds.min)} – ${formatDay(filters.to || bounds.max)}` : '';
  const scopeLabel = [
    filters.channels.length < CHANNELS.length ? filters.channels.join(' + ') : '',
    productName ?? '',
  ]
    .filter(Boolean)
    .join(' · ');

  function download() {
    if (!view) return;
    const blob = new Blob([toCsv(view.rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_bersih_${filters.from || bounds?.min}_sd_${filters.to || bounds?.max}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <p className="eyebrow">BIOTA Smart Home</p>
          <h1>Dashboard Penjualan</h1>
          <p className="secondary">
            Shopee, TikTok Shop dan Tokopedia
            {bounds && ` · ${formatDay(bounds.min)} – ${formatDay(bounds.max)}`}
          </p>
        </div>
        <button
          className="icon-button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
          title={isDark ? 'Mode terang' : 'Mode gelap'}
        >
          {isDark ? '☀' : '☾'}
        </button>
      </header>

      <UploadArea files={files} errors={errors} onFiles={addFiles} onSample={loadSample} onReset={reset} />

      {cleaned && bounds && view && (
        <>
          <FilterBar
            filters={filters}
            min={bounds.min}
            max={bounds.max}
            invalid={invalidRange}
            productName={productName}
            onChange={update}
            onReset={() => setFilters(NO_FILTERS)}
          />

          <KpiRow
            summary={view.summary}
            periodLabel={periodLabel}
            scopeLabel={scopeLabel}
            onDownload={download}
            canDownload={view.rows.length > 0}
          />

          <TrendChart
            points={view.daily}
            from={filters.from}
            to={filters.to}
            channels={filters.channels}
            onSelect={(from, to) => update({ from, to })}
          />

          <div className="grid">
            <ChannelSection channels={view.channels} selected={filters.channels} onSolo={soloChannel} />
            <TopProducts
              products={view.products}
              channels={filters.channels}
              selected={filters.product}
              onSelect={toggleProduct}
            />
          </div>

          <ProductTable products={view.products} selected={filters.product} onSelect={toggleProduct} />

          <Reconciliation cleaned={cleaned} summary={view.summary} />
        </>
      )}

      <footer className="footer secondary">
        Net revenue = total harga dari pesanan yang tidak dibatalkan dan tidak diretur/refund. Pesanan yang sudah selesai
        maupun yang masih dalam pengiriman tetap dihitung. Semua data diproses di browser kamu dan tidak dikirim ke
        server.
      </footer>
    </div>
  );
}
