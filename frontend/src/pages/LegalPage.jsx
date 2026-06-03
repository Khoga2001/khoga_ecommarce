import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LegalPage({ titleEn, titleAr, contentEn, contentAr }) {
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';
  
  return (
    <main className="product-page" style={{ padding: '60px 24px', maxWidth: '800px', margin: '0 auto', minHeight: '60vh' }}>
      <div className="breadcrumb" style={{ marginBottom: '40px' }}>
        <a href="/">{t('nav_home', 'Home')}</a>
        <span className="breadcrumb-sep">/</span>
        <span className="current">{isAr ? titleAr : titleEn}</span>
      </div>

      <h1 style={{ textAlign: isAr ? 'right' : 'left', marginBottom: '32px', fontSize: '32px', color: '#1a1a1a' }}>
        {isAr ? titleAr : titleEn}
      </h1>
      
      <div 
        style={{ 
          lineHeight: '1.8', 
          fontSize: '16px', 
          color: '#4a4a4a', 
          direction: isAr ? 'rtl' : 'ltr', 
          textAlign: isAr ? 'right' : 'left' 
        }}
        dangerouslySetInnerHTML={{ __html: isAr ? contentAr : contentEn }}
      />
    </main>
  );
}
