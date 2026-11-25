import { endOfMonth, monthName } from '../lib/format';

interface Props {
  from: string;
  to: string;
  min: string;
  max: string;
  invalid: boolean;
  onChange: (from: string, to: string) => void;
}

export function DateFilter({ from, to, min, max, invalid, onChange }: Props) {
  const month = min.slice(0, 7); // presets use the first month in the data
  const presets = [
    { label: 'Semua tanggal', from: '', to: '' },
    { label: `1–15 ${monthName(min)}`, from: `${month}-01`, to: `${month}-15` },
    { label: `16–${endOfMonth(min).slice(8)} ${monthName(min)}`, from: `${month}-16`, to: endOfMonth(min) },
  ];

  return (
    <section className="card filter">
      <div className="filter-fields">
        <label>
          Dari tanggal
          <input type="date" value={from} min={min} max={max} onChange={(e) => onChange(e.target.value, to)} />
        </label>
        <label>
          Sampai tanggal
          <input type="date" value={to} min={min} max={max} onChange={(e) => onChange(from, e.target.value)} />
        </label>
      </div>
      <div className="presets">
        {presets.map((p) => (
          <button
            key={p.label}
            className={`pill${p.from === from && p.to === to ? ' active' : ''}`}
            onClick={() => onChange(p.from, p.to)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {invalid && <p className="alert inline">Tanggal awal tidak boleh setelah tanggal akhir.</p>}
      <p className="muted small">Kedua tanggal ikut dihitung (misalnya 1–15 berarti sampai 15 pukul 23.59).</p>
    </section>
  );
}
