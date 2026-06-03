import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Minus, Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import ProductCard from '../components/ProductCard';
import { productsApi } from '../api';
import { formatPrice, resolveImage, titleCase } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';
import useEmblaCarousel from 'embla-carousel-react';
const formatBuyPrice = (amount) => `${Number(amount).toLocaleString('en-EG', {minimumFractionDigits: 2, maximumFractionDigits: 2})} EGP`;

const getSimilarityScore = (baseProd, candidateProd) => {
  if (baseProd.id === candidateProd.id) return -999;
  
  let score = 0;
  // We want to pair with something from a DIFFERENT collection usually (cross-sell)
  if (baseProd.collection === candidateProd.collection) {
    score -= 5; 
  } else {
    score += 5;
  }

  // Extract meaningful keywords
  const getWords = (title) => title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  const wordsA = getWords(baseProd.title);
  const wordsB = getWords(candidateProd.title);
  
  // High score for matching keywords (e.g. 'Hazelnut', 'Mastic', 'Cardamom', 'Pure')
  const common = wordsA.filter(w => wordsB.includes(w));
  score += common.length * 10;
  
  // Smart category cross-sells
  if (baseProd.collection === 'turkish-coffee' && candidateProd.collection === 'equipment') score += 8;
  if (baseProd.collection === 'instant-coffee' && candidateProd.collection === 'mugs') score += 8;
  if (baseProd.collection === 'mugs' && ['espresso', 'hot-chocolate', 'instant-coffee'].includes(candidateProd.collection)) score += 8;
  if (baseProd.collection === 'equipment' && ['espresso', 'turkish-coffee'].includes(candidateProd.collection)) score += 8;
  
  // Avoid pairing bundles as a small add-on
  if (candidateProd.collection === 'bundles') score -= 10;
  
  return score;
};

