import { formatNumber, formatRupiah } from '../lib/format';
import type { ProductSummary } from '../lib/metrics';

interface Props {
  title: string;
  products: ProductSummary[];
  total: number;
  ranked?: boolean;
}

export function ProductSection({ title, products, total, ranked = false }: Props) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {products.length === 0 ? (
        <p className="muted">Tidak ada penjualan pada periode ini.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {ranked && <th className="num">#</th>}
                <th>Produk</th>
                <th className="num">Unit</th>
                <th className="num">Net revenue</th>
                {!ranked && <th className="num hide-sm">Porsi</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.key}>
                  {ranked && <td className="num muted">{i + 1}</td>}
                  <td>
                    <div>{p.name}</div>
                    <div className="muted small">{p.sku || 'SKU tidak diketahui'}</div>
                  </td>
                  <td className="num">{formatNumber(p.units)}</td>
                  <td className="num strong">{formatRupiah(p.netRevenue)}</td>
                  {!ranked && <td className="num muted hide-sm">{total ? ((p.netRevenue / total) * 100).toFixed(1) : '0.0'}%</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
