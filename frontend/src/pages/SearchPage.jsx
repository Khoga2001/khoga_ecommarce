import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Search } from 'lucide-react';
import { productsApi } from '../api';
import { useLanguage } from "../context/LanguageContext";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t, lang, setLang } = useLanguage();

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    productsApi.list({ search: query, per_page: 50 })
      .then(r => { if (mounted) setResults(r.data.items || []); })
      .catch(() => { if (mounted) setResults([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [query]);

  return (
    <main className="search-page" data-testid="search-page">
      <div className="breadcrumb">
        <Link to="/">{t('nav_home', 'Home')}</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{t('search', 'Search')}</span>
      </div>
      <div className="search-page-header">
        <Search size={24} />
        <h1>
          {query ? (
            <>{t('search_results_for', { count: results.length })} "<em>{query}</em>"</>
          ) : (
            t('search', 'Search')
          )}
        </h1>
      </div>

      {loading ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: '#6b6b6b' }}>{t('searching', 'Searching...')}</div>
      ) : results.length > 0 ? (
        <div className="collection-grid">
          {results.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : query ? (
        <div className="empty-collection">
          <p>{t('no_products_match', 'No products match your search for')} "<strong>{query}</strong>".</p>
          <Link to="/" className="btn-primary">{t('back_to_home', 'Back to Home')}</Link>
        </div>
      ) : null}
    </main>
  );
}
