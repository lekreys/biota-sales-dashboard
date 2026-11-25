import { formatNumber, formatRupiah } from '../lib/format';
import type { Summary } from '../lib/metrics';

export function ChannelSection({ summary }: { summary: Summary }) {
  const max = Math.max(...summary.byChannel.map((c) => c.netRevenue), 1);

  return (
    <section className="card">
      <h2>Net revenue per channel</h2>
      <div className="bars">
        {summary.byChannel.map((c) => (
          <div className="bar-row" key={c.channel}>
            <div className="bar-head">
              <span className="strong">{c.channel}</span>
              <span className="num strong">{formatRupiah(c.netRevenue)}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(c.netRevenue / max) * 100}%` }} />
            </div>
            <p className="muted small">
              {summary.netRevenue ? Math.round((c.netRevenue / summary.netRevenue) * 1000) / 10 : 0}% ·{' '}
              {formatNumber(c.orders)} pesanan · {formatNumber(c.units)} unit
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
