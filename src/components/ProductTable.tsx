import { useState } from 'react';
import { formatNumber, formatRupiah } from '../lib/format';
import type { ProductSummary } from '../lib/metrics';

type SortKey = 'name' | 'units' | 'netRevenue';

interface Props {
  products: ProductSummary[];
  selected: string | null;
  onSelect: (key: string) => void;
}

export function ProductTable({ products, selected, onSelect }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'netRevenue', dir: -1 });
  const total = products.reduce((a, p) => a + p.netRevenue, 0);

  const rows = [...products].sort((a, b) => {
      const d = sort.key === 'name' ? a.name.localeCompare(b.name) : a[sort.key] - b[sort.key];
      return d * sort.dir || b.netRevenue - a.netRevenue;
    });

  const header = (key: SortKey, label: string, className = '') => {
    const active = sort.key === key;
    return (
      <th className={className} aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
        <button
          className={`sort${active ? ' active' : ''}`}
          onClick={() => setSort(active ? { key, dir: sort.dir === 1 ? -1 : 1 } : { key, dir: key === 'name' ? 1 : -1 })}
        >
          {label}
          <span aria-hidden>{active ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}</span>
        </button>
      </th>
    );
  };

  return (
    <section className="card fill-card">
      <div className="card-head">
        <div>
          <h2>Net revenue per produk</h2>
          <p className="secondary small">
            {products.length} produk · klik judul kolom untuk mengurutkan
          </p>
        </div>
      </div>
      <div className="scroll-area">
        <table>
          <thead>
            <tr>
              {header('name', 'Produk')}
              {header('units', 'Unit', 'num')}
              {header('netRevenue', 'Net revenue', 'num')}
              <th className="num hide-sm">Porsi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.key} className={selected === p.key ? 'selected' : ''}>
                <td>
                  <button className="row-link" onClick={() => onSelect(p.key)} aria-pressed={selected === p.key}>
                    {p.name}
                  </button>
                  <div className="secondary small">{p.sku || 'SKU tidak diketahui'}</div>
                </td>
                <td className="num">{formatNumber(p.units)}</td>
                <td className="num strong">{formatRupiah(p.netRevenue)}</td>
                <td className="num hide-sm">
                  <span className="share">
                    <span className="share-track">
                      <span style={{ width: `${total ? (p.netRevenue / total) * 100 : 0}%` }} />
                    </span>
                    {total ? ((p.netRevenue / total) * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 }) : 0}%
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="secondary">
                  Tidak ada produk yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
