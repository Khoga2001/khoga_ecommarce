import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Minus, Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productsApi } from '../api';
import { formatPrice, resolveImage, titleCase } from '../utils/format';

export default function ProductPage() {
  const { handle } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState([]);
  const [currentImg, setCurrentImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
    return <main className="product-page"><div style={{ padding: '80px 24px', textAlign: 'center', color: '#6b6b6b' }}>Loading…</div></main>;
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

  const prevImg = () => setCurrentImg(prev => (prev - 1 + images.length) % images.length);
  const nextImg = () => setCurrentImg(prev => (prev + 1) % images.length);

  return (
    <main className="product-page" data-testid="product-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to={`/collections/${product.collection}`}>{titleCase(product.collection)}</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{product.title}</span>
      </div>

      <div className="product-layout">
        <div className="product-gallery">
          <div className="gallery-thumbs">
            {images.map((img, i) => (
              <button
                key={i}
                className={`gallery-thumb ${i === currentImg ? 'active' : ''}`}
                onClick={() => setCurrentImg(i)}
              >
                <img src={resolveImage(img)} alt={`${product.title} ${i + 1}`} />
              </button>
            ))}
          </div>

          <div className="gallery-main" onClick={() => setLightboxOpen(true)}>
            {images[currentImg] && (
              <img src={resolveImage(images[currentImg])} alt={product.title} className="gallery-main-img" />
            )}
            {images.length > 1 && (
              <>
                <button className="gallery-nav gallery-prev" onClick={(e) => { e.stopPropagation(); prevImg(); }}>
                  <ChevronLeft size={20} />
                </button>
                <button className="gallery-nav gallery-next" onClick={(e) => { e.stopPropagation(); nextImg(); }}>
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            {isSale && <span className="product-badge sale-badge gallery-badge">Sale</span>}
            {images.length > 0 && <div className="gallery-counter">{currentImg + 1}/{images.length}</div>}
          </div>
        </div>

        <div className="product-info">
          <h1 className="product-page-title">{product.title}</h1>

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
            <div key={variant.name} className="variant-group">
              <div className="variant-label">
                <span>{variant.name}</span>
                <span className="variant-selected">{selectedVariants[variant.name] || variant.options[0]}</span>
              </div>
              <div className="variant-options">
                {variant.options.map((opt) => (
                  <button
                    key={opt}
                    className={`variant-btn ${(selectedVariants[variant.name] || variant.options[0]) === opt ? 'selected' : ''}`}
                    onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.name]: opt }))}
                    data-testid={`variant-${variant.name}-${opt}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="qty-group">
            <label className="variant-label-text">Quantity</label>
            <div className="qty-controls qty-controls-lg">
              <button className="qty-btn qty-btn-lg" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                <Minus size={14} />
              </button>
              <span className="qty-value qty-value-lg" data-testid="qty-value">{quantity}</span>
              <button className="qty-btn qty-btn-lg" onClick={() => setQuantity(q => q + 1)}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <button
            className={`btn-primary add-to-cart-btn ${added ? 'added' : ''}`}
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            data-testid="add-to-cart-btn"
          >
            {product.stock <= 0 ? 'Out of Stock' : added ? (<><Check size={18} /> Added to Cart</>) : 'Add to Cart'}
          </button>

          <div className="product-description">
            <p>{product.description}</p>
          </div>

          <div className="product-accordions">
            <ProductAccordion title="Shipping Information">
              <p>Free shipping on orders over LE 500. Standard delivery within 3-5 business days across Egypt.</p>
            </ProductAccordion>
            <ProductAccordion title="Returns & Exchanges">
              <p>We accept returns within 14 days of delivery for unopened products. Contact us via WhatsApp for assistance.</p>
            </ProductAccordion>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="related-section">
          <h2 className="section-title">You May Also Like</h2>
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
