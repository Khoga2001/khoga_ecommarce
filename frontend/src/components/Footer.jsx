import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const TikTokIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.23-1.13 4.35-2.82 5.83-1.63 1.43-3.87 2.15-6.04 1.96-2.22-.16-4.32-1.22-5.71-2.92-1.39-1.72-2.02-3.96-1.74-6.17.26-2.18 1.4-4.15 3.12-5.45 1.56-1.17 3.53-1.68 5.48-1.46v4.04c-1.07-.15-2.2.04-3.08.64-.89.58-1.5 1.52-1.69 2.56-.18 1.05.02 2.16.63 3.01.62.88 1.62 1.4 2.69 1.5.99.1 2-.11 2.82-.67.82-.54 1.39-1.36 1.6-2.33.05-.24.08-.49.08-.73V.02h4.08z" />
  </svg>
);

export default function Footer() {
  const { t, lang, setLang } = useLanguage();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-brand">
            <Link to="/">
              <img
                src="https://khogaeg.com/cdn/shop/files/khoga-_logo-01_3711f271-ad33-4883-a991-2a87266083b9.png?v=1772370227"
                alt="KHOGA"
                className="footer-logo"
              />
            </Link>
            <p className="footer-tagline" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {t('footer_tagline', 'Eight years of unyielding passion in every roast. Since 2019.')}
            </p>
            <div className="footer-social">
              <a
                href="https://www.instagram.com/khoga.eg/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.facebook.com/khogacoffee.eg"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.tiktok.com/@khoga.eg?_r=1&_t=ZS-94YFX731UZE"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="TikTok"
              >
                <TikTokIcon size={18} />
              </a>
            </div>
          </div>

          {/* SHOP + INFORMATION — display:contents on desktop, 2-col grid on mobile */}
          <div className="footer-cols-row">
            <div className="footer-col">
              <h4 className="footer-heading">{t('footer_shop')}</h4>
              <ul className="footer-links">
                <li><Link to="/collections/turkish-coffee">{t('nav_turkish_coffee')}</Link></li>
                <li><Link to="/collections/espresso">{t('nav_espresso')}</Link></li>
                <li><Link to="/collections/instant-coffee">{t('nav_instant_coffee')}</Link></li>
                <li><Link to="/collections/hot-chocolate">{t('nav_hot_chocolate')}</Link></li>
                <li><Link to="/collections/bundles">{t('nav_bundles')}</Link></li>
                <li><Link to="/collections/mugs">{t('nav_mugs')}</Link></li>
                <li><Link to="/collections/equipment">{t('nav_equipment')}</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">{t('footer_info')}</h4>
              <ul className="footer-links">
                <li><Link to="/about">{t('footer_about')}</Link></li>
                <li><Link to="/contact">{t('footer_contact_us')}</Link></li>
                <li><Link to="/faq">{t('footer_faq')}</Link></li>
                <li><Link to="/shipping">{t('footer_shipping')}</Link></li>
                <li><Link to="/returns">{t('footer_returns')}</Link></li>
                <li><Link to="/privacy">{t('footer_privacy')}</Link></li>
              </ul>
            </div>
          </div>

          {/* CONTACT — display:contents on desktop, flex centered on mobile */}
          <div className="footer-contact-col">
            <div className="footer-col">
              <h4 className="footer-heading">{t('footer_contact')}</h4>
              <ul className="footer-links">
                <li>
                  <a
                    href="https://wa.me/201000073883?text=Hello! I have a question."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-whatsapp"
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  >
                    {t('chat_on_whatsapp', 'Chat on WhatsApp')}
                  </a>
                </li>
                <li>
                  <a href="mailto:info@khogaeg.com">info@khogaeg.com</a>
                </li>
              </ul>
              <div className="footer-payment-icons">
                <span className="payment-icon">Visa</span>
                <span className="payment-icon">Mastercard</span>
                <span className="payment-icon">COD</span>
              </div>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} KHOGA. {t('footer_rights')}</p>
        </div>
      </div>
    </footer>
  );
}
