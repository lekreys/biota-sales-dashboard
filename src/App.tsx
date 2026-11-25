import { useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { ChannelPanel } from './components/ChannelPanel';
import { DataTab } from './components/DataTab';
import { EmptyState, FileActions } from './components/FileUpload';
import { FilterBar } from './components/FilterBar';
import { CloseIcon, LogoMark, MoonIcon, SunIcon } from './components/Icons';
import { KpiStrip } from './components/KpiStrip';
import { ProductTable } from './components/ProductTable';
import { Tabs } from './components/Tabs';
import { TopProducts } from './components/TopProducts';
import { TrendChart } from './components/TrendChart';
import { useHashTab } from './hooks/useHashTab';
import { useTheme } from './hooks/useTheme';
import { cleanRows } from './lib/clean';
import { downloadCsv, readFiles, toCsv } from './lib/csv';
import type { NamedFile } from './lib/csv';
import { formatDay } from './lib/format';
import { buildDashboard, isValidRange, NO_FILTERS } from './lib/metrics';
import type { Filters } from './lib/metrics';
import { CHANNELS } from './lib/types';
import type { Channel, SourceFile } from './lib/types';

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'produk', label: 'Produk' },
  { id: 'data', label: 'Data' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const hasFiles = (e: DragEvent) => [...e.dataTransfer.types].includes('Files');

export default function App() {
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useHashTab<TabId>(
    TABS.map((t) => t.id),
    'ringkasan',
    files.length > 0,
  );
  const { isDark, toggleTheme } = useTheme();

  const cleaned = useMemo(() => (files.length ? cleanRows(files) : null), [files]);
  const dashboard = useMemo(() => (cleaned ? buildDashboard(cleaned, filters) : null), [cleaned, filters]);

  async function addFiles(list: NamedFile[]) {
    const { files: added, problems } = await readFiles(list);
    setErrors(problems);
    if (added.length === 0) return;
    setFiles((current) => [...current.filter((file) => !added.some((a) => a.name === file.name)), ...added]);
  }

  function reset() {
    setFiles([]);
    setErrors([]);
    setFilters(NO_FILTERS);
    setTab('ringkasan');
    history.replaceState(null, '', window.location.pathname);
  }

  const updateFilters = (patch: Partial<Filters>) => setFilters((current) => ({ ...current, ...patch }));

  const soloChannel = (channel: Channel) =>
    setFilters((current) => ({
      ...current,
      channels: current.channels.length === 1 && current.channels[0] === channel ? [...CHANNELS] : [channel],
    }));

  const toggleProduct = (key: string) =>
    setFilters((current) => ({ ...current, product: current.product === key ? null : key }));

  const productName = filters.product ? (cleaned?.productNames[filters.product] ?? filters.product) : null;
  const scopeLabel = [filters.channels.length < CHANNELS.length ? filters.channels.join(' + ') : '', productName ?? '']
    .filter(Boolean)
    .join(' · ');

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
              BIOTA Smart Home
              {dashboard && ` · ${formatDay(dashboard.first)} – ${formatDay(dashboard.last)}`}
            </p>
          </div>
        </div>

        {dashboard && <Tabs tabs={[...TABS]} active={tab} onChange={setTab} />}

        <div className="topbar-actions">
          {files.length > 0 && <FileActions files={files} onFiles={addFiles} onReset={reset} />}
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            title={isDark ? 'Mode terang' : 'Mode gelap'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      {dashboard && tab !== 'data' && (
        <FilterBar
          filters={filters}
          min={dashboard.first}
          max={dashboard.last}
          invalid={!isValidRange(filters)}
          productName={productName}
          onChange={updateFilters}
          onReset={() => setFilters(NO_FILTERS)}
        />
      )}

      <main className="main">
        {!dashboard || !cleaned ? (
          <EmptyState onFiles={addFiles} />
        ) : (
          <div
            className={`panel panel-${tab}`}
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            key={tab}
          >
            {tab === 'ringkasan' && (
              <>
                <KpiStrip
                  summary={dashboard.summary}
                  periodLabel={`${formatDay(filters.from || dashboard.first)} – ${formatDay(filters.to || dashboard.last)}`}
                  scopeLabel={scopeLabel}
                />
                <TrendChart
                  points={dashboard.daily}
                  from={filters.from}
                  to={filters.to}
                  channels={filters.channels}
                  onSelect={(from, to) => updateFilters({ from, to })}
                />
                <ChannelPanel
                  channels={dashboard.channels}
                  daily={dashboard.channelDaily}
                  selected={filters.channels}
                  onSolo={soloChannel}
                />
              </>
            )}

            {tab === 'produk' && (
              <>
                <TopProducts
                  products={dashboard.products}
                  channels={filters.channels}
                  selected={filters.product}
                  onSelect={toggleProduct}
                />
                <ProductTable products={dashboard.products} selected={filters.product} onSelect={toggleProduct} />
              </>
            )}

            {tab === 'data' && (
              <DataTab
                cleaned={cleaned}
                file={dashboard.file}
                onDownload={() =>
                  downloadCsv(`data_bersih_${dashboard.first}_sd_${dashboard.last}.csv`, toCsv(cleaned.rows))
                }
              />
            )}
          </div>
        )}
      </main>

      {errors.length > 0 && (
        <div className="toast" role="alert">
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
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
