import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { formatNumber, formatRupiah } from '../lib/format';
import type { Summary } from '../lib/metrics';

function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const shown = useAnimatedNumber(value);
  return (
    <>
      <span aria-hidden>{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}

interface Props {
  summary: Summary;
  periodLabel: string;
  scopeLabel: string;
}

export function KpiStrip({ summary, periodLabel, scopeLabel }: Props) {
  return (
    <section className="card kpi-strip">
      <div className="kpi hero">
        <p className="label">
          Net revenue <span className="hint">· tidak batal & tidak retur</span>
        </p>
        <p className="hero-value" data-testid="net-revenue">
          <AnimatedNumber value={summary.netRevenue} format={formatRupiah} />
        </p>
        <p className="secondary small">
          {periodLabel}
          {scopeLabel && <span className="scope">{scopeLabel}</span>}
        </p>
      </div>
      <div className="kpi">
        <p className="label">Pesanan</p>
        <p className="kpi-value">
          <AnimatedNumber value={summary.orders} format={formatNumber} />
        </p>
        <p className="secondary small">tidak batal / retur</p>
      </div>
      <div className="kpi">
        <p className="label">Unit terjual</p>
        <p className="kpi-value">
          <AnimatedNumber value={summary.units} format={formatNumber} />
        </p>
        <p className="secondary small">dari pesanan dihitung</p>
      </div>
    </section>
  );
}
