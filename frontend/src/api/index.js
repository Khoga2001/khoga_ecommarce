import api from './client';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  addAddress: (address) => api.post('/auth/me/addresses', address),
  setDefaultAddress: (index) => api.post('/auth/me/addresses/default', { index }),
};

export const productsApi = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  getByHandle: (handle) => api.get(`/products/handle/${handle}`),
  // Admin
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  uploadImage: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/products/${id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  removeImage: (id, idx) => api.delete(`/products/${id}/images/${idx}`),
};

export const categoriesApi = {
  list: () => api.get('/categories'),
  get: (handle) => api.get(`/categories/${handle}`),
  // Admin
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  uploadImage: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/categories/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  updateItem: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
  applyCoupon: (code) => api.post('/cart/coupon', { code }),
  removeCoupon: () => api.delete('/cart/coupon'),
  merge: () => api.post('/cart/merge'),
};

export const ordersApi = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  place: (data) => api.post('/orders', data),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
};

export const wishlistApi = {
  get: () => api.get('/wishlist'),
  toggle: (productId) => api.post(`/wishlist/${productId}`),
};

export const reviewsApi = {
  getForProduct: (productId) => api.get(`/reviews/product/${productId}`),
  create: (productId, data) => api.post(`/reviews/product/${productId}`, data),
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  // Orders
  listOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  // Users
  listUsers: (params) => api.get('/admin/users', { params }),
  toggleUserActive: (id) => api.put(`/admin/users/${id}/toggle-active`),
  // Inventory
  getInventory: (params) => api.get('/admin/inventory', { params }),
  updateStock: (id, stock) => api.put(`/admin/inventory/${id}?stock=${stock}`),
  // Coupons
  listCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data) => api.post('/admin/coupons', data),
  updateCoupon: (id, data) => api.put(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
};
