import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersApi } from '../api';
import { formatPrice, resolveImage } from '../utils/format';
import { toast } from 'sonner';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    ordersApi.get(id)
      .then(r => setOrder(r.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const onCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      await ordersApi.cancel(id);
      toast.success('Order cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <main className="account-page"><p>Loading…</p></main>;
  if (!order) return <main className="account-page"><p>Order not found.</p></main>;

  const canCancel = !['shipped', 'delivered', 'cancelled'].includes(order.status);

  return (
    <main className="account-page" data-testid="order-detail-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/account/orders">Orders</Link>
        <span className="breadcrumb-sep">/</span>
        <span>#{order.order_number}</span>
      </div>

      <div className="order-detail-head">
        <h1 className="account-title">Order #{order.order_number}</h1>
        <span className={`order-status status-${order.status}`}>{order.status}</span>
      </div>
      <p style={{ color: '#6b6b6b', marginTop: 4 }}>
        Placed {new Date(order.created_at).toLocaleString('en-GB')}
      </p>

      <div className="order-detail-grid">
        <div className="order-items-box">
          <h3>Items</h3>
          {(order.items || []).map((it, i) => (
            <div key={i} className="order-item-row">
              {it.product_image && <img src={resolveImage(it.product_image)} alt={it.product_title} />}
              <div className="order-item-info">
                <Link to={`/products/${it.product_handle}`}>{it.product_title}</Link>
                {Object.entries(it.selected_variants || {}).length > 0 && (
                  <div className="order-item-variants">
                    {Object.entries(it.selected_variants).map(([k, v]) => (
                      <span key={k}>{k}: {v}</span>
                    ))}
                  </div>
                )}
                <div className="order-item-meta">
                  <span>Qty: {it.quantity}</span>
                  <span>{formatPrice(it.subtotal)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="order-side">
          <div className="order-summary-box">
            <h3>Summary</h3>
            <div className="order-sum-row"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="order-sum-row"><span>Shipping</span><span>{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : 'Free'}</span></div>
            {order.discount > 0 && (
              <div className="order-sum-row" style={{ color: '#a85a00' }}><span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span><span>− {formatPrice(order.discount)}</span></div>
            )}
            <div className="order-sum-row order-total"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>

          <div className="order-summary-box">
            <h3>Shipping</h3>
            <p>{order.shipping_address.full_name}</p>
            <p>{order.shipping_address.phone}</p>
            <p>{order.shipping_address.address_line1}</p>
            {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
            <p>{order.shipping_address.city}, {order.shipping_address.governorate}</p>
            <p>{order.shipping_address.country}</p>
          </div>

          <div className="order-summary-box">
            <h3>Payment</h3>
            <p>Method: {order.payment_method.replace(/_/g, ' ')}</p>
            <p>Status: {order.payment_status}</p>
          </div>

          {canCancel && (
            <button className="btn-outline" onClick={onCancel} disabled={cancelling} data-testid="cancel-order-btn">
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
