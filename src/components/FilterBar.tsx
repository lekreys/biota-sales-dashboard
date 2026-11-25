import { endOfMonth, monthName } from '../lib/format';
import type { Filters } from '../lib/metrics';
import { CHANNELS } from '../lib/types';
import type { Channel } from '../lib/types';
import { Swatch } from './ChannelColor';
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

function presetsFor(firstDay: string) {
  const month = firstDay.slice(0, 7);
  const lastDay = endOfMonth(firstDay);
  const name = monthName(firstDay);
  return [
    { label: 'Semua', from: '', to: '' },
    { label: `1–15 ${name}`, from: `${month}-01`, to: `${month}-15` },
    { label: `16–${lastDay.slice(8)} ${name}`, from: `${month}-16`, to: lastDay },
  ];
}

export function FilterBar({ filters, min, max, invalid, productName, onChange, onReset }: Props) {
  const hasFilter = Boolean(filters.from || filters.to || filters.channels.length < CHANNELS.length || filters.product);

  function toggleChannel(channel: Channel) {
    const next = filters.channels.includes(channel)
      ? filters.channels.filter((c) => c !== channel)
      : [...filters.channels, channel];
    onChange({ channels: next.length ? CHANNELS.filter((c) => next.includes(c)) : [...CHANNELS] });
  }

  return (
    <div className="filter-bar" role="group" aria-label="Filter">
      <div className="filter-group">
        <span className="filter-label">Periode</span>
        <div className="segmented">
          {presetsFor(min).map((preset) => {
            const isActive = preset.from === filters.from && preset.to === filters.to;
            return (
              <button
                key={preset.label}
                className={isActive ? 'active' : ''}
                aria-pressed={isActive}
                onClick={() => onChange({ from: preset.from, to: preset.to })}
              >
                {preset.label}
              </button>
            );
          })}
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
        {CHANNELS.map((channel) => {
          const isOn = filters.channels.includes(channel);
          return (
            <button
              key={channel}
              className={`chip-toggle${isOn ? ' on' : ''}`}
              aria-pressed={isOn}
              onClick={() => toggleChannel(channel)}
            >
              <Swatch channel={channel} />
              {channel}
            </button>
          );
        })}
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

      {hasFilter && (
        <button className="link reset" onClick={onReset}>
          Reset filter
        </button>
      )}

      {invalid && <p className="alert inline">Tanggal awal tidak boleh setelah tanggal akhir.</p>}
    </div>
  );
}
