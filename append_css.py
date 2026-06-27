css = """
/* Arabic font & RTL */
.lang-ar {
  font-family: 'Cairo', 'Tajawal', sans-serif;
  direction: rtl;
  text-align: right;
}

.lang-ar .site-header {
  direction: rtl;
}

.lang-ar .header-inner {
  flex-direction: row-reverse;
}

.lang-ar .footer-grid {
  direction: rtl;
}

.lang-ar .product-card-info {
  text-align: right;
}

.lang-ar .product-card-price {
  flex-direction: row-reverse;
}

/* Smooth transition on language switch */
body {
  transition: font-family 0.2s ease;
}
"""
with open('frontend/src/App.css', 'a') as f:
    f.write(css)
