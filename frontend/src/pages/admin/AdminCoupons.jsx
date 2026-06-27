import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { toast } from 'sonner';
import { Plus, Trash2, X } from 'lucide-react';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '', description: '', discount_type: 'percentage', discount_value: 10,
    min_order_amount: 0, max_uses: '', expires_at: '',
  });

  const load = () => {
    setLoading(true);
    adminApi.listCoupons().then(r => setCoupons(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        description: form.description,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      };
      await adminApi.createCoupon(payload);
      toast.success('Coupon created');
      setShowForm(false);
      setForm({ code: '', description: '', discount_type: 'percentage', discount_value: 10, min_order_amount: 0, max_uses: '', expires_at: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Create failed');
    }
  };

  const onToggle = async (c) => {
    try {
      await adminApi.updateCoupon(c.id, { is_active: !c.is_active });
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const onDelete = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try {
      await adminApi.deleteCoupon(c.id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div data-testid="admin-coupons">
      <div className="admin-section-head">
        <h2>Coupons</h2>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)} data-testid="new-coupon-btn">
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <div className="admin-section-head" style={{ marginBottom: 12 }}>
            <h3>New Coupon</h3>
            <button onClick={() => setShowForm(false)} className="icon-action"><X size={14} /></button>
          </div>
          <form onSubmit={onCreate} className="form-grid">
            <label className="auth-label">Code
              <input className="auth-input" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} data-testid="coupon-code" />
            </label>
            <label className="auth-label">Description
              <input className="auth-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </label>
            <label className="auth-label">Type
              <select className="auth-input" value={form.discount_type} onChange={e => setForm(p => ({ ...p, discount_type: e.target.value }))}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount (EGP)</option>
              </select>
            </label>
            <label className="auth-label">Value
              <input className="auth-input" type="number" step="0.01" required value={form.discount_value} onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))} data-testid="coupon-value" />
            </label>
            <label className="auth-label">Min Order Amount
              <input className="auth-input" type="number" step="0.01" value={form.min_order_amount} onChange={e => setForm(p => ({ ...p, min_order_amount: e.target.value }))} />
            </label>
            <label className="auth-label">Max Uses (blank = unlimited)
              <input className="auth-input" type="number" value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))} />
            </label>
            <label className="auth-label">Expires At (optional)
              <input className="auth-input" type="datetime-local" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))} />
            </label>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn-primary" data-testid="save-coupon-btn">Create Coupon</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="admin-loading">Loading…</div> : (
        <table className="admin-table">
          <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id} data-testid={`coupon-${c.code}`}>
                <td><strong>{c.code}</strong>{c.description && <div style={{ fontSize: 12, color: '#999' }}>{c.description}</div>}</td>
                <td>{c.discount_type}</td>
                <td>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `LE ${c.discount_value}`}</td>
                <td>LE {c.min_order_amount}</td>
                <td>{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                <td>
                  <button onClick={() => onToggle(c)} className={`status-pill ${c.is_active ? 'status-confirmed' : 'status-cancelled'}`} style={{ border: 0, cursor: 'pointer' }}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td>
                  <button onClick={() => onDelete(c)} className="icon-action danger" data-testid={`delete-coupon-${c.code}`}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: 32 }}>No coupons. Create one!</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
