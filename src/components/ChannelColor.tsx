import { CHANNELS } from '../lib/types';
import type { Channel } from '../lib/types';

export const CHANNEL_COLOR: Record<Channel, string> = {
  Shopee: 'var(--series-1)',
  'TikTok Shop': 'var(--series-2)',
  Tokopedia: 'var(--series-3)',
};

export function Swatch({ channel }: { channel: Channel }) {
  return <span className="swatch" style={{ background: CHANNEL_COLOR[channel] }} aria-hidden />;
}

export function Legend({ active }: { active: Channel[] }) {
  return (
    <ul className="legend" aria-label="Legenda channel">
      {CHANNELS.map((channel) => (
        <li key={channel} className={active.includes(channel) ? '' : 'off'}>
          <Swatch channel={channel} />
          {channel}
        </li>
      ))}
    </ul>
  );
}
