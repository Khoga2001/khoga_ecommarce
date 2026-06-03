import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Minus, Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { productsApi } from '../api';
import { formatPrice, resolveImage } from '../utils/format';
import { useLanguage } from "../context/LanguageContext";

const formatBuyPrice = (amount) => `${Number(amount).toLocaleString('en-EG', {minimumFractionDigits: 2, maximumFractionDigits: 2})} EGP`;

function ProductAccordion({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`accordion ${open ? 'open' : ''}`}>
      <button className="accordion-header" onClick={() => setOpen(!open)}>
        {title}
        <span className="accordion-icon">{open ? '-' : '+'}</span>
      </button>
      {open && <div className="accordion-content">{children}</div>}
    </div>
  );
}

export default function FeaturedFullProduct({ handle, productData }) {
  const { addToCart } = useCart();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [product, setProduct] = useState(productData || null);
  const [loading, setLoading] = useState(!productData);
  const [currentImg, setCurrentImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [added, setAdded] = useState(false);
  const { ref: galleryRef, isRevealed: galleryRevealed } = useScrollReveal();
  const [buyQty, setBuyQty] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (productData) {
      setProduct(productData);
      const init = {};
      (productData.variants || []).forEach(v => { if (v.options?.length) init[v.name] = v.options[0]; });
      setSelectedVariants(init);
      setLoading(false);
      return;
    }

    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await productsApi.getByHandle(handle);
        if (!mounted) return;
        const p = res.data;
        setProduct(p);
        const init = {};
        (p.variants || []).forEach(v => { if (v.options?.length) init[v.name] = v.options[0]; });
        setSelectedVariants(init);
      } catch (err) {
        console.error("Failed to load featured product", handle);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [handle, productData]);

  if (loading) return <div style={{ padding: '80px 24px', textAlign: 'center', color: '#6b6b6b' }}>Loading {handle}...</div>;
  if (!product) return null;

  const images = product.images || [];
  const isSale = !!(product.compare_price && product.compare_price > product.price);

  const handleAddToCart = async () => {
    await addToCart(product, quantity, selectedVariants);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = async () => {
    await addToCart(product, quantity, selectedVariants);
    navigate('/checkout');
  };

  const prevImg = () => setCurrentImg(prev => (prev - 1 + images.length) % images.length);
  const nextImg = () => setCurrentImg(prev => (prev + 1) % images.length);

  return (
    <div className="product-layout" style={{ marginBottom: '60px' }}>
      <div className="product-gallery">
        <div ref={galleryRef} className={`gallery-main scroll-reveal ${galleryRevealed ? 'revealed' : ''}`} onClick={() => setLightboxOpen(true)}>
          {images[0] && (
            <img src={resolveImage(images[0])} alt={product.title} className="gallery-main-img" />
          )}
          {isSale && <span className="product-badge sale-badge gallery-badge">{t('sale', 'Sale')}</span>}
        </div>
      </div>

      <div className="product-info sticky-info-desktop">
        <h2 className="product-page-title" style={{ fontSize: '2rem' }}>
          <Link to={`/products/${product.handle}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {t(product.title)}
          </Link>
        </h2>

        <div className="product-page-price">
          {isSale ? (
            <>
              <span className="price-sale">{formatPrice(product.price)}</span>
              <span className="price-original">{formatPrice(product.compare_price)}</span>
            </>
          ) : (
            <span className="price-regular">{formatPrice(product.price)}</span>
          )}
        </div>

        {(product.variants || []).map((variant) => (
          <div key={variant.name} className="variant-group" style={{ marginBottom: '24px' }}>
            <div className="variant-label" style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t(variant.name)}</span>
            </div>
            <div className="variant-options" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {variant.options.map((opt) => (
                <button
                  key={opt}
                  className={`variant-btn ${(selectedVariants[variant.name] || variant.options[0]) === opt ? 'selected' : ''}`}
                  onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.name]: opt }))}
                  style={{ flex: '1 1 calc(33.333% - 10px)', minWidth: '120px', padding: '12px', fontSize: '14px', textAlign: 'center', justifyContent: 'center' }}
                >
                  {t(opt)}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="qty-label" style={{ fontSize: '13px', fontWeight: '500', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          {t('quantity', 'Quantity')}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'stretch' }}>
          <div className="qty-controls qty-controls-lg" style={{ flex: '0 0 140px', margin: 0, height: '48px' }}>
            <button className="qty-btn qty-btn-lg" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
              <Minus size={14} />
            </button>
            <span className="qty-value qty-value-lg">{quantity}</span>
            <button className="qty-btn qty-btn-lg" onClick={() => setQuantity(q => q + 1)}>
              <Plus size={14} />
            </button>
          </div>
          
          <button
            className={`btn-outline add-to-cart-btn ${added ? 'added' : ''}`}
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            style={{ flex: 1, margin: 0, height: '48px', backgroundColor: '#fff', color: '#1a1a1a', border: '1px solid #1a1a1a' }}
          >
            {product.stock <= 0 ? t('out_of_stock', 'Out of Stock') : added ? (<><Check size={18} /> {t('added', 'Added to Cart')}</>) : t('add_to_cart', 'Add to cart')}
          </button>
        </div>

        <button
          className="btn-primary buy-now-btn"
          disabled={product.stock <= 0}
          onClick={handleBuyNow}
          style={{ width: '100%', height: '48px', marginBottom: '32px', backgroundColor: '#1a1a1a', color: '#fff' }}
        >
          {t('buy_now', 'Buy it now')}
        </button>

      </div>
    </div>
  );
}
