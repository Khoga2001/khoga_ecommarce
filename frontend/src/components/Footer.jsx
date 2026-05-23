import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook } from 'lucide-react';

export default function Footer() {
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
            <p className="footer-tagline">
              Eight years of unyielding passion in every roast. Since 2019.
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
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Shop</h4>
            <ul className="footer-links">
              <li><Link to="/collections/turkish-coffee">Turkish Coffee</Link></li>
              <li><Link to="/collections/espresso">Espresso</Link></li>
              <li><Link to="/collections/instant-coffee">Instant Coffee</Link></li>
              <li><Link to="/collections/hot-chocolate">Hot Chocolate</Link></li>
              <li><Link to="/collections/bundles">Bundles</Link></li>
              <li><Link to="/collections/mugs">Mugs</Link></li>
              <li><Link to="/collections/equipment">Equipment</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div className="footer-col">
            <h4 className="footer-heading">Information</h4>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/shipping">Shipping Policy</Link></li>
              <li><Link to="/returns">Returns & Refunds</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-links">
              <li>
                <a
                  href="https://wa.me/201000073883?text=Hello! I have a question."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-whatsapp"
                >
                  Chat on WhatsApp
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

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} KHOGA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