export default function ProductPage() {
  const { handle } = useParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState([]);
  const [pairedProduct, setPairedProduct] = useState(null);
  const [currentImg, setCurrentImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { ref: galleryRef, isRevealed: galleryRevealed } = useScrollReveal();
  const [buyQty, setBuyQty] = useState(1);
  const [galleryZoom, setGalleryZoom] = useState(false);
  const [galleryZoomPos, setGalleryZoomPos] = useState({ x: 50, y: 50 });
  const { t, lang, setLang } = useLanguage();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: lang === 'ar' ? 'rtl' : 'ltr' });

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCurrentImg(emblaApi.selectedScrollSnap());
    };
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit({ loop: true, direction: lang === 'ar' ? 'rtl' : 'ltr' });
    }
  }, [emblaApi, lang]);

  const handleGalleryMouseMove = (e) => {
    if (!galleryRef.current) return;
    const rect = galleryRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGalleryZoomPos({ x, y });
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setNotFound(false);
      setCurrentImg(0);
      setQuantity(1);
      try {
        const res = await productsApi.getByHandle(handle);
        if (!mounted) return;
        const p = res.data;
        setProduct(p);
        const init = {};
        (p.variants || []).forEach(v => { if (v.options?.length) init[v.name] = v.options[0]; });
        setSelectedVariants(init);

        const rel = await productsApi.list({ collection: p.collection, per_page: 5 });
        if (mounted) {
          setRelated((rel.data.items || []).filter(r => r.id !== p.id).slice(0, 4));
        }

        // Smart pairing logic
        const allRes = await productsApi.list({ per_page: 50 });
        const allProducts = allRes.data.items || [];
        if (mounted && allProducts.length > 0) {
          // Sort all products by similarity score descending
          const sortedCandidates = [...allProducts].sort((a, b) => getSimilarityScore(p, b) - getSimilarityScore(p, a));
          const bestMatch = sortedCandidates[0];
          if (bestMatch && bestMatch.id !== p.id) {
            setPairedProduct(bestMatch);
          }
        }
      } catch (err) {
        if (mounted) setNotFound(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [handle]);

  if (loading) {
    return <main className="product-page"><div style={{ padding: '80px 24px', textAlign: 'center', color: '#6b6b6b' }}>{t('loading')}</div></main>;
  }

  if (notFound || !product) {
    return (
      <main className="product-page">
        <div className="not-found-wrap">
          <h1>Product not found</h1>
          <Link to="/" className="btn-primary">Back to Home</Link>
        </div>
      </main>
    );
  }

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

  const prevImg = () => { if (emblaApi) emblaApi.scrollPrev(); };
  const nextImg = () => { if (emblaApi) emblaApi.scrollNext(); };
  
  const handleThumbClick = (i) => {
    if (emblaApi) emblaApi.scrollTo(i);
  };

  const isSpecialMinimalProduct = product?.title && (product.title.toLowerCase().includes('greek mastic') || product.title.toLowerCase().includes('100% arabica'));

  return (
    <main className="product-page" data-testid="product-page">
      <div className="breadcrumb">
        <Link to="/">{t('nav_home', 'Home')}</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to={`/collections/${product.collection}`}>{t(product.collection)}</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="current">{t(product.title)}</span>
      </div>

      <div className="product-layout">
        <div className="product-gallery">
          <div
            className={`gallery-main scroll-reveal ${galleryRevealed ? 'revealed' : ''} ${galleryZoom ? 'is-zoomed' : ''}`}
            onClick={() => setLightboxOpen(true)}
            onMouseEnter={() => setGalleryZoom(true)}
            onMouseLeave={() => setGalleryZoom(false)}
            onMouseMove={handleGalleryMouseMove}
            style={galleryZoom ? {
              '--zoom-x': `${galleryZoomPos.x}%`,
              '--zoom-y': `${galleryZoomPos.y}%`,
            } : {}}
          >
            {isSpecialMinimalProduct ? (
              images[0] && <img src={resolveImage(images[0])} alt={product.title} className="gallery-main-img" />
            ) : (
              <div className="embla" ref={emblaRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                <div className="embla__container" style={{ display: 'flex', height: '100%', touchAction: 'pan-y' }}>
                  {images.map((img, i) => (
                    <div className="embla__slide" key={i} style={{ flex: '0 0 100%', minWidth: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <img src={resolveImage(img)} alt={`${product.title} ${i + 1}`} className="gallery-main-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!isSpecialMinimalProduct && images.length > 1 && (
              <>
                <button className="gallery-nav gallery-prev" onClick={(e) => { e.stopPropagation(); prevImg(); }}>
                  <ChevronLeft size={20} />
                </button>
                <button className="gallery-nav gallery-next" onClick={(e) => { e.stopPropagation(); nextImg(); }}>
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            {isSale && <span className="product-badge sale-badge gallery-badge">{t('sale')}</span>}
            {!isSpecialMinimalProduct && images.length > 0 && <div className="gallery-counter">{currentImg + 1}/{images.length}</div>}
          </div>

          {!isSpecialMinimalProduct && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`gallery-thumb ${i === currentImg ? 'active' : ''}`}
                  onClick={() => handleThumbClick(i)}
                >
                  <img src={resolveImage(img)} alt={`${product.title} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`product-info ${isSpecialMinimalProduct ? 'sticky-info-desktop' : ''}`}>
          <h1 className="product-page-title">{t(product.title)}</h1>

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
                  data-testid={`variant-${variant.name}-${opt}`}
                  style={{ flex: '1 1 calc(33.333% - 10px)', minWidth: '120px', padding: '12px', fontSize: '14px', textAlign: 'center', justifyContent: 'center' }}
                >
                  {t(opt)}
                </button>
              ))}
            </div>
          </div>
        ))}

          {/* Volume Discount Section */}
          <div className="volume-discount-container" style={{ marginTop: '24px', marginBottom: '24px' }}>
            <h3 style={{ textAlign: 'center', fontSize: '18px', fontWeight: '400', marginBottom: '16px', color: '#1a1a1a' }}>{t('buy_more_save_more', 'Buy more & save more')}</h3>
            <div className="volume-options" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { qty: 1, label: t('buy_1', 'Buy 1'), discount: 0, popular: false },
                { qty: 2, label: t('buy_2_save_5', 'Buy 2 get 5% off'), discount: 0.05, popular: true },
                { qty: 3, label: t('buy_3_save_10', 'Buy 3 get 10% off'), discount: 0.10, popular: false },
              ].map(opt => {
                const isSelected = quantity === opt.qty;
                const basePrice = product.price;
                const origPrice = product.compare_price || product.price;
                const discountedPrice = basePrice * opt.qty * (1 - opt.discount);
                const originalTotal = origPrice * opt.qty;
                const savings = originalTotal - discountedPrice;
                
                return (
                  <div 
                    key={opt.qty}
                    onClick={() => setQuantity(opt.qty)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? '#1a73e8' : '#e0e0e0'}`,
                      backgroundColor: isSelected ? '#f8fdf8' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {opt.popular && (
                      <div style={{ position: 'absolute', top: '-10px', right: '12px', background: '#1a1a1a', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', zIndex: 2 }}>
                        {t('most_popular', 'Most Popular')}
                      </div>
                    )}
                    <div style={{ marginRight: '16px', width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${isSelected ? '#000' : '#ccc'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#000' }}></div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: isSelected ? '600' : '400', color: isSelected ? '#000' : '#333' }}>{opt.label}</div>
                      {opt.discount > 0 && <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>{t('you_save', 'You save')} {formatPrice(savings)}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: isSelected ? '#2e7d32' : '#2e7d32' }}>{formatPrice(discountedPrice)}</div>
                      {(opt.discount > 0 || isSale) && <div style={{ fontSize: '13px', color: '#888', textDecoration: 'line-through', marginTop: '4px' }}>{formatPrice(originalTotal)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            className={`btn-primary add-to-cart-btn ${added ? 'added' : ''}`}
            onClick={handleAddToCart}
            data-testid="add-to-cart-btn"
          >
            {added ? t('added', 'Added!') : t('add_to_cart', 'Add to Cart')}
          </button>
          
          <button
            className="btn-primary buy-now-btn"
            onClick={handleBuyNow}
            data-testid="buy-now-btn"
            style={{ 
              background: '#000', 
              color: '#fff', 
              border: 'none', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              width: '100%',
              height: '48px',
              marginBottom: '32px'
            }}
          >
            {t('buy_now', 'Buy it now')}
          </button>

          {!isSpecialMinimalProduct && (
            <>
              <div
                className="product-description"
                dangerouslySetInnerHTML={{ __html: t(`desc_${product.handle}`, product.description) }}
              />

              <div className="product-accordions">
                <ProductAccordion title={t('care_maintenance', 'CARE & MAINTENANCE')}>
                  <p>{t('care_text', 'To maintain the beauty and integrity of your purchase, we recommend treating it with care. Simple maintenance practices, such as gentle washing and proper storage, can effectively preserve the longevity of your favorites. We encourage you to refer to the care instructions included with each item, designed to help you keep your purchase in top condition.')}</p>
                </ProductAccordion>
                <ProductAccordion title={t('shipping_returns', 'SHIPPING & RETURNS')}>
                  <p>{t('shipping_text_2', 'We strive to process and ship all orders in a timely manner, working diligently to ensure that your items are on their way to you as soon as possible. Need to return something? Just let us know.')}</p>
                </ProductAccordion>
              </div>
            </>
          )}

          {/* Pairs Well With */}
          {pairedProduct && (
            <section className="product-pairing-section">
              <div className="pairing-container" style={{ display: 'flex', flexDirection: 'column', gap: '32px', backgroundColor: '#fdfbf7', padding: '48px 24px', borderRadius: '16px', marginTop: '64px', alignItems: 'center' }}>
                <h2 className="section-title" style={{ margin: 0, fontSize: '24px' }}>{t('perfect_pairing', 'Perfect Pairing')}</h2>
                <p style={{ color: '#666', textAlign: 'center', maxWidth: '600px', margin: '-16px 0 0' }}>
                  {t('pairing_desc', 'Enhance your experience with this perfectly matched companion, selected just for you.')}
                </p>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <img src={resolveImage(pairedProduct.images?.[0])} alt={pairedProduct.title} style={{ width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{t('recommended', 'Recommended')}</div>
                    <h3 style={{ fontSize: '20px', margin: '0 0 8px 0' }}>{t(pairedProduct.title)}</h3>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', marginBottom: '16px' }}>{formatPrice(pairedProduct.price)}</div>
                    <button 
                      className={`btn-primary ${added ? 'added' : ''}`}
                      style={{ padding: '12px 24px', width: 'fit-content' }}
                      onClick={async (e) => {
                        e.preventDefault();
                        await addToCart(pairedProduct, 1, {});
                        setAdded(true);
                        setTimeout(() => setAdded(false), 1500);
                      }}
                    >
                      {added ? t('added', 'Added!') : t('add_to_cart', 'Add to Cart')}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Brand Showcase */}
      <div className="brand-showcase">
        <div className="brand-showcase-text">
          <p>{t('explore_collection', 'EXPLORE OUR PREMIUM COFFEE COLLECTION AND YOU WOULD ALWAYS COME BACK FOR MORE')}</p>
        </div>
        <div className="brand-showcase-logo">
          <img
            src="https://khogaeg.com/cdn/shop/files/khoga-_logo-01_3711f271-ad33-4883-a991-2a87266083b9.png?v=1772370227"
            alt="KHOGA"
          />
        </div>
      </div>

      {related.length > 0 && (
        <section className="related-products">
          <h2 className="section-title">{t('related_products', 'You may also like')}</h2>
          <div className="product-grid">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {lightboxOpen && images.length > 0 && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>✕</button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-nav lightbox-prev" onClick={prevImg}>
              <ChevronLeft size={24} />
            </button>
            <img src={resolveImage(images[currentImg])} alt={product.title} className="lightbox-img" />
            <button className="lightbox-nav lightbox-next" onClick={nextImg}>
              <ChevronRight size={24} />
            </button>
            <div className="lightbox-dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`lightbox-dot ${i === currentImg ? 'active' : ''}`}
                  onClick={() => setCurrentImg(i)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ProductAccordion({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`accordion-item ${open ? 'open' : ''}`}>
      <button className="accordion-header" onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <span className="accordion-icon">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  );
}
