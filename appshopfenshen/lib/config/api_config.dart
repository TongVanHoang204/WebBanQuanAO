class ApiConfig {
  // For Android emulator: 10.0.2.2 maps to host machine's localhost
  // For iOS simulator: localhost works directly
  // For physical device: use your machine's IP address
  static const String baseUrl = 'http://10.0.2.2:4000';

  // Auth
  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String googleLogin = '/api/auth/login/google';
  static const String getMe = '/api/auth/me';
  static const String updateProfile = '/api/auth/profile';
  static const String changePassword = '/api/auth/change-password';
  static const String forgotPassword = '/api/auth/forgot-password';
  static const String addresses = '/api/auth/addresses';
  static const String verify2FA = '/api/auth/2fa/verify';
  static const String toggle2FA = '/api/auth/2fa/toggle';

  // Products
  static const String products = '/api/products';
  static const String newArrivals = '/api/products/new-arrivals';
  static const String searchProducts = '/api/products/search';
  static String productById(String id) => '/api/products/id/$id';
  static String productBySlug(String slug) => '/api/products/$slug';

  // Categories
  static const String categories = '/api/categories';
  static String categoryBySlug(String slug) => '/api/categories/$slug';
  static String categoryProducts(String slug) =>
      '/api/categories/$slug/products';

  // Cart
  static const String cart = '/api/cart';
  static const String addToCart = '/api/cart/add';
  static String updateCartItem(String itemId) => '/api/cart/update/$itemId';
  static String removeCartItem(String itemId) => '/api/cart/remove/$itemId';
  static const String clearCart = '/api/cart/clear';
  static const String mergeCart = '/api/cart/merge';

  // Orders
  static const String checkout = '/api/orders/checkout';
  static const String orders = '/api/orders';
  static String orderById(String id) => '/api/orders/$id';
  static String orderByCode(String code) => '/api/orders/code/$code';
  static String cancelOrder(String id) => '/api/orders/$id/cancel';

  // Wishlist
  static const String wishlist = '/api/wishlist';
  static const String addToWishlist = '/api/wishlist/add';
  static String removeFromWishlist(String productId) =>
      '/api/wishlist/$productId';

  // Reviews
  static String productReviews(String productId) =>
      '/api/reviews/product/$productId';
  static const String createReview = '/api/reviews';

  // Banners
  static const String banners = '/api/banners';

  // Brands
  static const String brands = '/api/brands';

  // Shipping
  static const String calculateShipping = '/api/admin/shipping/calculate';
  static const String shippingMethods = '/api/admin/shipping';

  // Coupons
  static const String applyCoupon = '/api/admin/coupons/apply';

  // Payment
  static const String createPaymentUrl = '/api/payment/create_url';

  // Notifications
  static const String notifications = '/api/notifications';

  // Chat (AI)
  static const String chatAI = '/api/chat';
  static const String chatHealth = '/api/chat/health';

  // Socket
  static const String socketUrl = baseUrl;
}
