import { formatNumber, formatRupiah } from '../lib/format';
import type { ChannelSummary } from '../lib/metrics';
import { CHANNELS } from '../lib/types';
import type { Channel } from '../lib/types';
import { CHANNEL_COLOR, Swatch } from './channelColor';

interface Props {
  channels: ChannelSummary[]; // computed without the channel filter, so all three stay visible
  selected: Channel[];
  onSolo: (channel: Channel) => void;
}

export function ChannelSection({ channels, selected, onSolo }: Props) {
  const total = channels.reduce((a, c) => a + c.netRevenue, 0);
  const max = Math.max(1, ...channels.map((c) => c.netRevenue));
  const filtered = selected.length < CHANNELS.length;

  return (
    <section className="card rise">
      <div className="card-head">
        <div>
          <h2>Net revenue per channel</h2>
          <p className="secondary small">Klik channel untuk melihat channel itu saja.</p>
        </div>
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
              <span className="channel-head">
                <span className="channel-name">
                  <Swatch channel={c.channel} />
                  {c.channel}
                </span>
                <span className="channel-value">{formatRupiah(c.netRevenue)}</span>
              </span>
              <span className="hbar-track">
                <span className="hbar" style={{ width: `${(c.netRevenue / max) * 100}%`, background: CHANNEL_COLOR[c.channel] }} />
              </span>
              <span className="secondary small">
                {share.toLocaleString('id-ID', { maximumFractionDigits: 1 })}% · {formatNumber(c.orders)} pesanan ·{' '}
                {formatNumber(c.units)} unit
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
