import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../../api';
import { formatPrice, resolveImage } from '../../utils/format';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const perPage = 20;

  const load = async () => {
    setLoading(true);
    try {
      const r = await productsApi.list({ search: search || undefined, page, per_page: perPage });
      setProducts(r.data.items || []);
      setPages(r.data.pages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  const onSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const onDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await productsApi.delete(id);
      toast.success('Product deleted');
      load();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div data-testid="admin-products">
      <div className="admin-section-head">
        <h2>Products</h2>
        <Link to="/admin/products/new" className="btn-primary" data-testid="new-product-btn">
          <Plus size={16} /> New Product
        </Link>
      </div>

      <form onSubmit={onSearch} className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="product-search"
          />
        </div>
        <button type="submit" className="btn-outline">Search</button>
      </form>

      {loading ? (
        <div className="admin-loading">Loading…</div>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} data-testid={`admin-product-${p.handle}`}>
                  <td>
                    {p.images?.[0] && <img src={resolveImage(p.images[0])} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />}
                  </td>
                  <td><Link to={`/admin/products/${p.id}`} style={{ color: '#1a1a1a', fontWeight: 500 }}>{p.title}</Link></td>
                  <td>{p.collection}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td>
                    <span style={{ color: p.stock < 10 ? '#c43838' : '#1a1a1a' }}>{p.stock}</span>
                  </td>
                  <td>
                    <span className={`status-pill ${p.is_active ? 'status-confirmed' : 'status-cancelled'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link to={`/admin/products/${p.id}`} className="icon-action" data-testid={`edit-${p.handle}`}>
                        <Edit size={14} />
                      </Link>
                      <button onClick={() => onDelete(p.id, p.title)} className="icon-action danger" data-testid={`delete-${p.handle}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: 32 }}>No products found.</td></tr>
              )}
            </tbody>
          </table>

          {pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-outline">Prev</button>
              <span>Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="btn-outline">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
