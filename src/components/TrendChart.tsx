import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { formatCompact, formatDay, formatDayLong, formatRupiah, monthName } from '../lib/format';
import { movingAverage } from '../lib/metrics';
import type { DayPoint } from '../lib/metrics';
import { CHANNELS } from '../lib/types';
import type { Channel } from '../lib/types';
import { CHANNEL_COLOR, Legend } from './ChannelColor';

type Range = [start: number, end: number];

interface Props {
  points: DayPoint[];
  from: string;
  to: string;
  channels: Channel[];
  onSelect: (from: string, to: string) => void;
}

function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * magnitude).find((s) => s >= raw)!;
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}

function axisLabel(point: DayPoint, index: number): { text: string | number; className: string } {
  const date = Number(point.day.slice(8));
  if (index === 0 || date === 1) return { text: `${date} ${monthName(point.day)}`, className: 'major' };
  if (date % 10 === 0) return { text: date, className: 'major' };
  if (date % 5 === 0) return { text: date, className: 'minor' };
  return { text: '', className: '' };
}

function DayTooltip({
  point,
  average,
  channels,
  align,
  left,
}: {
  point: DayPoint;
  average: number | null;
  channels: Channel[];
  align: string;
  left: string;
}) {
  return (
    <div className={`tooltip ${align}`} style={{ left }}>
      <p className="tooltip-title">{formatDayLong(point.day)}</p>
      {channels.map((channel) => (
        <p key={channel} className="tooltip-row">
          <span className="line-key" style={{ background: CHANNEL_COLOR[channel] }} />
          <span className="tooltip-value">{formatRupiah(point.byChannel[channel])}</span>
          <span className="tooltip-label">{channel}</span>
        </p>
      ))}
      <p className="tooltip-row total">
        <span className="line-key blank" />
        <span className="tooltip-value">{formatRupiah(point.total)}</span>
        <span className="tooltip-label">Total</span>
      </p>
      {average !== null && (
        <p className="tooltip-row">
          <span className="line-key ink" />
          <span className="tooltip-value">{formatRupiah(Math.round(average))}</span>
          <span className="tooltip-label">Rata-rata 7 hari</span>
        </p>
      )}
    </div>
  );
}

