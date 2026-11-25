import { useEffect, useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { ChannelCards } from './components/ChannelCards';
import { CleanDataTable } from './components/CleanDataTable';
import { DataQuality } from './components/DataQuality';
import { FilterBar } from './components/FilterBar';
import { CloseIcon, LogoMark, MoonIcon, SunIcon } from './components/Icons';
import { KpiRow } from './components/KpiRow';
import { ProductTable } from './components/ProductTable';
import { Tabs } from './components/Tabs';
import { TopProducts } from './components/TopProducts';
import { TrendChart } from './components/TrendChart';
import { EmptyState, FileActions } from './components/UploadArea';
import { cleanRows } from './lib/clean';
import { readCsv, toCsv } from './lib/csv';
import { formatDay, formatNumber } from './lib/format';
import { applyFilters, dailyRevenue, NO_FILTERS, summarize } from './lib/metrics';
import type { Filters } from './lib/metrics';
import { CHANNELS } from './lib/types';
import type { Channel, SourceFile } from './lib/types';

type Theme = 'light' | 'dark' | null; // null = follow the operating system

const TAB_IDS = ['ringkasan', 'produk', 'kualitas-data', 'data'] as const;
type TabId = (typeof TAB_IDS)[number];

function storedTheme(): Theme {
  try {
    const t = localStorage.getItem('theme');
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

/** The open tab lives in the URL (#produk), so a refresh or a shared link opens the same tab. */
function tabFromHash(): TabId {
  const id = window.location.hash.slice(1);
  return (TAB_IDS as readonly string[]).includes(id) ? (id as TabId) : 'ringkasan';
}

const hasFiles = (e: DragEvent) => [...e.dataTransfer.types].includes('Files');

export default function App() {
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [theme, setTheme] = useState<Theme>(storedTheme);
  const [tab, setTab] = useState<TabId>(tabFromHash);
  const [dragging, setDragging] = useState(false);

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

  useEffect(() => {
    if (files.length) history.replaceState(null, '', `#${tab}`);
  }, [tab, files.length]);

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
    const withAllChannels = applyFilters(rows, filters, { channel: true });
    return {
      rows: filtered,
      summary: summarize(filtered, names),
      file: summarize(cleaned.rows, names),
      channels: summarize(withAllChannels, names).byChannel,
      channelDaily: dailyRevenue(withAllChannels, filters.from || bounds.min, filters.to || bounds.max),
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
    setTab('ringkasan');
    history.replaceState(null, '', window.location.pathname);
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

  const issues = cleaned
    ? cleaned.rejected.length +
      cleaned.priceMismatches +
      (cleaned.skuMissing - cleaned.skuRecovered) +
      cleaned.rows.filter((r) => r.status === 'unknown').length
    : 0;

  return (
    <div
      className="shell"
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setDragging(false);
        addFiles([...e.dataTransfer.files]);
      }}
    >
      <header className="topbar">
        <div className="brand">
          <LogoMark />
          <div>
            <p className="brand-name">Dashboard Penjualan</p>
            <p className="brand-sub">
              BIOTA Smart Home{bounds && ` · ${formatDay(bounds.min)} – ${formatDay(bounds.max)}`}
            </p>
          </div>
        </div>

        {view && (
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { id: 'ringkasan', label: 'Ringkasan' },
              { id: 'produk', label: 'Produk', badge: view.products.length },
              { id: 'kualitas-data', label: 'Kualitas data', badge: issues ? `${issues} isu` : 'OK' },
              { id: 'data', label: 'Data bersih', badge: formatNumber(view.rows.length) },
            ]}
          />
        )}

        <div className="topbar-actions">
          {files.length > 0 && <FileActions files={files} onFiles={addFiles} onReset={reset} />}
          <button
            className="icon-button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            title={isDark ? 'Mode terang' : 'Mode gelap'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      {view && bounds && tab !== 'kualitas-data' && (
        <FilterBar
          filters={filters}
          min={bounds.min}
          max={bounds.max}
          invalid={invalidRange}
          productName={productName}
          onChange={update}
          onReset={() => setFilters(NO_FILTERS)}
        />
      )}

      <main className="main">
        {!view || !cleaned ? (
          <EmptyState onFiles={addFiles} onSample={loadSample} />
        ) : (
          <div className={`panel panel-${tab}`} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} key={tab}>
            {tab === 'ringkasan' && (
              <>
                <KpiRow summary={view.summary} periodLabel={periodLabel} scopeLabel={scopeLabel} />
                <TrendChart
                  points={view.daily}
                  from={filters.from}
                  to={filters.to}
                  channels={filters.channels}
                  onSelect={(from, to) => update({ from, to })}
                />
                <ChannelCards
                  channels={view.channels}
                  daily={view.channelDaily}
                  selected={filters.channels}
                  onSolo={soloChannel}
                />
              </>
            )}

            {tab === 'produk' && (
              <>
                <TopProducts
                  products={view.products}
                  channels={filters.channels}
                  selected={filters.product}
                  onSelect={toggleProduct}
                />
                <ProductTable products={view.products} selected={filters.product} onSelect={toggleProduct} />
              </>
            )}

            {tab === 'kualitas-data' && <DataQuality cleaned={cleaned} file={view.file} />}

            {tab === 'data' && <CleanDataTable rows={view.rows} onDownload={download} />}
          </div>
        )}
      </main>

      {errors.length > 0 && (
        <div className="toast" role="alert">
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <button className="icon-button" aria-label="Tutup pesan" onClick={() => setErrors([])}>
            <CloseIcon />
          </button>
        </div>
      )}

      {dragging && (
        <div className="drop-overlay" aria-hidden>
          <span>Lepaskan untuk menambahkan file CSV</span>
        </div>
      )}
    </div>
  );
}
