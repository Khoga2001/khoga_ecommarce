import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { productsApi, categoriesApi } from '../api';
import { resolveImage } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

const getSortOptions = (t) => [
  { value: 'featured', label: t('sort_featured', 'Featured') },
  { value: 'price-asc', label: t('sort_price_asc', 'Price: Low to High') },
  { value: 'price-desc', label: t('sort_price_desc', 'Price: High to Low') },
  { value: 'title-asc', label: t('sort_title_asc', 'Alphabetically, A-Z') },
];

function sortProducts(products, sort) {
  const arr = [...products];
  switch (sort) {
    case 'price-asc': return arr.sort((a, b) => a.price - b.price);
    case 'price-desc': return arr.sort((a, b) => b.price - a.price);
    case 'title-asc': return arr.sort((a, b) => a.title.localeCompare(b.title));
    default: return arr;
  }
}

export default function CollectionPage() {
  const { handle } = useParams();
  const [sort, setSort] = useState('featured');
  const [sortOpen, setSortOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [collectionTitle, setCollectionTitle] = useState('');
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { t, lang, setLang } = useLanguage();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const catRes = await categoriesApi.list();
        if (mounted) setAllCategories(catRes.data || []);

        if (handle === 'coffee') {
          setCollectionTitle('Coffee');
          const [t, e, i] = await Promise.all([
            productsApi.list({ collection: 'turkish-coffee', per_page: 50 }),
            productsApi.list({ collection: 'espresso', per_page: 50 }),
            productsApi.list({ collection: 'instant-coffee', per_page: 50 }),
          ]);
          if (mounted) setProducts([...(t.data.items || []), ...(e.data.items || []), ...(i.data.items || [])]);
        } else {
          try {
            const cat = await categoriesApi.get(handle);
            if (mounted) setCollectionTitle(cat.data.title);
          } catch {
            if (mounted) setNotFound(true);
            return;
          }
          const pRes = await productsApi.list({ collection: handle, per_page: 50 });
          if (mounted) setProducts(pRes.data.items || []);
        }
      } catch (err) {
        console.error('Collection load error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [handle]);

  if (notFound) {
    return (
      <main className="collection-page">
        <div className="not-found-wrap">
          <h1>Collection not found</h1>
          <Link to="/" className="btn-primary">Back to Home</Link>
        </div>
      </main>
    );
  }

  const sorted = sortProducts(products, sort);
  const sortOptions = getSortOptions(t);
  const selectedSort = sortOptions.find(s => s.value === sort);

  return (
    <main className="collection-page" data-testid="collection-page">
      <div className="breadcrumb">
        <Link to="/">{t('nav_home', 'Home')}</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{t(collectionTitle)}</span>
      </div>

      <div className="collection-header">
        <h1 className="collection-title">{t(collectionTitle)}</h1>
        <span className="collection-count">{t('products_count', { count: sorted.length })}</span>
      </div>

      <div className="collection-toolbar">
        <div className="sort-wrapper" tabIndex={0} onBlur={() => setSortOpen(false)}>
          <button
            className="sort-btn"
            onClick={() => setSortOpen(prev => !prev)}
            data-testid="sort-btn"
          >
            <SlidersHorizontal size={14} />
            {t('sort_by', 'Sort')}: {selectedSort?.label}
            <ChevronDown size={14} />
          </button>
          {sortOpen && (
            <div className="sort-dropdown">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`sort-option ${sort === opt.value ? 'active' : ''}`}
                  onMouseDown={(e) => { e.preventDefault(); setSort(opt.value); setSortOpen(false); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px 24px', textAlign: 'center', color: '#6b6b6b' }}>{t('loading')}</div>
      ) : sorted.length > 0 ? (
        <div className="collection-grid">
          {sorted.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="empty-collection">
          <p>{t('no_products', 'No products found in this collection.')}</p>
          <Link to="/" className="btn-primary">{t('back_to_home', 'Back to Home')}</Link>
        </div>
      )}

      <section className="related-collections">
        <h3 className="related-title">{t('explore_more', 'Explore More')}</h3>
        <div className="related-grid">
          {allCategories
            .filter(c => c.handle !== handle)
            .slice(0, 4)
            .map(col => (
              <Link key={col.id} to={`/collections/${col.handle}`} className="related-collection-card">
                <div className="related-col-img-wrap">
                  {col.image && <img src={resolveImage(col.image)} alt={col.title} loading="lazy" />}
                </div>
                <span className="related-col-title">{t(col.title)}</span>
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}
