import { useState } from 'react';
import { formatNumber, formatPercent, formatRupiah } from '../lib/format';
import type { ProductSummary } from '../lib/metrics';

type SortKey = 'name' | 'units' | 'netRevenue';

interface Sort {
  key: SortKey;
  direction: 1 | -1;
}

interface Props {
  products: ProductSummary[];
  selected: string | null;
  onSelect: (key: string) => void;
}

function compare(a: ProductSummary, b: ProductSummary, sort: Sort): number {
  const difference = sort.key === 'name' ? a.name.localeCompare(b.name) : a[sort.key] - b[sort.key];
  return difference * sort.direction || b.netRevenue - a.netRevenue;
}

export function ProductTable({ products, selected, onSelect }: Props) {
  const [sort, setSort] = useState<Sort>({ key: 'netRevenue', direction: -1 });
  const total = products.reduce((sum, product) => sum + product.netRevenue, 0);
  const rows = [...products].sort((a, b) => compare(a, b, sort));

  function header(key: SortKey, label: string, className = '') {
    const isActive = sort.key === key;
    const nextDirection = isActive ? (sort.direction === 1 ? -1 : 1) : key === 'name' ? 1 : -1;
    return (
      <th className={className} aria-sort={isActive ? (sort.direction === 1 ? 'ascending' : 'descending') : 'none'}>
        <button
          className={`sort${isActive ? ' active' : ''}`}
          onClick={() => setSort({ key, direction: nextDirection })}
        >
          {label}
          <span aria-hidden>{isActive ? (sort.direction === 1 ? ' ↑' : ' ↓') : ''}</span>
        </button>
      </th>
    );
  }

  return (
    <section className="card fill-card">
      <div className="card-head">
        <div>
          <h2>Net revenue per produk</h2>
          <p className="secondary small">{products.length} produk · klik judul kolom untuk mengurutkan</p>
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
            {rows.map((product) => (
              <tr key={product.key} className={selected === product.key ? 'selected' : ''}>
                <td>
                  <button
                    className="row-link"
                    onClick={() => onSelect(product.key)}
                    aria-pressed={selected === product.key}
                  >
                    {product.name}
                  </button>
                  <div className="secondary small">{product.sku || 'SKU tidak diketahui'}</div>
                </td>
                <td className="num">{formatNumber(product.units)}</td>
                <td className="num strong">{formatRupiah(product.netRevenue)}</td>
                <td className="num hide-sm">
                  <span className="share">
                    <span className="share-track">
                      <span style={{ width: `${total ? (product.netRevenue / total) * 100 : 0}%` }} />
                    </span>
                    {formatPercent(product.netRevenue, total)}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="secondary">
                  Tidak ada penjualan pada filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
