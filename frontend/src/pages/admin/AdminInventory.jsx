import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { toast } from 'sonner';
import { resolveImage, formatPrice } from '../../utils/format';

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowOnly, setLowOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [edits, setEdits] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.getInventory({ low_stock_only: lowOnly, page, per_page: 30 });
      setItems(r.data.items || []);
      setPages(r.data.pages || 1);
      const e = {};
      (r.data.items || []).forEach(p => { e[p.id] = p.stock; });
      setEdits(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, lowOnly]);

  const save = async (id) => {
    const val = parseInt(edits[id], 10);
    if (isNaN(val) || val < 0) { toast.error('Invalid stock'); return; }
    try {
      await adminApi.updateStock(id, val);
      toast.success('Stock updated');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div data-testid="admin-inventory">
      <div className="admin-section-head">
        <h2>Inventory</h2>
        <label className="checkbox-row" style={{ margin: 0 }}>
          <input type="checkbox" checked={lowOnly} onChange={e => { setLowOnly(e.target.checked); setPage(1); }} />
          <span>Low stock only (&lt;10)</span>
        </label>
      </div>

      {loading ? <div className="admin-loading">Loading…</div> : (
        <>
          <table className="admin-table">
            <thead><tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id}>
                  <td>{p.images?.[0] && <img src={resolveImage(p.images[0])} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />}</td>
                  <td>{p.title}</td>
                  <td>{p.collection}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td>
                    <input
                      type="number"
                      className="auth-input"
                      style={{ width: 80, padding: '6px 8px' }}
                      value={edits[p.id] ?? p.stock}
                      onChange={e => setEdits(prev => ({ ...prev, [p.id]: e.target.value }))}
                      data-testid={`stock-${p.handle}`}
                    />
                  </td>
                  <td>
                    <button onClick={() => save(p.id)} className="btn-outline" data-testid={`save-stock-${p.handle}`}>Save</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: 32 }}>Nothing to show.</td></tr>
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
