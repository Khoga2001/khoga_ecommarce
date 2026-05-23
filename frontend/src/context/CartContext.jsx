import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cartApi } from '../api';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], subtotal: 0, discount: 0, shipping_cost: 0, total: 0, coupon_code: null });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const res = await cartApi.get();
      setCart(res.data);
    } catch (err) {
      // Guest cart or network error — keep empty
    }
  }, []);

  // Load cart from server on mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (product, quantity = 1, selectedVariants = {}) => {
    setCartLoading(true);
    try {
      const res = await cartApi.addItem({
        product_id: product.id,
        quantity,
        selected_variants: selectedVariants,
      });
      setCart(res.data);
      setIsCartOpen(true);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Could not add to cart';
      alert(msg);
    } finally {
      setCartLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    try {
      const res = await cartApi.updateItem(itemId, quantity);
      setCart(res.data);
    } catch (err) {
      console.error('Update qty error:', err);
    }
  }, []);

  const removeFromCart = useCallback(async (itemId) => {
    try {
      await cartApi.removeItem(itemId);
      setCart(prev => ({
        ...prev,
        items: prev.items.filter(i => i.item_id !== itemId),
      }));
      // Refresh to get accurate totals
      fetchCart();
    } catch (err) {
      console.error('Remove error:', err);
    }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      await cartApi.clear();
      setCart(prev => ({ ...prev, items: [], subtotal: 0, discount: 0, total: 0, coupon_code: null }));
    } catch (err) {
      console.error('Clear cart error:', err);
    }
  }, []);

  const applyCoupon = useCallback(async (code) => {
    try {
      const res = await cartApi.applyCoupon(code);
      setCart(res.data);
      return { success: true, message: res.data.coupon_message };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Invalid coupon' };
    }
  }, []);

  const removeCoupon = useCallback(async () => {
    try {
      await cartApi.removeCoupon();
      fetchCart();
    } catch (err) {
      console.error('Remove coupon error:', err);
    }
  }, [fetchCart]);

  const cartCount = (cart.items || []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, cartCount, cartLoading,
      isCartOpen, setIsCartOpen,
      addToCart, updateQuantity, removeFromCart, clearCart,
      applyCoupon, removeCoupon, fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
