import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { formatNumber, formatRupiah } from '../lib/format';
import type { Summary } from '../lib/metrics';

/** Number that eases to a new value when a filter changes; screen readers get the exact value only. */
function Animated({ value, format }: { value: number; format: (n: number) => string }) {
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

/** One strip: the headline number and two supporting figures. */
export function KpiRow({ summary, periodLabel, scopeLabel }: Props) {
  return (
    <section className="card kpi-strip">
      <div className="kpi hero">
        <p className="label" title="Pesanan yang tidak batal dan tidak diretur/refund. Selesai maupun masih dikirim tetap dihitung.">
          Net revenue <span className="hint">· tidak batal & tidak retur</span>
        </p>
        <p className="hero-value" data-testid="net-revenue">
          <Animated value={summary.netRevenue} format={formatRupiah} />
        </p>
        <p className="secondary small">
          {periodLabel}
          {scopeLabel && <span className="scope">{scopeLabel}</span>}
        </p>
      </div>
      <div className="kpi">
        <p className="label">Pesanan</p>
        <p className="kpi-value">
          <Animated value={summary.orders} format={formatNumber} />
        </p>
        <p className="secondary small">tidak batal / retur</p>
      </div>
      <div className="kpi">
        <p className="label">Unit terjual</p>
        <p className="kpi-value">
          <Animated value={summary.units} format={formatNumber} />
        </p>
        <p className="secondary small">dari pesanan dihitung</p>
      </div>
    </section>
  );
}
