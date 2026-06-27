import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Plus } from 'lucide-react';
import { formatPrice, resolveImage } from '../utils/format';
import { useLanguage } from "../context/LanguageContext";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [imgIdx, setImgIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const touchStartX = useRef(null);
  const imgWrapperRef = useRef(null);
  const { t, lang, setLang } = useLanguage();

  // Desktop: mouse move zoom tracking
  const handleMouseMove = useCallback((e) => {
    if (!imgWrapperRef.current) return;
    const rect = imgWrapperRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

  if (!product) return null;
  const images = product.images || [];
  const hasVariants = product.variants && product.variants.length > 0;
  const isSale = !!(product.compare_price && product.compare_price > product.price);

  const handleMouseEnter = () => {
    if (images.length > 1) setImgIdx(1);
    setZoom(true);
  };

  const handleMouseLeave = () => {
    setImgIdx(0);
    setZoom(false);
    setZoomPos({ x: 50, y: 50 });
  };

  // Mobile: touch swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setImgIdx(prev => (prev + 1) % images.length);
      } else {
        setImgIdx(prev => (prev - 1 + images.length) % images.length);
      }
    }
    touchStartX.current = null;
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    await addToCart(product, 1, {});
    setTimeout(() => setAdding(false), 800);
  };

  const handleChoose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products/${product.handle}`);
  };

  return (
    <div
      className="product-card"
      data-testid={`product-card-${product.handle}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <Link to={`/products/${product.handle}`} className="product-card-link">
        <div
          className={`product-card-image-wrapper ${zoom ? 'is-zoomed' : ''}`}
          ref={imgWrapperRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={zoom ? {
            '--zoom-x': `${zoomPos.x}%`,
            '--zoom-y': `${zoomPos.y}%`,
          } : {}}
        >
          {isSale && <span className="product-badge sale-badge">{t('sale', 'Sale')}</span>}
          {images.map((img, i) => (
            <img
              key={i}
              src={resolveImage(img)}
              alt={`${product.title} ${i + 1}`}
              className={`product-card-img ${imgIdx === i ? 'img-visible' : 'img-hidden'}`}
              loading="lazy"
            />
          ))}
          {/* Mobile swipe dots indicator */}
          {images.length > 1 && (
            <div className="card-img-dots">
              {images.map((_, i) => (
                <span key={i} className={`card-img-dot ${imgIdx === i ? 'active' : ''}`} />
              ))}
            </div>
          )}
          <div className="product-card-actions">
            {hasVariants ? (
              <button className="quick-add-btn choose-btn" onClick={handleChoose}>
                {t('choose_options', 'Choose options')}
              </button>
            ) : (
              <button className={`quick-add-btn ${adding ? 'adding' : ''}`} onClick={handleQuickAdd}>
                {adding ? t('added', 'Added!') : (<><Plus size={14} />{t('add', 'Add')}</>)}
              </button>
            )}
          </div>
        </div>
        <div className="product-card-info">
          <h3 className="product-card-title">{t(product.title)}</h3>
          <div className="product-card-price">
            {isSale ? (
              <>
                <span className="price-sale">{formatPrice(product.price)}</span>
                <span className="price-original">{formatPrice(product.compare_price)}</span>
              </>
            ) : (
              <span className="price-regular">{formatPrice(product.price)}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
