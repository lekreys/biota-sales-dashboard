import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { formatCompact, formatDay, formatDayLong, formatRupiah, monthName } from '../lib/format';
import { movingAverage } from '../lib/metrics';
import type { DayPoint } from '../lib/metrics';
import { CHANNELS } from '../lib/types';
import type { Channel } from '../lib/types';
import { CHANNEL_COLOR, Legend } from './channelColor';

/** Round axis ticks (0, 5 jt, 10 jt, ...) covering `max`. */
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * magnitude).find((s) => s >= raw)!;
  const steps = Math.ceil(max / step);
  return Array.from({ length: steps + 1 }, (_, i) => i * step);
}

interface Props {
  points: DayPoint[]; // full period, already filtered by channel and product
  from: string;
  to: string;
  channels: Channel[];
  onSelect: (from: string, to: string) => void;
}

export function TrendChart({ points, from, to, channels, onSelect }: Props) {
  const plot = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [hover, setHover] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ start: number; end: number } | null>(null);

  const n = points.length;
  const ticks = niceTicks(Math.max(0, ...points.map((p) => p.total)));
  const top = ticks[ticks.length - 1];
  const inRange = (day: string) => (!from || day >= from) && (!to || day <= to);
  const hasRange = Boolean(from || to);
  const shown = CHANNELS.filter((c) => channels.includes(c));
  const average = movingAverage(points.map((p) => p.total), 7);
  const averageLine = average
    .map((v, i) => (v === null ? null : `${i + 0.5},${100 - (v / top) * 100}`))
    .filter(Boolean)
    .join(' ');
  const peak = points.reduce((best, p, i) => (p.total > points[best].total ? i : best), 0);

  const indexAt = (clientX: number) => {
    const rect = plot.current!.getBoundingClientRect();
    return Math.min(n - 1, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * n)));
  };

  function finishDrag() {
    if (!drag) return;
    const a = points[Math.min(drag.start, drag.end)].day;
    const b = points[Math.max(drag.start, drag.end)].day;
    setDrag(null);
    // Selecting exactly the current selection again clears it.
    if (a === from && b === to) onSelect('', '');
    else onSelect(a, b);
  }

  // Highlighted band: the drag in progress, otherwise the active date filter.
  let band: [number, number] | null = null;
  if (drag) band = [Math.min(drag.start, drag.end), Math.max(drag.start, drag.end)];
  else if (hasRange) {
    const idx = points.map((p, i) => (inRange(p.day) ? i : -1)).filter((i) => i >= 0);
    if (idx.length) band = [idx[0], idx[idx.length - 1]];
  }

  const hovered = hover !== null && !drag ? points[hover] : null;
  const align = hover === null ? '' : hover < n * 0.25 ? 'start' : hover > n * 0.75 ? 'end' : '';

  return (
    <section className="card trend-card">
      <div className="card-head">
        <div>
          <h2>Net revenue harian</h2>
          <p className="secondary small">Geser di grafik untuk memilih tanggal · klik satu batang untuk satu hari</p>
        </div>
        <div className="head-tools">
          <Legend active={channels} />
          <span className="legend-line">
            <span className="line-key ink" />
            Rata-rata 7 hari
          </span>
          <div className="segmented small-seg" role="group" aria-label="Tampilan">
            <button className={view === 'chart' ? 'active' : ''} aria-pressed={view === 'chart'} onClick={() => setView('chart')}>
              Grafik
            </button>
            <button className={view === 'table' ? 'active' : ''} aria-pressed={view === 'table'} onClick={() => setView('table')}>
              Tabel
            </button>
          </div>
        </div>
      </div>

      {view === 'chart' ? (
        <div className="trend">
          <div className="trend-y" aria-hidden>
            {ticks.map((t) => (
              <span key={t} style={{ bottom: `${(t / top) * 100}%` }}>
                {formatCompact(t)}
              </span>
            ))}
          </div>

          <div
            ref={plot}
            className={`trend-plot${drag ? ' dragging' : ''}`}
            role="img"
            aria-label="Grafik net revenue harian per channel. Angkanya tersedia di tampilan tabel."
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              const i = indexAt(e.clientX);
              setDrag({ start: i, end: i });
            }}
            onPointerMove={(e) => {
              const i = indexAt(e.clientX);
              setHover(i);
              if (drag && drag.end !== i) setDrag({ ...drag, end: i });
            }}
            onPointerUp={finishDrag}
            onPointerCancel={() => setDrag(null)}
            onPointerLeave={() => !drag && setHover(null)}
          >
            {ticks.map((t) => (
              <div key={t} className={`gridline${t === 0 ? ' base' : ''}`} style={{ bottom: `${(t / top) * 100}%` }} />
            ))}

            {band && (
              <div
                className={`band${drag ? ' live' : ''}`}
                style={{ left: `${(band[0] / n) * 100}%`, width: `${((band[1] - band[0] + 1) / n) * 100}%` }}
              >
                {drag && (
                  <span className="band-label">
                    {band[0] === band[1]
                      ? formatDay(points[band[0]].day)
                      : `${formatDay(points[band[0]].day)} – ${formatDay(points[band[1]].day)}`}
                  </span>
                )}
              </div>
            )}

            <div className="trend-cols" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
              {points.map((p, i) => {
                const dim = drag ? i < band![0] || i > band![1] : hasRange && !inRange(p.day);
                return (
                  <div key={p.day} className={`trend-col${dim ? ' dim' : ''}${hover === i && !drag ? ' hover' : ''}`}>
                    <div className="trend-stack" style={{ height: `${(p.total / top) * 100}%`, '--i': i } as CSSProperties}>
                      {shown.map((c) =>
                        p.byChannel[c] > 0 ? (
                          <div key={c} className="seg" style={{ flexGrow: p.byChannel[c], background: CHANNEL_COLOR[c] }} />
                        ) : null,
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {averageLine && (
              <svg className="trend-line" viewBox={`0 0 ${n} 100`} preserveAspectRatio="none" aria-hidden>
                <polyline className="halo" points={averageLine} vectorEffect="non-scaling-stroke" />
                <polyline points={averageLine} vectorEffect="non-scaling-stroke" />
              </svg>
            )}

            {n > 0 && points[peak].total > 0 && !drag && (
              <div className="peak" style={{ left: `${((peak + 0.5) / n) * 100}%`, bottom: `${(points[peak].total / top) * 100}%` }}>
                Tertinggi · {formatDay(points[peak].day)} · {formatCompact(points[peak].total)}
              </div>
            )}

            {hovered && (
              <div className={`tooltip ${align}`} style={{ left: `${((hover! + 0.5) / n) * 100}%` }}>
                <p className="tooltip-title">{formatDayLong(hovered.day)}</p>
                {shown.map((c) => (
                  <p key={c} className="tooltip-row">
                    <span className="line-key" style={{ background: CHANNEL_COLOR[c] }} />
                    <span className="tooltip-value">{formatRupiah(hovered.byChannel[c])}</span>
                    <span className="tooltip-label">{c}</span>
                  </p>
                ))}
                <p className="tooltip-row total">
                  <span className="line-key blank" />
                  <span className="tooltip-value">{formatRupiah(hovered.total)}</span>
                  <span className="tooltip-label">Total</span>
                </p>
                {average[hover!] !== null && (
                  <p className="tooltip-row">
                    <span className="line-key ink" />
                    <span className="tooltip-value">{formatRupiah(Math.round(average[hover!]!))}</span>
                    <span className="tooltip-label">Rata-rata 7 hari</span>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="trend-x" aria-hidden style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {points.map((p, i) => {
              const d = Number(p.day.slice(8));
              const major = i === 0 || d === 1 || d % 10 === 0;
              const minor = d % 5 === 0;
              return (
                <span key={p.day} className={major ? 'major' : minor ? 'minor' : ''}>
                  {major || minor ? (i === 0 || d === 1 ? `${d} ${monthName(p.day)}` : d) : ''}
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="scroll-area">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                {shown.map((c) => (
                  <th key={c} className="num">
                    {c}
                  </th>
                ))}
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {points
                .filter((p) => inRange(p.day))
                .map((p) => (
                  <tr key={p.day}>
                    <td>{formatDayLong(p.day)}</td>
                    {shown.map((c) => (
                      <td key={c} className="num">
                        {formatRupiah(p.byChannel[c])}
                      </td>
                    ))}
                    <td className="num strong">{formatRupiah(p.total)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
