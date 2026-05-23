import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { formatPrice } from '../../utils/format';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Loading dashboard…</div>;
  if (!data) return <div className="admin-loading">Failed to load.</div>;

  const { stats, recent_orders, top_products, low_stock_products, order_statuses, daily_sales } = data;
  const maxRev = Math.max(...(daily_sales || []).map(d => d.revenue || 0), 1);

  return (
    <div className="admin-dashboard" data-testid="admin-dashboard">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#fff3e0', color: '#a85a00' }}><TrendingUp size={20} /></div>
          <div>
            <p className="kpi-label">Total Revenue</p>
            <p className="kpi-value">{formatPrice(stats.total_revenue)}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#e8f4ff', color: '#1b6df0' }}><ShoppingCart size={20} /></div>
          <div>
            <p className="kpi-label">Total Orders</p>
            <p className="kpi-value">{stats.total_orders}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#e8f8ee', color: '#0a6e3d' }}><Users size={20} /></div>
          <div>
            <p className="kpi-label">Customers</p>
            <p className="kpi-value">{stats.total_users}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#f4eaff', color: '#7b3fb8' }}><Package size={20} /></div>
          <div>
            <p className="kpi-label">Products</p>
            <p className="kpi-value">{stats.total_products}</p>
          </div>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi-mini">
          <p>This Month Revenue</p>
          <strong>{formatPrice(stats.month_revenue)}</strong>
          <span style={{ color: stats.revenue_change_pct >= 0 ? '#0a6e3d' : '#c43838' }}>
            {stats.revenue_change_pct >= 0 ? '↑' : '↓'} {Math.abs(stats.revenue_change_pct)}% vs last month
          </span>
        </div>
        <div className="kpi-mini">
          <p>This Month Orders</p>
          <strong>{stats.month_orders}</strong>
        </div>
        <div className="kpi-mini">
          <p>Categories</p>
          <strong>{stats.total_categories}</strong>
        </div>
      </div>

      <div className="admin-section-grid">
        <section className="admin-section">
          <h3>Sales (Last 7 Days)</h3>
          <div className="sparkline">
            {(daily_sales || []).map((d, i) => (
              <div key={i} className="spark-col">
                <div className="spark-bar" style={{ height: `${(d.revenue / maxRev) * 100}%` }} title={`${d.date}: ${formatPrice(d.revenue)}`} />
                <span className="spark-label">{d.date}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-section">
          <h3>Order Status Breakdown</h3>
          <ul className="status-breakdown">
            {Object.entries(order_statuses || {}).map(([k, v]) => (
              <li key={k}>
                <span className={`status-pill status-${k}`}>{k}</span>
                <strong>{v}</strong>
              </li>
            ))}
            {Object.keys(order_statuses || {}).length === 0 && <li style={{ color: '#999' }}>No orders yet</li>}
          </ul>
        </section>
      </div>

      <div className="admin-section-grid">
        <section className="admin-section">
          <h3>Recent Orders</h3>
          <table className="admin-table">
            <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {(recent_orders || []).map(o => (
                <tr key={o.id}>
                  <td><Link to="/admin/orders">{o.order_number}</Link></td>
                  <td>{o.user_name}</td>
                  <td>{formatPrice(o.total)}</td>
                  <td><span className={`status-pill status-${o.status}`}>{o.status}</span></td>
                </tr>
              ))}
              {(!recent_orders || recent_orders.length === 0) && (
                <tr><td colSpan={4} style={{ color: '#999', textAlign: 'center' }}>No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="admin-section">
          <h3>Top Products</h3>
          <table className="admin-table">
            <thead><tr><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {(top_products || []).map(p => (
                <tr key={p._id}>
                  <td>{p.title}</td>
                  <td>{p.total_sold}</td>
                  <td>{formatPrice(p.revenue)}</td>
                </tr>
              ))}
              {(!top_products || top_products.length === 0) && (
                <tr><td colSpan={3} style={{ color: '#999', textAlign: 'center' }}>Nothing sold yet</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {(low_stock_products || []).length > 0 && (
        <section className="admin-section">
          <h3>Low Stock Alerts</h3>
          <table className="admin-table">
            <thead><tr><th>Product</th><th>Stock</th><th>Category</th></tr></thead>
            <tbody>
              {low_stock_products.map(p => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td><span style={{ color: '#c43838', fontWeight: 600 }}>{p.stock}</span></td>
                  <td>{p.collection}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
