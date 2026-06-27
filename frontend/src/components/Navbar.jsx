import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, X, ChevronDown, Menu, LogOut, LayoutDashboard, Globe } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const navLinks = [
  {
    key: 'nav_coffee',
    href: '/collections/coffee',
    dropdown: [
      { key: 'nav_turkish_coffee', href: '/collections/turkish-coffee' },
      { key: 'nav_espresso', href: '/collections/espresso' },
      { key: 'nav_instant_coffee', href: '/collections/instant-coffee' },
    ],
  },
  { key: 'nav_hot_chocolate', href: '/collections/hot-chocolate' },
  { key: 'nav_bundles', href: '/collections/bundles' },
  { key: 'nav_mugs', href: '/collections/mugs' },
  { key: 'nav_equipment', href: '/collections/equipment' },
];

export default function Navbar() {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const { t, lang, setLang } = useLanguage();

    useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>


      <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
        <div className="header-inner" style={{ direction: 'ltr' }}>
          {/* Logo */}
          <Link to="/" className="header-logo">
            <img
              src="https://khogaeg.com/cdn/shop/files/khoga-_logo-01_3711f271-ad33-4883-a991-2a87266083b9.png?v=1772370227"
              alt="KHOGA"
              className="logo-img"
            />
          </Link>

          {/* Center Nav */}
          <nav className="header-nav desktop-only">
            {navLinks.map((link) => (
              <div
                key={link.key}
                className="nav-item"
                onMouseEnter={() => link.dropdown && setActiveDropdown(link.key)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link to={link.href} className="nav-link">
                  {t(link.key)}
                  {link.dropdown && <ChevronDown size={14} className="nav-chevron" />}
                </Link>
                {link.dropdown && activeDropdown === link.key && (
                  <div className="nav-dropdown" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                    {link.dropdown.map((item) => (
                      <Link
                        key={item.key}
                        to={item.href}
                        className="dropdown-item"
                        onClick={() => setActiveDropdown(null)}
                      >
                        {t(item.key)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Icons */}
          <div className="header-icons">
            <div className="lang-switcher desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
  <button
    className="lang-btn"
    onClick={() => setLang('en')}
    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: lang === 'en' ? 'bold' : 'normal', padding: '0 4px', fontSize: '13px' }}
  >
    EN
  </button>
  <span className="lang-divider" style={{ fontSize: '12px', color: '#ccc' }}>|</span>
  <button
    className="lang-btn"
    onClick={() => setLang('ar')}
    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: lang === 'ar' ? 'bold' : 'normal', padding: '0 4px', fontSize: '13px' }}
  >
    عربي
  </button>
</div>
            
            <button
              className="icon-btn desktop-only"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              data-testid="open-search-btn"
            >
              <Search size={20} />
            </button>
            <div
              className="nav-item desktop-only"
              onMouseEnter={() => setUserMenuOpen(true)}
              onMouseLeave={() => setUserMenuOpen(false)}
              style={{ position: 'relative' }}
            >
              <button
                className="icon-btn"
                aria-label="Account"
                data-testid="user-menu-btn"
                onClick={() => user ? navigate('/account') : navigate('/login')}
              >
                <User size={20} />
              </button>
              {userMenuOpen && (
                <div className="nav-dropdown" style={{ right: 0, left: 'auto', minWidth: '150px', direction: lang === 'ar' ? 'rtl' : 'ltr', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                  {user ? (
                    <>
                      <div className="dropdown-item" style={{ fontWeight: 600, color: '#1a1a1a', cursor: 'default' }}>
                        Hi, {user.name?.split(' ')[0]}
                      </div>
                      <Link to="/account" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>{t('nav_my_account')}</Link>
                      <Link to="/account/orders" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>{t('nav_my_orders')}</Link>
                      {isAdmin && (
                        <Link to="/admin" className="dropdown-item" onClick={() => setUserMenuOpen(false)} data-testid="admin-link">
                          <LayoutDashboard size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                          {t('nav_admin_dashboard')}
                        </Link>
                      )}
                      <button
                        className="dropdown-item"
                        style={{ background: 'none', border: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }}
                        data-testid="logout-btn"
                      >
                        <LogOut size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        {t('nav_logout')}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="dropdown-item" onClick={() => setUserMenuOpen(false)} data-testid="login-link">{t('nav_login')}</Link>
                      <Link to="/register" className="dropdown-item" onClick={() => setUserMenuOpen(false)} data-testid="register-link">{t('nav_create_account')}</Link>
                    </>
                  )}
                </div>
              )}
            </div>
            <button
              className="icon-btn cart-icon-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label="Cart"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </button>
            <button
              className="icon-btn mobile-only"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            <button
              className="icon-btn mobile-only"
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearch} className="search-form">
              <Search size={18} className="search-form-icon" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="search-close">
                <X size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <Link to="/" className="mobile-logo" onClick={() => setMobileOpen(false)}>
                <img
                  src="https://khogaeg.com/cdn/shop/files/khoga-_logo-01_3711f271-ad33-4883-a991-2a87266083b9.png?v=1772370227"
                  alt="KHOGA"
                  style={{ height: '32px', objectFit: 'contain' }}
                />
              </Link>
              <button onClick={() => setMobileOpen(false)} className="icon-btn">
                <X size={20} />
              </button>
            </div>
            <nav className="mobile-nav">
              {navLinks.map((link) => (
                <div key={link.key}>
                  <Link
                    to={link.href}
                    className="mobile-nav-link"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t(link.key)}
                  </Link>
                  {link.dropdown && link.dropdown.map((item) => (
                    <Link
                      key={item.key}
                      to={item.href}
                      className="mobile-nav-link mobile-sub"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t(item.key)}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
            <div className="mobile-menu-footer">
              <button
                onClick={() => { setMobileOpen(false); setSearchOpen(true); }}
                className="mobile-icon-row"
              >
                <Search size={18} />
                <span>{t('nav_search')}</span>
              </button>

              <button
                className="mobile-icon-row"
                onClick={() => {
                  setMobileOpen(false);
                  user ? navigate('/account') : navigate('/login');
                }}
              >
                <User size={18} />
                <span>{user ? t('nav_my_account') : t('nav_login')}</span>
              </button>

              <button
                className="mobile-icon-row"
                onClick={() => { setMobileOpen(false); setIsCartOpen(true); }}
              >
                <ShoppingBag size={18} />
                <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  {t('cart_title') || 'Cart'}
                  {cartCount > 0 && (
                    <span className="cart-badge" style={{ position: 'relative', top: 0, right: 0, marginLeft: 6 }}>{cartCount}</span>
                  )}
                </span>
              </button>

              {/* Mobile Language Switcher */}
              <div className="mobile-lang-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                <span style={{ fontSize: '14px', color: '#666', marginRight: lang === 'ar' ? '0' : 'auto', marginLeft: lang === 'ar' ? 'auto' : '0' }}>Language / اللغة:</span>
                <button
                  onClick={() => { setLang('en'); setMobileOpen(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: lang === 'en' ? 'bold' : 'normal', fontSize: '14px', color: lang === 'en' ? '#1A1A1A' : '#888' }}
                >
                  EN
                </button>
                <span style={{ color: '#ccc' }}>|</span>
                <button
                  onClick={() => { setLang('ar'); setMobileOpen(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: lang === 'ar' ? 'bold' : 'normal', fontSize: '14px', color: lang === 'ar' ? '#1A1A1A' : '#888' }}
                >
                  عربي
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
