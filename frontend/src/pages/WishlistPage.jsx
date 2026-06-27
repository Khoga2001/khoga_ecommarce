import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { wishlistApi } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function WishlistPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wishlistApi.get()
      .then((res) => setProducts(res.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="wishlist-page" data-testid="wishlist-page">
      <div className="breadcrumb">
        <Link to="/">{t('nav_home')}</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/account">{t('account_title')}</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{t('account_wishlist')}</span>
      </div>

      <div className="wishlist-header">
        <Heart size={28} />
        <h1 className="section-title">{t('account_wishlist')}</h1>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '48px', color: '#666' }}>{t('loading')}</p>
      ) : products.length === 0 ? (
        <div className="wishlist-empty">
          <Heart size={48} strokeWidth={1} />
          <p>{t('wishlist_empty')}</p>
          <Link to="/" className="btn-primary">{t('cart_continue')}</Link>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
