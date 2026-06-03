import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatPrice, resolveImage } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();

  if (!isCartOpen) return null;

  const items = cart.items || [];

  const goToCheckout = () => {
    setIsCartOpen(false);
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  return (
    <>
      <div className="cart-overlay" onClick={() => setIsCartOpen(false)} />
      <div className="cart-drawer" data-testid="cart-drawer">
        <div className="cart-header">
          <h2 className="cart-title">
            <ShoppingBag size={18} />
            {t('cart_title')} {cartCount > 0 && <span className="cart-count-badge">({cartCount})</span>}
          </h2>
          <button className="icon-btn" onClick={() => setIsCartOpen(false)} data-testid="close-cart-btn">
            <X size={20} />
          </button>
        </div>

        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty" data-testid="cart-empty">
              <ShoppingBag size={48} strokeWidth={1} />
              <p>{t('cart_empty')}</p>
              <button className="btn-primary" onClick={() => setIsCartOpen(false)}>
                {t('cart_continue')}
              </button>
            </div>
          ) : (
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.item_id} className="cart-item" data-testid={`cart-item-${item.product_handle}`}>
                  <Link
                    to={`/products/${item.product_handle}`}
                    onClick={() => setIsCartOpen(false)}
                    className="cart-item-img-wrap"
                  >
                    {item.product_image && (
                      <img
                        src={resolveImage(item.product_image)}
                        alt={item.product_title}
                        className="cart-item-img"
                      />
                    )}
                  </Link>
                  <div className="cart-item-details">
                    <Link
                      to={`/products/${item.product_handle}`}
                      onClick={() => setIsCartOpen(false)}
                      className="cart-item-title"
                    >
                      {t(item.product_title)}
                    </Link>
                    {Object.entries(item.selected_variants || {}).length > 0 && (
                      <div className="cart-item-variants">
                        {Object.entries(item.selected_variants).map(([k, v]) => (
                          <span key={k}>{t(k)}: {t(v)}</span>
                        ))}
                      </div>
                    )}
                    <div className="cart-item-bottom">
                      <div className="qty-controls">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="cart-item-right">
                        <span className="cart-item-price">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          className="remove-btn"
                          onClick={() => removeFromCart(item.item_id)}
                          data-testid={`remove-${item.product_handle}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-subtotal">
              <span>{t('cart_subtotal')}</span>
              <span>{formatPrice(cart.subtotal || 0)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="cart-subtotal" style={{ color: '#a85a00' }}>
                <span>Discount{cart.coupon_code ? ` (${cart.coupon_code})` : ''}</span>
                <span>− {formatPrice(cart.discount)}</span>
              </div>
            )}
            <p className="cart-note">{t('cart_taxes_shipping')}</p>
            <button
              className="btn-primary cart-checkout-btn"
              onClick={goToCheckout}
              data-testid="proceed-checkout-btn"
            >
              {t('cart_checkout')}
            </button>
            <button
              className="btn-secondary cart-continue-btn"
              onClick={() => setIsCartOpen(false)}
            >
              {t('cart_continue')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
