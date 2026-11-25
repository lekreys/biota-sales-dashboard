import { useState } from 'react';
import type { CSSProperties } from 'react';
import { formatNumber, formatRupiah } from '../lib/format';
import type { ProductSummary } from '../lib/metrics';
import { CHANNELS } from '../lib/types';
import type { Channel } from '../lib/types';
import { CHANNEL_COLOR, Legend } from './ChannelColor';

interface Props {
  products: ProductSummary[];
  channels: Channel[];
  selected: string | null;
  onSelect: (key: string) => void;
}

function ProductTooltip({
  product,
  channels,
  above,
}: {
  product: ProductSummary;
  channels: Channel[];
  above: boolean;
}) {
  return (
    <span className={`tooltip rank-tooltip${above ? ' up' : ''}`} role="tooltip">
      <span className="tooltip-title">
        {product.name} · {product.sku || 'SKU tidak diketahui'}
      </span>
      {channels.map((channel) => (
        <span key={channel} className="tooltip-row">
          <span className="line-key" style={{ background: CHANNEL_COLOR[channel] }} />
          <span className="tooltip-value">{formatRupiah(product.byChannel[channel])}</span>
          <span className="tooltip-label">{channel}</span>
        </span>
      ))}
      <span className="tooltip-row total">
        <span className="line-key blank" />
        <span className="tooltip-value">{formatRupiah(product.netRevenue)}</span>
        <span className="tooltip-label">{formatNumber(product.units)} unit</span>
      </span>
    </span>
  );
}

export function TopProducts({ products, channels, selected, onSelect }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const top = products.slice(0, 10);
  const max = Math.max(1, ...top.map((product) => product.netRevenue));
  const shown = CHANNELS.filter((channel) => channels.includes(channel));

  return (
    <section className="card fill-card">
      <div className="card-head">
        <div>
          <h2>Top 10 produk</h2>
          <p className="secondary small">Berdasarkan net revenue · klik untuk memfilter</p>
        </div>
        <Legend active={channels} />
      </div>

      {top.length === 0 ? (
        <p className="secondary">Tidak ada penjualan pada filter ini.</p>
      ) : (
        <div className="scroll-area">
          <ol className="rank">
            {top.map((product, i) => {
              const isSelected = selected === product.key;
              return (
                <li key={product.key}>
                  <button
                    className={`rank-row${isSelected ? ' selected' : ''}${selected && !isSelected ? ' dim' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => onSelect(product.key)}
                    onPointerEnter={() => setHover(product.key)}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(product.key)}
                    onBlur={() => setHover(null)}
                  >
                    <span className="rank-n">{i + 1}</span>
                    <span className="rank-main">
                      <span className="rank-line">
                        <span className="rank-name" title={product.name}>
                          {product.name}
                        </span>
                        <span className="rank-value">{formatRupiah(product.netRevenue)}</span>
                      </span>
                      <span className="rank-bar">
                        <span className="hbar-track">
                          <span
                            className="hbar stack"
                            style={{ width: `${(product.netRevenue / max) * 100}%`, '--i': i } as CSSProperties}
                          >
                            {shown
                              .filter((channel) => product.byChannel[channel] > 0)
                              .map((channel) => (
                                <span
                                  key={channel}
                                  style={{ flexGrow: product.byChannel[channel], background: CHANNEL_COLOR[channel] }}
                                />
                              ))}
                          </span>
                        </span>
                        <span className="rank-units">{formatNumber(product.units)} unit</span>
                      </span>
                    </span>
                    {hover === product.key && <ProductTooltip product={product} channels={shown} above={i >= 5} />}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
