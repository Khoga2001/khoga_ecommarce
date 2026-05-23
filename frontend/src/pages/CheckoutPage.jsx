import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../api';
import { formatPrice, resolveImage } from '../utils/format';
import { toast } from 'sonner';

const GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Sharqia', 'Dakahlia', 'Beheira',
  'Gharbia', 'Monufia', 'Kafr El Sheikh', 'Damietta', 'Port Said', 'Ismailia',
  'Suez', 'North Sinai', 'South Sinai', 'Red Sea', 'Beni Suef', 'Fayoum',
  'Minya', 'Asyut', 'Sohag', 'Qena', 'Luxor', 'Aswan', 'Matruh', 'New Valley',
];

export default function CheckoutPage() {
  const { cart, fetchCart, applyCoupon, removeCoupon } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const items = cart.items || [];
  const [submitting, setSubmitting] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.name || '',
    phone: user?.phone || '',
    address_line1: '',
    address_line2: '',
    city: '',
    governorate: 'Cairo',
    country: 'Egypt',
    postal_code: '',
    notes: '',
    payment_method: 'cash_on_delivery',
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const onApplyCoupon = async (e) => {
    e.preventDefault();
    if (!coupon.trim()) return;
    setApplyingCoupon(true);
    const r = await applyCoupon(coupon.trim());
    setApplyingCoupon(false);
    if (r.success) toast.success(r.message || 'Coupon applied');
    else toast.error(r.error);
  };

  const onRemoveCoupon = async () => {
    await removeCoupon();
    setCoupon('');
    toast.success('Coupon removed');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setSubmitting(true);
    try {
      const res = await ordersApi.place({
        shipping_address: {
          full_name: form.full_name,
          phone: form.phone,
          address_line1: form.address_line1,
          address_line2: form.address_line2 || null,
          city: form.city,
          governorate: form.governorate,
          country: form.country,
          postal_code: form.postal_code || null,
        },
        payment_method: form.payment_method,
        notes: form.notes || null,
      });
      await fetchCart();
      toast.success('Order placed!');
      navigate(`/order-confirmation/${res.data.id}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="checkout-page" data-testid="checkout-empty">
        <div className="empty-collection">
          <h2>Your cart is empty</h2>
          <Link to="/" className="btn-primary">Continue Shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page" data-testid="checkout-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Checkout</span>
      </div>
      <h1 className="account-title">Checkout</h1>

      <form className="checkout-grid" onSubmit={onSubmit}>
        <div className="checkout-form-box">
          <h3>Shipping Information</h3>
          <div className="form-grid">
            <label className="auth-label">Full Name
              <input className="auth-input" required value={form.full_name} onChange={e => update('full_name', e.target.value)} data-testid="checkout-name" />
            </label>
            <label className="auth-label">Phone
              <input className="auth-input" required value={form.phone} onChange={e => update('phone', e.target.value)} data-testid="checkout-phone" />
            </label>
            <label className="auth-label" style={{ gridColumn: '1 / -1' }}>Address Line 1
              <input className="auth-input" required value={form.address_line1} onChange={e => update('address_line1', e.target.value)} data-testid="checkout-address1" />
            </label>
            <label className="auth-label" style={{ gridColumn: '1 / -1' }}>Address Line 2 (optional)
              <input className="auth-input" value={form.address_line2} onChange={e => update('address_line2', e.target.value)} />
            </label>
            <label className="auth-label">City
              <input className="auth-input" required value={form.city} onChange={e => update('city', e.target.value)} data-testid="checkout-city" />
            </label>
            <label className="auth-label">Governorate
              <select className="auth-input" value={form.governorate} onChange={e => update('governorate', e.target.value)} data-testid="checkout-gov">
                {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label className="auth-label">Country
              <input className="auth-input" required value={form.country} onChange={e => update('country', e.target.value)} />
            </label>
            <label className="auth-label">Postal Code
              <input className="auth-input" value={form.postal_code} onChange={e => update('postal_code', e.target.value)} />
            </label>
            <label className="auth-label" style={{ gridColumn: '1 / -1' }}>Order Notes (optional)
              <textarea className="auth-input" rows={3} value={form.notes} onChange={e => update('notes', e.target.value)} />
            </label>
          </div>

          <h3 style={{ marginTop: 32 }}>Payment</h3>
          <label className="payment-option">
            <input type="radio" name="payment" value="cash_on_delivery" checked={form.payment_method === 'cash_on_delivery'} onChange={() => update('payment_method', 'cash_on_delivery')} />
            <span><strong>Cash on Delivery</strong> — Pay when your order arrives</span>
          </label>
        </div>

        <aside className="checkout-summary">
          <h3>Order Summary</h3>
          <div className="checkout-items">
            {items.map(it => (
              <div key={it.item_id} className="checkout-item">
                {it.product_image && <img src={resolveImage(it.product_image)} alt={it.product_title} />}
                <div>
                  <p className="checkout-item-title">{it.product_title}</p>
                  <p className="checkout-item-meta">Qty: {it.quantity}</p>
                  {Object.entries(it.selected_variants || {}).map(([k, v]) => (
                    <p key={k} className="checkout-item-meta">{k}: {v}</p>
                  ))}
                </div>
                <span className="checkout-item-price">{formatPrice(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="checkout-coupon">
            {cart.coupon_code ? (
              <div className="coupon-applied">
                <span>Coupon: <strong>{cart.coupon_code}</strong></span>
                <button type="button" onClick={onRemoveCoupon} className="link-btn">Remove</button>
              </div>
            ) : (
              <div className="coupon-input-row">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={coupon}
                  onChange={e => setCoupon(e.target.value.toUpperCase())}
                  className="auth-input"
                  data-testid="coupon-input"
                />
                <button type="button" className="btn-outline" onClick={onApplyCoupon} disabled={applyingCoupon} data-testid="apply-coupon-btn">
                  {applyingCoupon ? '…' : 'Apply'}
                </button>
              </div>
            )}
          </div>

          <div className="checkout-totals">
            <div className="order-sum-row"><span>Subtotal</span><span>{formatPrice(cart.subtotal || 0)}</span></div>
            <div className="order-sum-row"><span>Shipping</span><span>{(cart.shipping_cost || 0) > 0 ? formatPrice(cart.shipping_cost) : 'Free'}</span></div>
            {cart.discount > 0 && (
              <div className="order-sum-row" style={{ color: '#a85a00' }}><span>Discount</span><span>− {formatPrice(cart.discount)}</span></div>
            )}
            <div className="order-sum-row order-total"><span>Total</span><span>{formatPrice(cart.total || 0)}</span></div>
          </div>

          <button type="submit" className="btn-primary checkout-submit" disabled={submitting} data-testid="place-order-btn">
            {submitting ? 'Placing order…' : 'Place Order'}
          </button>
        </aside>
      </form>
    </main>
  );
}
