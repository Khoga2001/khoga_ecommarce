import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { categoriesApi, productsApi } from '../api';
import { resolveImage } from '../utils/format';

function CategoryMarquee({ categories }) {
  return (
    <section className="category-marquee-section">
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <h2 className="section-title">Discover Our Premium Coffee</h2>
      </div>
      <div className="category-marquee-track">
        {categories.map((col, i) => (
          <Link
            key={`${col.id}-${i}`}
            to={`/collections/${col.handle}`}
            className="category-marquee-item"
            data-testid={`category-${col.handle}`}
          >
            <div className="category-marquee-img-wrap">
              {col.image && <img src={resolveImage(col.image)} alt={col.title} loading="lazy" />}
            </div>
            <span className="category-marquee-label">{col.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductSection({ title, products, viewAllLink, useGrid = false }) {
  const scrollRef = useRef(null);
  const scroll = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };
  if (!products || !products.length) return null;

  return (
    <section className="product-section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {viewAllLink && <Link to={viewAllLink} className="view-all-link">View all</Link>}
      </div>
      {useGrid ? (
        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="product-scroll-wrapper">
          <button className="scroll-btn scroll-btn-left" onClick={() => scroll(-1)}>
            <ChevronLeft size={18} />
          </button>
          <div className="product-scroll-row" ref={scrollRef}>
            {products.map((product) => (
              <div key={product.id} className="product-scroll-item">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          <button className="scroll-btn scroll-btn-right" onClick={() => scroll(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}

function ReviewsSection() {
  const scrollRef = useRef(null);
  const scroll = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };
  const reviewImages = [
    'https://khogaeg.com/cdn/shop/files/WhatsApp_Image_2026-04-12_at_9.10.56_PM.jpg?v=1776021362',
    'https://khogaeg.com/cdn/shop/files/WhatsApp_Image_2026-04-12_at_9.10.56_PM_1.jpg?v=1776021324',
    'https://khogaeg.com/cdn/shop/files/WhatsApp_Image_2026-04-12_at_9.10.56_PM_2.jpg?v=1776021275',
    'https://khogaeg.com/cdn/shop/files/WhatsApp_Image_2026-04-12_at_9.10.56_PM_3.jpg?v=1776021185',
    'https://khogaeg.com/cdn/shop/files/WhatsApp_Image_2026-04-12_at_9.10.56_PM_4.jpg?v=1776021119',
    'https://khogaeg.com/cdn/shop/files/WhatsApp_Image_2026-04-12_at_8.19.52_PM.jpg?v=1776018385',
    'https://khogaeg.com/cdn/shop/files/WhatsApp_Image_2026-04-12_at_8.19.51_PM.jpg?v=1776018092',
    'https://khogaeg.com/cdn/shop/files/WhatsApp_Image_2026-04-12_at_8.19.52_PM_1.jpg?v=1776020664',
    'https://khogaeg.com/cdn/shop/files/WhatsApp_Image_2026-04-12_at_8.19.53_PM.jpg?v=1776020696',
  ];

  return (
    <section className="reviews-section">
      <h2 className="section-title reviews-title">Reviews We're Proud Of</h2>
      <div className="reviews-scroll-wrapper">
        <button className="scroll-btn scroll-btn-left" onClick={() => scroll(-1)}>
          <ChevronLeft size={18} />
        </button>
        <div className="reviews-scroll" ref={scrollRef}>
          {reviewImages.map((image, i) => (
            <div key={i} className="review-img-item">
              <img src={image} alt={`Customer review ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
        <button className="scroll-btn scroll-btn-right" onClick={() => scroll(1)}>
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}

function HotChocolateBanner({ count }) {
  return (
    <section className="hot-choc-banner">
      <Link to="/collections/hot-chocolate" className="hot-choc-inner">
        <div className="hot-choc-img-wrap">
          <img
            src="https://khogaeg.com/cdn/shop/collections/Jenta-Plan-Post-9-4k-1774187292067.png?v=1774293858"
            alt="Hot Chocolate"
            loading="lazy"
          />
        </div>
        <div className="hot-choc-overlay">
          <h2 className="hot-choc-title">Hot Chocolate</h2>
          <span className="hot-choc-count">{count} products</span>
        </div>
      </Link>
    </section>
  );
}

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [instant, setInstant] = useState([]);
  const [turkish, setTurkish] = useState([]);
  const [espresso, setEspresso] = useState([]);
  const [mugs, setMugs] = useState([]);
  const [hotChoc, setHotChoc] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const fetchCol = (handle) => productsApi.list({ collection: handle, per_page: 30, sort: 'created_at', order: 'asc' }).then(r => r.data.items || []);
        const [catRes, b, i, t, e, m, h, eq] = await Promise.all([
          categoriesApi.list(),
          fetchCol('bundles'),
          fetchCol('instant-coffee'),
          fetchCol('turkish-coffee'),
          fetchCol('espresso'),
          fetchCol('mugs'),
          fetchCol('hot-chocolate'),
          fetchCol('equipment'),
        ]);
        if (!mounted) return;
        setCategories(catRes.data || []);
        setBundles(b); setInstant(i); setTurkish(t); setEspresso(e);
        setMugs(m); setHotChoc(h); setEquipment(eq);
      } catch (err) {
        console.error('Homepage load error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <main className="home-page" data-testid="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-video-wrap">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="hero-video"
            poster="https://khogaeg.com/cdn/shop/files/preview_images/ed78484d497c40979e2b64f095c1c776.thumbnail.0000000000_small.jpg?v=1772654647"
          >
            <source
              src="https://khogaeg.com/cdn/shop/videos/c/vp/ed78484d497c40979e2b64f095c1c776/ed78484d497c40979e2b64f095c1c776.HD-1080p-2.5Mbps-77155836.mp4?v=0"
              type="video/mp4"
            />
          </video>
        </div>
        <div className="hero-content">
          <p className="hero-tagline">
            Eight years of unyielding passion in every roast. Since 2019, Khoga has been more than just a coffee factory; we have been your loyal daily companion.
          </p>
          <Link to="/collections/coffee" className="hero-cta btn-primary" data-testid="hero-cta">
            Discover Our Premium Coffee
          </Link>
        </div>
      </section>

      {categories.length > 0 && <CategoryMarquee categories={categories} />}

      {loading ? (
        <div style={{ padding: '60px 24px', textAlign: 'center', color: '#6b6b6b' }}>Loading products…</div>
      ) : (
        <>
          <ProductSection title="Bundles" products={bundles} viewAllLink="/collections/bundles" />
          <ProductSection title="Instant Coffee" products={instant} viewAllLink="/collections/instant-coffee" />
          <ProductSection title="Turkish Coffee" products={turkish} viewAllLink="/collections/turkish-coffee" />
          <ProductSection title="Espresso" products={espresso} viewAllLink="/collections/espresso" />

          <section className="mugs-section">
            <div className="section-header">
              <h2 className="section-title">Mugs</h2>
              <Link to="/collections/mugs" className="view-all-link">View all</Link>
            </div>
            <div className="product-grid">
              {mugs.slice(0, 6).map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            <div className="mugs-discover-wrap">
              <Link to="/collections/mugs" className="btn-outline">Discover</Link>
            </div>
          </section>

          <HotChocolateBanner count={hotChoc.length} />
          <ProductSection title="Hot Chocolate" products={hotChoc} viewAllLink="/collections/hot-chocolate" />

          {equipment.length > 0 && (
            <section className="equipment-section">
              <h2 className="section-title equipment-title">Your Coffee Corner</h2>
              <div className="product-scroll-wrapper">
                <div className="product-scroll-row product-scroll-row-eq">
                  {equipment.map((product) => (
                    <div key={product.id} className="product-scroll-item">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <ReviewsSection />

      <a
        href="https://wa.me/201000073883?text=Hello! I have a question."
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </main>
  );
}
