import { formatNumber, formatRupiah } from '../lib/format';
import type { ChannelSummary, DayPoint } from '../lib/metrics';
import { CHANNELS } from '../lib/types';
import type { Channel } from '../lib/types';
import { CHANNEL_COLOR, Swatch } from './channelColor';

/** Small trend line of daily net revenue (own scale: it shows the shape, the main chart shows the size). */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <span className="spark" />;
  const max = Math.max(1, ...values);
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${30 - (v / max) * 27}`).join(' ');
  return (
    <svg className="spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
      <polygon points={`0,32 ${points} 100,32`} style={{ fill: color, opacity: 0.1 }} />
      <polyline
        points={points}
        style={{ stroke: color }}
        fill="none"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

interface Props {
  channels: ChannelSummary[]; // computed without the channel filter, so all three stay visible
  daily: DayPoint[]; // same, per day, for the sparklines
  selected: Channel[];
  onSolo: (channel: Channel) => void;
}

export function ChannelCards({ channels, daily, selected, onSolo }: Props) {
  const total = channels.reduce((a, c) => a + c.netRevenue, 0);
  const filtered = selected.length < CHANNELS.length;

  return (
    <section className="card channel-panel">
      <div className="card-head">
        <div>
          <h2>Net revenue per channel</h2>
          <p className="secondary small">Klik untuk melihat satu channel</p>
        </div>
      </div>
      <div
        className="split"
        role="img"
        aria-label={channels.map((c) => `${c.channel} ${total ? Math.round((c.netRevenue / total) * 1000) / 10 : 0}%`).join(', ')}
      >
        {channels.map((c) =>
          c.netRevenue > 0 ? (
            <span
              key={c.channel}
              className={selected.includes(c.channel) ? '' : 'off'}
              style={{ flexGrow: c.netRevenue, background: CHANNEL_COLOR[c.channel] }}
            />
          ) : null,
        )}
      </div>
      <div className="channel-list">
        {channels.map((c) => {
          const on = selected.includes(c.channel);
          const share = total ? (c.netRevenue / total) * 100 : 0;
          return (
            <button
              key={c.channel}
              className={`channel-row${on ? '' : ' off'}${filtered && on ? ' picked' : ''}`}
              aria-pressed={filtered && on}
              onClick={() => onSolo(c.channel)}
            >
              <span className="channel-top">
                <span className="channel-name">
                  <Swatch channel={c.channel} />
                  {c.channel}
                </span>
                <span className="channel-share">{share.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%</span>
              </span>
              <span className="channel-value">{formatRupiah(c.netRevenue)}</span>
              <Sparkline values={daily.map((d) => d.byChannel[c.channel])} color={CHANNEL_COLOR[c.channel]} />
              <span className="secondary small">
                {formatNumber(c.orders)} pesanan · {formatNumber(c.units)} unit
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
