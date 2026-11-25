import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { formatNumber, formatRupiah } from '../lib/format';
import type { Summary } from '../lib/metrics';

/** Number that counts up on change; screen readers get the exact final value only. */
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
  onDownload: () => void;
  canDownload: boolean;
}

export function KpiRow({ summary, periodLabel, scopeLabel, onDownload, canDownload }: Props) {
  const excluded = summary.excluded.cancelled.value + summary.excluded.returned.value + summary.excluded.unknown.value;
  const excludedLines = summary.excluded.cancelled.lines + summary.excluded.returned.lines + summary.excluded.unknown.lines;
  const average = summary.orders ? Math.round(summary.netRevenue / summary.orders) : 0;

  return (
    <section className="kpis">
      <div className="card hero-card rise">
        <p className="label">Net revenue</p>
        <p className="hero-value" data-testid="net-revenue">
          <Animated value={summary.netRevenue} format={formatRupiah} />
        </p>
        <p className="secondary">
          {periodLabel}
          {scopeLabel && ` · ${scopeLabel}`}
        </p>
        <button className="button ghost" onClick={onDownload} disabled={!canDownload}>
          ↓ Unduh data bersih (CSV)
        </button>
      </div>

      <div className="tiles">
        <div className="card tile rise">
          <p className="label">Pesanan</p>
          <p className="tile-value">
            <Animated value={summary.orders} format={formatNumber} />
          </p>
          <p className="secondary small">tidak batal / retur</p>
        </div>
        <div className="card tile rise">
          <p className="label">Unit terjual</p>
          <p className="tile-value">
            <Animated value={summary.units} format={formatNumber} />
          </p>
          <p className="secondary small">dari pesanan yang dihitung</p>
        </div>
        <div className="card tile rise">
          <p className="label">Rata-rata per pesanan</p>
          <p className="tile-value">
            <Animated value={average} format={formatRupiah} />
          </p>
          <p className="secondary small">net revenue ÷ pesanan</p>
        </div>
        <div className="card tile rise">
          <p className="label">Tidak dihitung</p>
          <p className="tile-value">
            <Animated value={excluded} format={formatRupiah} />
          </p>
          <p className="secondary small">{formatNumber(excludedLines)} baris batal / retur</p>
        </div>
      </div>
    </section>
  );
}