function DailyTable({ points, channels }: { points: DayPoint[]; channels: Channel[] }) {
  return (
    <div className="scroll-area">
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            {channels.map((channel) => (
              <th key={channel} className="num">
                {channel}
              </th>
            ))}
            <th className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.day}>
              <td>{formatDayLong(point.day)}</td>
              {channels.map((channel) => (
                <td key={channel} className="num">
                  {formatRupiah(point.byChannel[channel])}
                </td>
              ))}
              <td className="num strong">{formatRupiah(point.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TrendChart({ points, from, to, channels, onSelect }: Props) {
  const plot = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [hover, setHover] = useState<number | null>(null);
  const [drag, setDrag] = useState<Range | null>(null);

  const count = points.length;
  const ticks = niceTicks(Math.max(0, ...points.map((point) => point.total)));
  const top = ticks[ticks.length - 1];
  const shown = CHANNELS.filter((channel) => channels.includes(channel));
  const inRange = (day: string) => (!from || day >= from) && (!to || day <= to);
  const percentX = (index: number) => `${((index + 0.5) / count) * 100}%`;
  const percentY = (value: number) => `${(value / top) * 100}%`;

  const average = movingAverage(points.map((point) => point.total));
  const averageLine = average
    .map((value, i) => (value === null ? null : `${i + 0.5},${100 - (value / top) * 100}`))
    .filter(Boolean)
    .join(' ');
  const peak = points.reduce((best, point, i) => (point.total > points[best].total ? i : best), 0);

  const selectedIndexes = points.flatMap((point, i) => (inRange(point.day) ? [i] : []));
  const filterBand: Range | null =
    from || to ? [selectedIndexes[0], selectedIndexes[selectedIndexes.length - 1]] : null;
  const dragBand: Range | null = drag && [Math.min(...drag), Math.max(...drag)];
  const band = dragBand ?? (filterBand && filterBand[0] !== undefined ? filterBand : null);

  const isDimmed = (index: number) => (band ? index < band[0] || index > band[1] : false);
  const hovered = hover !== null && !drag ? points[hover] : null;
  const tooltipAlign = hover === null ? '' : hover < count * 0.25 ? 'start' : hover > count * 0.75 ? 'end' : '';

  function indexAt(clientX: number): number {
    const rect = plot.current!.getBoundingClientRect();
    return Math.min(count - 1, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * count)));
  }

  function finishDrag() {
    if (!dragBand) return;
    const start = points[dragBand[0]].day;
    const end = points[dragBand[1]].day;
    setDrag(null);
    if (start === from && end === to) onSelect('', '');
    else onSelect(start, end);
  }

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
            {(['chart', 'table'] as const).map((option) => (
              <button
                key={option}
                className={view === option ? 'active' : ''}
                aria-pressed={view === option}
                onClick={() => setView(option)}
              >
                {option === 'chart' ? 'Grafik' : 'Tabel'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'table' ? (
        <DailyTable points={points.filter((point) => inRange(point.day))} channels={shown} />
      ) : (
        <div className="trend">
          <div className="trend-y" aria-hidden>
            {ticks.map((tick) => (
              <span key={tick} style={{ bottom: percentY(tick) }}>
                {formatCompact(tick)}
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
              const index = indexAt(e.clientX);
              setDrag([index, index]);
            }}
            onPointerMove={(e) => {
              const index = indexAt(e.clientX);
              setHover(index);
              if (drag && drag[1] !== index) setDrag([drag[0], index]);
            }}
            onPointerUp={finishDrag}
            onPointerCancel={() => setDrag(null)}
            onPointerLeave={() => !drag && setHover(null)}
          >
            {ticks.map((tick) => (
              <div key={tick} className={`gridline${tick === 0 ? ' base' : ''}`} style={{ bottom: percentY(tick) }} />
            ))}

            {band && (
              <div
                className={`band${drag ? ' live' : ''}`}
                style={{ left: `${(band[0] / count) * 100}%`, width: `${((band[1] - band[0] + 1) / count) * 100}%` }}
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

            <div className="trend-cols" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
              {points.map((point, i) => (
                <div
                  key={point.day}
                  className={`trend-col${isDimmed(i) ? ' dim' : ''}${hover === i && !drag ? ' hover' : ''}`}
                >
                  <div className="trend-stack" style={{ height: percentY(point.total), '--i': i } as CSSProperties}>
                    {shown
                      .filter((channel) => point.byChannel[channel] > 0)
                      .map((channel) => (
                        <div
                          key={channel}
                          className="seg"
                          style={{ flexGrow: point.byChannel[channel], background: CHANNEL_COLOR[channel] }}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {averageLine && (
              <svg className="trend-line" viewBox={`0 0 ${count} 100`} preserveAspectRatio="none" aria-hidden>
                <polyline className="halo" points={averageLine} vectorEffect="non-scaling-stroke" />
                <polyline points={averageLine} vectorEffect="non-scaling-stroke" />
              </svg>
            )}

            {count > 0 && points[peak].total > 0 && !drag && (
              <div className="peak" style={{ left: percentX(peak), bottom: percentY(points[peak].total) }}>
                Tertinggi · {formatDay(points[peak].day)} · {formatCompact(points[peak].total)}
              </div>
            )}

            {hovered && (
              <DayTooltip
                point={hovered}
                average={average[hover!]}
                channels={shown}
                align={tooltipAlign}
                left={percentX(hover!)}
              />
            )}
          </div>

          <div className="trend-x" aria-hidden style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
            {points.map((point, i) => {
              const label = axisLabel(point, i);
              return (
                <span key={point.day} className={label.className}>
                  {label.text}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
