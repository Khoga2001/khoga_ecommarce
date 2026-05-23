import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../api';
import { formatPrice } from '../utils/format';

const statusColors = {
  pending: '#a0760a',
  confirmed: '#1b6df0',
  processing: '#7b3fb8',
  shipped: '#0f8f4d',
  delivered: '#0a6e3d',
  cancelled: '#c43838',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list({ per_page: 50 })
      .then(r => setOrders(r.data.items || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="account-page" data-testid="orders-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/account">My Account</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Orders</span>
      </div>
      <h1 className="account-title">My Orders</h1>

      {loading ? (
        <p style={{ color: '#6b6b6b' }}>Loading…</p>
      ) : orders.length === 0 ? (
        <div className="empty-collection">
          <p>No orders yet.</p>
          <Link to="/" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(o => (
            <Link key={o.id} to={`/account/orders/${o.id}`} className="order-card" data-testid={`order-${o.order_number}`}>
              <div className="order-card-head">
                <div>
                  <span className="order-num">#{o.order_number}</span>
                  <span className="order-date">{new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <span className="order-status" style={{ background: statusColors[o.status] || '#666' }}>{o.status}</span>
              </div>
              <div className="order-card-body">
                <span>{o.items?.length || 0} item{(o.items?.length || 0) === 1 ? '' : 's'}</span>
                <strong>{formatPrice(o.total)}</strong>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
