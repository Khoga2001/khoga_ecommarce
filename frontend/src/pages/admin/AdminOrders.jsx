import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { formatPrice } from '../../utils/format';
import { toast } from 'sonner';
import { Search, X } from 'lucide-react';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const r = await adminApi.listOrders(params);
      setOrders(r.data.items || []);
      setPages(r.data.pages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, statusFilter]);

  const onSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const updateStatus = async (order, status) => {
    try {
      const r = await adminApi.updateOrderStatus(order.id, status);
      toast.success(`Order ${order.order_number} → ${status}`);
      setOrders(prev => prev.map(o => o.id === order.id ? r.data : o));
      if (selected?.id === order.id) setSelected(r.data);
    } catch (err) {
      toast.error('Update failed');
    }
  };

  return (
    <div data-testid="admin-orders">
      <div className="admin-section-head"><h2>Orders</h2></div>

      <form onSubmit={onSearch} className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input placeholder="Search by order #, email, name…" value={search} onChange={e => setSearch(e.target.value)} data-testid="order-search" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="auth-input" style={{ maxWidth: 200 }} data-testid="order-status-filter">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="btn-outline">Search</button>
      </form>

      {loading ? <div className="admin-loading">Loading…</div> : (
        <>
          <table className="admin-table">
            <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} data-testid={`admin-order-${o.order_number}`}>
                  <td><strong>#{o.order_number}</strong></td>
                  <td>{o.user_name}<br /><span style={{ fontSize: 12, color: '#999' }}>{o.user_email}</span></td>
                  <td>{new Date(o.created_at).toLocaleDateString('en-GB')}</td>
                  <td>{o.items?.length || 0}</td>
                  <td>{formatPrice(o.total)}</td>
                  <td>
                    <select value={o.status} onChange={e => updateStatus(o, e.target.value)} className={`status-select status-${o.status}`}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><button onClick={() => setSelected(o)} className="btn-outline">View</button></td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: 32 }}>No orders.</td></tr>
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

      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-section-head">
              <h3>Order #{selected.order_number}</h3>
              <button onClick={() => setSelected(null)} className="icon-action"><X size={14} /></button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <strong>Customer:</strong> {selected.user_name} · {selected.user_email}
              </div>
              <div>
                <strong>Status:</strong> <span className={`status-pill status-${selected.status}`}>{selected.status}</span>
              </div>
              <div>
                <strong>Shipping:</strong><br />
                {selected.shipping_address.full_name}<br />
                {selected.shipping_address.phone}<br />
                {selected.shipping_address.address_line1}<br />
                {selected.shipping_address.city}, {selected.shipping_address.governorate}, {selected.shipping_address.country}
              </div>
              <table className="admin-table" style={{ marginTop: 12 }}>
                <thead><tr><th>Product</th><th>Qty</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {selected.items.map((it, i) => (
                    <tr key={i}>
                      <td>{it.product_title}</td>
                      <td>{it.quantity}</td>
                      <td>{formatPrice(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'right' }}>
                <div>Subtotal: {formatPrice(selected.subtotal)}</div>
                <div>Shipping: {selected.shipping_cost > 0 ? formatPrice(selected.shipping_cost) : 'Free'}</div>
                {selected.discount > 0 && <div>Discount: − {formatPrice(selected.discount)}</div>}
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 8 }}>Total: {formatPrice(selected.total)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
