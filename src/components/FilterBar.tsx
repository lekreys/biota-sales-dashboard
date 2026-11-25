import { endOfMonth, monthName } from '../lib/format';
import type { Filters } from '../lib/metrics';
import { CHANNELS } from '../lib/types';
import type { Channel } from '../lib/types';
import { Swatch } from './channelColor';
import { CloseIcon } from './Icons';

interface Props {
  filters: Filters;
  min: string;
  max: string;
  invalid: boolean;
  productName: string | null;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
}

export function FilterBar({ filters, min, max, invalid, productName, onChange, onReset }: Props) {
  const month = min.slice(0, 7); // presets use the first month in the data
  const presets = [
    { label: 'Semua', from: '', to: '' },
    { label: `1–15 ${monthName(min)}`, from: `${month}-01`, to: `${month}-15` },
    { label: `16–${endOfMonth(min).slice(8)} ${monthName(min)}`, from: `${month}-16`, to: endOfMonth(min) },
  ];
  const allChannels = filters.channels.length === CHANNELS.length;
  const active = Boolean(filters.from || filters.to || !allChannels || filters.product);

  function toggleChannel(c: Channel) {
    const next = filters.channels.includes(c) ? filters.channels.filter((x) => x !== c) : [...filters.channels, c];
    // Never end up with no channel at all: deselecting the last one shows everything again.
    onChange({ channels: next.length ? CHANNELS.filter((x) => next.includes(x)) : [...CHANNELS] });
  }

  return (
    <div className="filter-row" role="group" aria-label="Filter">
      <div className="filter-group">
        <span className="filter-label">Periode</span>
        <div className="segmented">
          {presets.map((p) => (
            <button
              key={p.label}
              className={p.from === filters.from && p.to === filters.to ? 'active' : ''}
              aria-pressed={p.from === filters.from && p.to === filters.to}
              onClick={() => onChange({ from: p.from, to: p.to })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <span className="date-range">
          <input
            type="date"
            aria-label="Dari tanggal"
            value={filters.from}
            min={min}
            max={max}
            onChange={(e) => onChange({ from: e.target.value })}
          />
          <span className="muted">–</span>
          <input
            type="date"
            aria-label="Sampai tanggal"
            value={filters.to}
            min={min}
            max={max}
            onChange={(e) => onChange({ to: e.target.value })}
          />
        </span>
      </div>

      <div className="filter-group">
        <span className="filter-label">Channel</span>
        {CHANNELS.map((c) => (
          <button
            key={c}
            className={`chip-toggle${filters.channels.includes(c) ? ' on' : ''}`}
            aria-pressed={filters.channels.includes(c)}
            onClick={() => toggleChannel(c)}
          >
            <Swatch channel={c} />
            {c}
          </button>
        ))}
      </div>

      {filters.product && (
        <div className="filter-group">
          <span className="filter-label">Produk</span>
          <span className="chip-toggle on product-chip">
            <span className="truncate">{productName}</span>
            <button className="chip-x" aria-label="Hapus filter produk" onClick={() => onChange({ product: null })}>
              <CloseIcon />
            </button>
          </span>
        </div>
      )}

      {active && (
        <button className="link reset" onClick={onReset}>
          Reset filter
        </button>
      )}

      {invalid && <p className="alert inline">Tanggal awal tidak boleh setelah tanggal akhir.</p>}
    </div>
  );
}
