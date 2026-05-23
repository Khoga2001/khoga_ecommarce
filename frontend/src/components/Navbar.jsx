import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, X, ChevronDown, Menu, LogOut, LayoutDashboard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  {
    label: 'Coffee',
    href: '/collections/coffee',
    dropdown: [
      { label: 'Turkish Coffee', href: '/collections/turkish-coffee' },
      { label: 'Espresso', href: '/collections/espresso' },
      { label: 'Instant Coffee', href: '/collections/instant-coffee' },
    ],
  },
  { label: 'Hot Chocolate', href: '/collections/hot-chocolate' },
  { label: 'Bundles', href: '/collections/bundles' },
  { label: 'Mugs', href: '/collections/mugs' },
  { label: 'Equipment', href: '/collections/equipment' },
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
      {/* Announcement Bar */}
      <div className="announcement-bar">
        Free shipping on orders over LE 500
      </div>

      <header className="site-header">
        <div className="header-inner">
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
                key={link.label}
                className="nav-item"
                onMouseEnter={() => link.dropdown && setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link to={link.href} className="nav-link">
                  {link.label}
                  {link.dropdown && <ChevronDown size={14} className="nav-chevron" />}
                </Link>
                {link.dropdown && activeDropdown === link.label && (
                  <div className="nav-dropdown">
                    {link.dropdown.map((item) => (
                      <Link
                        key={item.label}
                        to={item.href}
                        className="dropdown-item"
                        onClick={() => setActiveDropdown(null)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Icons */}
          <div className="header-icons">
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
                <div className="nav-dropdown" style={{ right: 0, left: 'auto', minWidth: '200px' }}>
                  {user ? (
                    <>
                      <div className="dropdown-item" style={{ fontWeight: 600, color: '#1a1a1a', cursor: 'default' }}>
                        Hi, {user.name?.split(' ')[0]}
                      </div>
                      <Link to="/account" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>My Account</Link>
                      <Link to="/account/orders" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>My Orders</Link>
                      {isAdmin && (
                        <Link to="/admin" className="dropdown-item" onClick={() => setUserMenuOpen(false)} data-testid="admin-link">
                          <LayoutDashboard size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        className="dropdown-item"
                        style={{ background: 'none', border: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }}
                        data-testid="logout-btn"
                      >
                        <LogOut size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="dropdown-item" onClick={() => setUserMenuOpen(false)} data-testid="login-link">Login</Link>
                      <Link to="/register" className="dropdown-item" onClick={() => setUserMenuOpen(false)} data-testid="register-link">Create Account</Link>
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
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)}>
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
                <div key={link.label}>
                  <Link
                    to={link.href}
                    className="mobile-nav-link"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                  {link.dropdown && link.dropdown.map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="mobile-nav-link mobile-sub"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
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
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
