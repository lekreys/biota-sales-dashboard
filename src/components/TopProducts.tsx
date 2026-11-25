import { useState } from 'react';
import { formatNumber, formatRupiah } from '../lib/format';
import type { ProductSummary } from '../lib/metrics';
import { CHANNELS } from '../lib/types';
import type { Channel } from '../lib/types';
import { CHANNEL_COLOR, Legend } from './channelColor';

interface Props {
  products: ProductSummary[]; // already ranked; computed without the product filter
  channels: Channel[];
  selected: string | null;
  onSelect: (key: string) => void;
}

export function TopProducts({ products, channels, selected, onSelect }: Props) {
  const top = products.slice(0, 10);
  const max = Math.max(1, ...top.map((p) => p.netRevenue));
  const [hover, setHover] = useState<string | null>(null);
  const shown = CHANNELS.filter((c) => channels.includes(c));

  return (
    <section className="card rise">
      <div className="card-head">
        <div>
          <h2>Top 10 produk</h2>
          <p className="secondary small">Berdasarkan net revenue. Klik produk untuk memfilter dashboard.</p>
        </div>
        <Legend active={channels} />
      </div>

      {top.length === 0 ? (
        <p className="secondary">Tidak ada penjualan pada filter ini.</p>
      ) : (
        <ol className="rank">
          {top.map((p, i) => {
            const isSelected = selected === p.key;
            return (
              <li key={p.key}>
                <button
                  className={`rank-row${isSelected ? ' selected' : ''}${selected && !isSelected ? ' dim' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(p.key)}
                  onPointerEnter={() => setHover(p.key)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(p.key)}
                  onBlur={() => setHover(null)}
                >
                  <span className="rank-n">{i + 1}</span>
                  <span className="rank-main">
                    <span className="rank-line">
                      <span className="rank-name" title={p.name}>
                        {p.name}
                      </span>
                      <span className="rank-value">{formatRupiah(p.netRevenue)}</span>
                    </span>
                    <span className="hbar-track">
                      <span className="hbar stack" style={{ width: `${(p.netRevenue / max) * 100}%` }}>
                        {shown.map((c) =>
                          p.byChannel[c] > 0 ? (
                            <span key={c} style={{ flexGrow: p.byChannel[c], background: CHANNEL_COLOR[c] }} />
                          ) : null,
                        )}
                      </span>
                    </span>
                    <span className="secondary small">
                      {p.sku || 'SKU tidak diketahui'} · {formatNumber(p.units)} unit
                    </span>
                  </span>
                  {hover === p.key && (
                    <span className="tooltip rank-tooltip" role="tooltip">
                      <span className="tooltip-title">{p.name}</span>
                      {shown.map((c) => (
                        <span key={c} className="tooltip-row">
                          <span className="line-key" style={{ background: CHANNEL_COLOR[c] }} />
                          <span className="tooltip-value">{formatRupiah(p.byChannel[c])}</span>
                          <span className="tooltip-label">{c}</span>
                        </span>
                      ))}
                      <span className="tooltip-row total">
                        <span className="line-key blank" />
                        <span className="tooltip-value">{formatRupiah(p.netRevenue)}</span>
                        <span className="tooltip-label">{formatNumber(p.units)} unit</span>
                      </span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
