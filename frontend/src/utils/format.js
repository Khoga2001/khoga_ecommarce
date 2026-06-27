/**
 * Money / currency helpers — EGP formatting
 */
export function formatPrice(amount) {
  const n = Number(amount || 0);
  return `${n.toLocaleString('en-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}.00 EGP`;
}

export function formatPriceShort(amount) {
  const n = Number(amount || 0);
  return `${n.toLocaleString('en-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Resolve a stored image path or URL to a fully-qualified URL.
 * - If it already starts with http, return as-is
 * - If it starts with /uploads, prepend backend URL
 */
export function resolveImage(src) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('/uploads/')) {
    return `${process.env.REACT_APP_BACKEND_URL}${src}`;
  }
  return src;
}

export function titleCase(str = '') {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
