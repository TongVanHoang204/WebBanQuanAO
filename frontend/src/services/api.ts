import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');
const isAbsoluteUrl = (value: string): boolean => ABSOLUTE_URL_PATTERN.test(value);

export const getApiBaseUrl = (): string => API_BASE_URL;

export const getApiOrigin = (): string => {
  if (isAbsoluteUrl(API_BASE_URL)) {
    return stripTrailingSlash(API_BASE_URL).replace(/\/api$/i, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
};

export const resolveApiUrl = (path: string): string => {
  if (isAbsoluteUrl(path)) {
    return path;
  }

  if (path.startsWith('/api/')) {
    if (isAbsoluteUrl(API_BASE_URL)) {
      return `${getApiOrigin()}${path}`;
    }
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${stripTrailingSlash(API_BASE_URL)}${normalizedPath}`;
};

export const toMediaUrl = (path?: string | null): string => {
  if (!path) {
    return '';
  }

  if (isAbsoluteUrl(path) || path.startsWith('data:')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const apiOrigin = getApiOrigin();
  return apiOrigin ? `${apiOrigin}${normalizedPath}` : normalizedPath;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add session ID for guest carts
  const sessionId = localStorage.getItem('sessionId');
  if (sessionId) {
    config.headers['x-session-id'] = sessionId;
  }
  
  return config;
});

// Response interceptor for error handling
// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page to avoid loops if needed, 
      // but simple redirect is usually fine.
      if (!window.location.pathname.includes('/login')) {
         window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
       // Check if it's strictly an account blocked message or generic 403
       // But generally for admin panel, 403 means lost permission or blocked.
       const msg = error.response.data?.message;
       if (msg === 'Account is blocked' || msg === 'User not found') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login?reason=blocked';
       }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { username: string; email: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data),
  
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  
  googleLogin: (credential: string) =>
    api.post('/auth/login/google', { credential }),
  
  getMe: () => api.get('/auth/me'),
  
  updateProfile: (data: { full_name?: string; phone?: string; address_line1?: string; city?: string; province?: string; avatar_url?: string }) =>
    api.put('/auth/profile', data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.put('/auth/change-password', data),

  getActivity: () => api.get('/auth/activity'),

  // Address
  // Address
  getAddresses: () => api.get('/auth/addresses'),
  addAddress: (data: any) => api.post('/auth/addresses', data),
  updateAddress: (id: string, data: any) => api.put(`/auth/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/auth/addresses/${id}`),
  setDefaultAddress: (id: string) => api.put(`/auth/addresses/${id}/default`),

  // 2FA
  verify2FA: (userId: string, otp: string) => api.post('/auth/2fa/verify', { userId, otp }),
  toggle2FA: (enabled: boolean) => api.put('/auth/2fa/toggle', { enabled })
};

// Wishlist API
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  add: (product_id: string | number) => api.post('/wishlist/add', { product_id }),
  remove: (product_id: string | number) => api.delete(`/wishlist/${product_id}`)
};

// Products API
export const productsAPI = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    category?: string;
    brand?: string;
    sort?: string;
    min_price?: number;
    max_price?: number;
    on_sale?: boolean;
    min_discount?: number;
  }, signal?: AbortSignal) => api.get('/products', { params: { ...params, on_sale: params?.on_sale ? 'true' : undefined }, signal }),
  
  getBySlug: (slug: string) => api.get(`/products/${slug}`),
  
  getById: (id: string) => api.get(`/products/id/${id}`),
  
  getNewArrivals: (limit?: number) => 
    api.get('/products/new-arrivals', { params: { limit } }),
  
  search: (q: string, signal?: AbortSignal) => api.get('/products/search', { params: { q }, signal })
};

// Categories API
export const categoriesAPI = {
  getAll: (params?: { include_inactive?: boolean }) => api.get('/categories', { params }),
  
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
  
  getProducts: (slug: string, params?: { page?: number; limit?: number }) =>
    api.get(`/categories/${slug}/products`, { params }),

  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`)
};

// Brands API
export const brandsAPI = {
  getPublic: (params?: { page?: number; limit?: number; search?: string }) => api.get('/brands', { params: { ...params, status: 'active' } }),
  getAll: (params?: { include_inactive?: boolean }) => api.get('/admin/brands', { params }), // Use admin route for full list or public?
  getById: (id: string) => api.get(`/admin/brands/${id}`),
  create: (data: any) => api.post('/admin/brands', data),
  update: (id: string, data: any) => api.put(`/admin/brands/${id}`, data),
  delete: (id: string) => api.delete(`/admin/brands/${id}`)
};

// Cart API
export const cartAPI = {
  get: () => api.get('/cart'),
  
  add: (variant_id: number, quantity: number) =>
    api.post('/cart/add', { variant_id, quantity }),
  
  update: (itemId: string, quantity: number) =>
    api.put(`/cart/update/${itemId}`, { quantity }),
  
  remove: (itemId: string) => api.delete(`/cart/remove/${itemId}`),
  
  clear: () => api.delete('/cart/clear'),
  
  merge: (sessionId: string) => api.post('/cart/merge', { sessionId })
};

// Orders API
export const ordersAPI = {
  checkout: (data: {
    customer_name: string;
    email?: string;
    customer_phone: string;
    ship_address_line1: string;
    ship_address_line2?: string;
    ship_city: string;
    ship_province: string;
    ship_postal_code?: string;
    ship_country?: string;
    note?: string;
    payment_method?: string;
    coupon_code?: string;
  }) => api.post('/orders/checkout', data),
  
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/orders', { params }),
  
  getById: (id: string) => api.get(`/orders/${id}`),
  
  getByCode: (code: string) => api.get(`/orders/code/${code}`),
  
  cancel: (id: string) => api.post(`/orders/${id}/cancel`)
};

// Chat API
export const chatAPI = {
  send: (message: string, history?: any[]) => api.post('/chat', { message, history }),
  
  checkHealth: () => api.get('/chat/health')
};

// Upload API
export const uploadAPI = {
  single: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  multiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Payment API
export const paymentAPI = {
  createUrl: (orderId: string, bankCode?: string) =>
    api.post('/payment/create_url', { order_id: orderId, bank_code: bankCode }),
  
  vnpayReturn: (params: any) => api.get('/payment/vnpay_return', { params }),
  
  getTransactions: (params?: any) => api.get('/payment/transactions', { params })
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  
  // Products
  getProducts: (params?: { page?: number; limit?: number; search?: string; category?: string; status?: string }) =>
    api.get('/admin/products', { params }),
  createProduct: (data: any) => api.post('/admin/products', data),
  updateProduct: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  importProducts: (formData: FormData) => api.post('/admin/import/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Orders
  getOrders: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get('/admin/orders', { params }),
  getOrderById: (id: string) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/admin/orders/${id}/status`, { status }),
  
  // Categories
  createCategory: (data: any) => api.post('/admin/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),
  
  // Users
  getUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    api.get('/admin/users', { params }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  
  // Analytics
  getAnalytics: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/admin/analytics', { params }),

  // Settings
  getSettings: () => api.get('/admin/settings'),
  getPublicSettings: () => api.get('/admin/settings/public'),
  updateSettings: (data: any) => api.put('/admin/settings', data),
  uploadLogo: (formData: FormData) => api.post('/admin/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Permissions
  getPermissions: () => api.get('/admin/permissions'),
  createPermission: (data: any) => api.post('/admin/permissions', data),
  updatePermission: (id: number, data: any) => api.put(`/admin/permissions/${id}`, data),
  deletePermission: (id: number) => api.delete(`/admin/permissions/${id}`),

  // Notifications
  getNotifications: (params?: { page?: number; limit?: number; unread_only?: boolean }) =>
    api.get('/admin/notifications', { params: { ...params, unread_only: params?.unread_only ? 'true' : 'false' } }),
  getUnreadCount: () => api.get('/admin/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/admin/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/admin/notifications/read-all'),
  deleteNotification: (id: string) => api.delete(`/admin/notifications/${id}`),

  // AI Assistant
  chat: (messages: { role: string; content: string }[]) => api.post('/admin/ai/chat', { messages }),
  generate: (prompt: string, type: 'product_description' | 'seo_meta' | 'chat_reply' = 'product_description') => 
    api.post('/admin/ai/generate', { prompt, type }),
};

// Notifications API (Common for all users)
export const notificationsAPI = {
  getNotifications: (params?: { page?: number; limit?: number; unread_only?: boolean }) =>
    api.get('/notifications', { params: { ...params, unread_only: params?.unread_only ? 'true' : 'false' } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
};

// Coupons API
export const couponsAPI = {
  apply: (code: string, subtotal: number) => 
    api.post('/admin/coupons/apply', { code, subtotal }) 
    // Wait, my backend route is /api/admin/coupons/apply based on routes/coupon.routes.ts being mounted at /api/admin/coupons likely?
    // Let's check server.ts... ah, couponRoutes is mounted at /api/admin/coupons.
    // So the path is /admin/coupons/apply.
};

// Reviews API
export const reviewsAPI = {
  getByProduct: (productId: string, params?: any) => 
    api.get(`/reviews/product/${productId}`, { params }),
  create: (data: any) => api.post('/reviews', data)
};

// Public Settings API
export const settingsAPI = {
  getPublic: () => api.get('/admin/settings/public')
};

// Banners API (Public)
export const bannersAPI = {
  getAll: (params?: { position?: string }) => api.get('/banners', { params })
};

// Generate session ID for guest users
export const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// Initialize session ID on load
getSessionId();

// Google Places API (via backend proxy)
export const placesAPI = {
  autocomplete: (input: string, lat?: number, lng?: number) => 
    api.post('/places/autocomplete', { input, lat, lng }),
  getDetails: (placeId: string) => 
    api.get(`/places/${encodeURIComponent(placeId)}`),
  search: (query: string, lat?: number, lng?: number) => 
    api.post('/places/search', { query, lat, lng })
};

export default api;
