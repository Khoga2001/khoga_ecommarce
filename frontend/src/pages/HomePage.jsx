import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import FeaturedFullProduct from '../components/FeaturedFullProduct';
import { categoriesApi, productsApi } from '../api';
import { resolveImage } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

function CategoryMarquee({ categories }) {
  const { t, lang, setLang } = useLanguage();
  return (
    <section className="category-marquee-section">
      <div style={{ textAlign: 'center', padding: '48px 24px 16px' }}>
        <h2 className="section-title" style={{ fontSize: '1.125rem', fontWeight: '500' }}>
          {t('discover_premium')}
        </h2>
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
            <span className="category-marquee-label">{t(col.handle)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductSection({ title, products, viewAllLink, layout = 'grid', disableGallery = false, limit = 6 }) {
  const { t, lang, setLang } = useLanguage();
  if (!products || !products.length) return null;

  const displayProducts = products.slice(0, limit);

  return (
    <section className="product-section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {viewAllLink && <Link to={viewAllLink} className="view-all-link">{t('view_all')}</Link>}
      </div>
      {layout === 'grid' ? (
        <div className="product-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          padding: '0 24px'
        }}>
          {displayProducts.map((p) => <ProductCard key={p.id} product={p} disableGallery={disableGallery} />)}
        </div>
      ) : (
        <div className="product-scroll-wrapper" style={{ overflowX: 'auto', padding: '0 24px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div style={{ display: 'flex', gap: '24px', paddingBottom: '16px', minWidth: 'max-content' }}>
            {displayProducts.map((p) => (
              <div key={p.id} style={{ width: '320px', flexShrink: 0 }}>
                <ProductCard product={p} disableGallery={disableGallery} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function FeaturedBundleSlider({ products }) {
  const { t, lang, setLang } = useLanguage();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: lang === 'ar' ? 'rtl' : 'ltr' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const wheelAccumulator = useRef(0);
  const scrollLock = useRef(false);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit({ loop: true, direction: lang === 'ar' ? 'rtl' : 'ltr' });
    }
  }, [emblaApi, lang]);

  const handleWheel = (e) => {
    if (!emblaApi || scrollLock.current) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      e.stopPropagation();
      wheelAccumulator.current += e.deltaX;
      
      if (Math.abs(wheelAccumulator.current) > 50) {
        if (wheelAccumulator.current > 0) {
          emblaApi.scrollNext();
        } else {
          emblaApi.scrollPrev();
        }
        
        wheelAccumulator.current = 0;
        scrollLock.current = true;
        
        // Lock scrolling to absorb trackpad inertia
        setTimeout(() => {
          scrollLock.current = false;
          wheelAccumulator.current = 0;
        }, 600);
      }
    }
  };

  if (!products || !products.length) return null;

  return (
    <div className="featured-bundle-slider-wrap" style={{ padding: '60px 0', width: '100%', maxWidth: '100vw' }}>
      <div 
        className="embla" 
        ref={emblaRef} 
        style={{ overflow: 'hidden', cursor: 'grab' }}
        onWheel={handleWheel}
      >
        <div className="embla__container" style={{ display: 'flex', touchAction: 'pan-y' }}>
          {products.map((p) => {
            const localizedDesc = t(`desc_${p.handle}`, p.description);
            const cleanDesc = localizedDesc ? localizedDesc.replace(/<[^>]+>/g, '').trim() : '';
            const fallbackShortDesc = cleanDesc.length > 200 ? cleanDesc.substring(0, 200) + '...' : cleanDesc;
            const shortDesc = t(`short_desc_${p.handle}`, fallbackShortDesc);
            const displayTitle = t(`short_title_${p.handle}`, t(p.title));
            
            return (
              <div className="embla__slide" key={p.id} style={{ flex: '0 0 100%', minWidth: 0, padding: '0 32px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  
                  {/* Full Edge-to-Edge Rectangular Wrapper */}
                  <div className="featured-slider-img-wrap" style={{ position: 'relative', width: '100%', maxWidth: '100%', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#f9f9f9', display: 'flex', justifyContent: 'center' }}>
                    <Link to={`/products/${p.handle}`} style={{ width: '100%', display: 'block' }}>
                      <img 
                        src={resolveImage(p.images?.[0])} 
                        alt={p.title} 
                        className="slide__image featured-mobile-adapt"
                        sizes="(min-width: 750px) 100vw, 100vw"
                        loading="lazy"
                        fetchPriority="low"
                        style={{ width: '100%', objectFit: 'cover', display: 'block' }} 
                      />
                    </Link>
                    
                    {/* Floating Arrows */}
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); emblaApi && emblaApi.scrollPrev(); }}
                      style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, color: '#1A1A1A', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); emblaApi && emblaApi.scrollNext(); }}
                      style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, color: '#1A1A1A', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  
                  {/* Centered Text Info */}
                  <div style={{ marginTop: '40px', maxWidth: '700px', padding: '0 24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '400', marginBottom: '20px', color: '#1A1A1A' }}>{displayTitle}</h3>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#333', marginBottom: '32px' }}>
                      {shortDesc}
                    </p>
                    <Link 
                      to={`/products/${p.handle}`} 
                      style={{ fontSize: '14px', fontWeight: '400', color: '#1A1A1A', textDecoration: 'none', paddingBottom: '6px' }}
                    >
                      {t('discover')}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Dots Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
        {products.map((_, i) => (
          <button 
            key={i} 
            onClick={() => emblaApi && emblaApi.scrollTo(i)}
            style={{ width: '8px', height: '8px', padding: 0, borderRadius: '50%', backgroundColor: i === selectedIndex ? '#1A1A1A' : '#C4C4C4', border: 'none', cursor: 'pointer', transition: 'background-color 0.3s' }} 
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewsSection() {
  const { t, lang } = useLanguage();
  const scrollRef = useRef(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const isDown = useRef(false);
  const hasDragged = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  // --- Click & drag (desktop mouse) ---
  const handleMouseDown = (e) => {
    isDown.current = true;
    hasDragged.current = false;
    dragStartX.current = e.pageX - scrollRef.current.offsetLeft;
    dragScrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
    handleInteractionStart();
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.2;
    if (Math.abs(walk) > 5) {
      hasDragged.current = true; // Mark as dragged if moved > 5px
    }
    scrollRef.current.scrollLeft = dragScrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDown.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
      scrollRef.current.style.userSelect = '';
    }
    handleInteractionEnd();
  };

  const isHovered = useRef(false);
  const animationRef = useRef(null);
  const scrollPosRef = useRef(0);
  const isUserScrolling = useRef(false);
  const userScrollTimeoutRef = useRef(null);

  const handleInteractionStart = () => {
    isUserScrolling.current = true;
    if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current);
  };

  const handleInteractionEnd = () => {
    if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current);
    userScrollTimeoutRef.current = setTimeout(() => {
      isUserScrolling.current = false;
      if (scrollRef.current) {
        scrollPosRef.current = scrollRef.current.scrollLeft;
      }
    }, 1500);
  };

  const handleWheel = () => {
    handleInteractionStart();
    handleInteractionEnd();
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const playScroll = () => {
      if (!isDown.current && !isHovered.current && !isUserScrolling.current) {
        const isRTL = lang === 'ar';
        if (isRTL) {
          scrollPosRef.current -= 0.7; // Speed of auto-scroll
          
          // Seamless infinite loop logic in positive LTR space (as container direction is set to ltr)
          if (scrollPosRef.current <= 0) {
            scrollPosRef.current += (el.scrollWidth / 3);
          } else if (scrollPosRef.current >= (el.scrollWidth * (2/3))) {
            scrollPosRef.current -= (el.scrollWidth / 3);
          }
        } else {
          scrollPosRef.current += 0.7; // Speed of auto-scroll
          
          // Seamless infinite loop logic in positive LTR space
          if (scrollPosRef.current >= (el.scrollWidth * (2/3))) {
            scrollPosRef.current -= (el.scrollWidth / 3);
          } else if (scrollPosRef.current <= 0) {
            scrollPosRef.current += (el.scrollWidth / 3);
          }
        }
        el.scrollLeft = scrollPosRef.current;
      }
      animationRef.current = requestAnimationFrame(playScroll);
    };

    animationRef.current = requestAnimationFrame(playScroll);
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current);
    };
  }, [lang]);

  // Reset scroll position on language change to ensure we start in the loop range
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      const startPos = el.scrollWidth / 3;
      scrollPosRef.current = startPos;
      el.scrollLeft = startPos;
    }, 50);
    return () => clearTimeout(timer);
  }, [lang]);

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

  const displayImages = [...reviewImages, ...reviewImages, ...reviewImages];

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setLightboxImg(null); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Prevent body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightboxImg ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxImg]);

  return (
    <>
      <section className="reviews-section">
        <h2 className="section-title reviews-title">{t('reviews_title')}</h2>
        <div className="reviews-scroll-wrapper">
          <div
            className="reviews-scroll"
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
            onTouchCancel={handleInteractionEnd}
            onWheel={handleWheel}
            onMouseEnter={() => isHovered.current = true}
            onMouseLeave={() => {
              isHovered.current = false;
              handleMouseUp();
            }}
            style={{ cursor: 'grab', direction: 'ltr' }}
          >
            {displayImages.map((image, i) => (
              <div
                key={i}
                className="review-img-item"
                onClick={(e) => {
                  if (hasDragged.current) {
                    e.preventDefault();
                    e.stopPropagation();
                  } else {
                    setLightboxImg(image);
                  }
                }}
                style={{ cursor: 'zoom-in' }}
              >
                <img src={image} alt={`Customer review ${i + 1}`} loading="lazy" draggable="false" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="review-lightbox" onClick={() => setLightboxImg(null)}>
          <button className="review-lightbox-close" onClick={() => setLightboxImg(null)}>✕</button>
          <img
            src={lightboxImg}
            alt="Review"
            className="review-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function HotChocolateBanner({ count }) {
  const { t, lang, setLang } = useLanguage();
  return (
    <section className="hot-chocolate-banner">
      <Link to="/collections/hot-chocolate" className="hot-choc-inner">
        <div className="hot-choc-img-wrap">
          <img
            src="https://khogaeg.com/cdn/shop/collections/Jenta-Plan-Post-9-4k-1774187292067.png?v=1774293858"
            alt="Hot Chocolate"
            loading="lazy"
          />
        </div>
        <div className="hot-choc-overlay">
          <h2 className="hot-choc-title">{t('hot-chocolate')}</h2>
          <span className="hot-choc-count">{t('products_count', { count })}</span>
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
  const { t, lang, setLang } = useLanguage();

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
            poster="/hero-poster.jpg"
          >
            <source
              src="/hero-video.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      </section>

      <div className="hero-content">
        <h1 className="hero-title">{t('hero_title')}</h1>
        <p className="hero-subtitle">{t('hero_subtitle')}</p>
        <p className="hero-tagline">
          {t('hero_tagline')}
        </p>
      </div>

      {categories.length > 0 && <CategoryMarquee categories={categories} />}

      {loading ? (
        <div style={{ padding: '60px 24px', textAlign: 'center', color: '#6b6b6b' }}>{t('loading')}</div>
      ) : (
        <>
          <ProductSection title={t('nav_bundles')} products={bundles} viewAllLink="/collections/bundles" />
          <ProductSection title={t('nav_instant_coffee')} products={instant} viewAllLink="/collections/instant-coffee" />
          <ProductSection title={t('nav_turkish_coffee')} products={turkish} viewAllLink="/collections/turkish-coffee" limit={4} />
          
          {/* Featured Full Products replacing Espresso */}
          <div style={{ padding: '40px 0', width: '100%' }}>
            {(() => {
              const greekMastic = turkish.find(p => p.title.toLowerCase().includes('greek mastic')) || turkish[0];
              const houseBlend = espresso.find(p => p.title.toLowerCase().includes('100% arabica')) || espresso[0];
              return (
                <div className="featured-full-products" style={{ display: 'flex', flexDirection: 'column', gap: '60px', width: '100%', margin: '0 auto' }}>
                  {greekMastic && <FeaturedFullProduct productData={greekMastic} />}
                  {houseBlend && <FeaturedFullProduct productData={houseBlend} />}
                </div>
              );
            })()}
          </div>

          <ProductSection title={t('nav_mugs')} products={mugs} viewAllLink="/collections/mugs" />

          <HotChocolateBanner count={hotChoc.length} />
          <ProductSection title={t('nav_hot_chocolate')} products={hotChoc} viewAllLink="/collections/hot-chocolate" layout="slider" disableGallery={true} />

          {equipment.length > 0 && (
            <ProductSection title={t('coffee_corner')} products={equipment} viewAllLink="/collections/equipment" layout="slider" disableGallery={true} />
          )}

          {(() => {
            const targetHandles = ['you-are-my-coffee-bundle', 'instant-coffee-bundle', 'mix-flavor-bundle-the-trio'];
            const featuredBundles = targetHandles.map(h => bundles.find(b => b.handle === h)).filter(Boolean);
            return featuredBundles.length > 0 && <FeaturedBundleSlider products={featuredBundles} />;
          })()}

          <ReviewsSection />
        </>
      )}

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
