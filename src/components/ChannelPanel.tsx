import { formatNumber, formatPercent, formatRupiah } from '../lib/format';
import type { ChannelSummary, DayPoint } from '../lib/metrics';
import { CHANNELS } from '../lib/types';
import type { Channel } from '../lib/types';
import { CHANNEL_COLOR, Swatch } from './ChannelColor';

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <span className="spark" />;
  const max = Math.max(1, ...values);
  const points = values.map((value, i) => `${(i / (values.length - 1)) * 100},${30 - (value / max) * 27}`).join(' ');
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
  channels: ChannelSummary[];
  daily: DayPoint[];
  selected: Channel[];
  onSolo: (channel: Channel) => void;
}

export function ChannelPanel({ channels, daily, selected, onSolo }: Props) {
  const total = channels.reduce((sum, channel) => sum + channel.netRevenue, 0);
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
        aria-label={channels.map((c) => `${c.channel} ${formatPercent(c.netRevenue, total)}`).join(', ')}
      >
        {channels
          .filter((c) => c.netRevenue > 0)
          .map((c) => (
            <span
              key={c.channel}
              className={selected.includes(c.channel) ? '' : 'off'}
              style={{ flexGrow: c.netRevenue, background: CHANNEL_COLOR[c.channel] }}
            />
          ))}
      </div>

      <div className="channel-list">
        {channels.map((c) => {
          const isOn = selected.includes(c.channel);
          return (
            <button
              key={c.channel}
              className={`channel-row${isOn ? '' : ' off'}${filtered && isOn ? ' picked' : ''}`}
              aria-pressed={filtered && isOn}
              onClick={() => onSolo(c.channel)}
            >
              <span className="channel-top">
                <span className="channel-name">
                  <Swatch channel={c.channel} />
                  {c.channel}
                </span>
                <span className="channel-share">{formatPercent(c.netRevenue, total)}</span>
              </span>
              <span className="channel-value">{formatRupiah(c.netRevenue)}</span>
              <Sparkline values={daily.map((day) => day.byChannel[c.channel])} color={CHANNEL_COLOR[c.channel]} />
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
