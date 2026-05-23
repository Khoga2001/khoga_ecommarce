import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersApi } from '../api';
import { CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../utils/format';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.get(id).then(r => setOrder(r.data)).catch(() => setOrder(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="account-page"><p>Loading…</p></main>;
  if (!order) return <main className="account-page"><p>Order not found</p></main>;

  return (
    <main className="confirmation-page" data-testid="order-confirmation-page">
      <div className="confirmation-card">
        <CheckCircle2 size={64} color="#0a6e3d" />
        <h1>Thank you for your order!</h1>
        <p className="confirmation-sub">Your order has been received and is being processed.</p>
        <div className="confirmation-num" data-testid="confirmation-order-number">
          Order <strong>#{order.order_number}</strong>
        </div>
        <p className="confirmation-total">{formatPrice(order.total)} · {order.items.length} item{order.items.length === 1 ? '' : 's'}</p>
        <p className="confirmation-shipping">
          Shipping to: {order.shipping_address.full_name}, {order.shipping_address.city}, {order.shipping_address.governorate}
        </p>
        <p style={{ marginTop: 8, fontSize: 14, color: '#6b6b6b' }}>
          You'll be contacted by our team to confirm delivery. Payment: Cash on Delivery.
        </p>
        <div className="confirmation-actions">
          <Link to={`/account/orders/${order.id}`} className="btn-primary" data-testid="view-order-btn">View Order</Link>
          <Link to="/" className="btn-outline">Continue Shopping</Link>
        </div>
      </div>
    </main>
  );
}
