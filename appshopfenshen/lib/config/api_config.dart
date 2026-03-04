class ApiConfig {
  // Android emulator: 10.0.2.2 = host machine localhost
  // Physical device: change to your machine's LAN IP e.g. 192.168.1.x
  static const String baseUrl = 'http://10.0.2.2:4000';

  // Auth
  static const String login = '/api/v1/auth/login';
  static const String googleLogin = '/api/v1/auth/login/google';
  static const String register = '/api/v1/auth/register';
  static const String getMe = '/api/v1/auth/me';
  static const String updateProfile = '/api/v1/auth/profile';
  static const String changePassword = '/api/v1/auth/change-password';
  static const String forgotPassword = '/api/v1/auth/forgot-password';
  static const String resetPassword = '/api/v1/auth/reset-password';
  static const String addresses = '/api/v1/auth/addresses';
  static const String verify2FA = '/api/v1/auth/2fa/verify';
  static const String toggle2FA = '/api/v1/auth/2fa/toggle';
  static String addressById(String id) => '/api/v1/auth/addresses/$id';
  static String setDefaultAddress(String id) => '/api/v1/auth/addresses/$id/default';
  static String deleteAddress(String id) => '/api/v1/auth/addresses/$id';

  // Products
  static const String products = '/api/v1/products';
  static const String newArrivals = '/api/v1/products/new-arrivals';
  static const String searchProducts = '/api/v1/products/search';
  static String productById(String id) => '/api/v1/products/id/$id';
  static String productBySlug(String slug) => '/api/v1/products/$slug';

  // Categories
  static const String categories = '/api/v1/categories';
  static String categoryBySlug(String slug) => '/api/v1/categories/$slug';
  static String categoryProducts(String slug) => '/api/v1/categories/$slug/products';

  // Brands
  static const String brands = '/api/v1/brands';

  // Cart
  static const String cart = '/api/v1/cart';
  static const String addToCart = '/api/v1/cart/add';
  static String updateCartItem(String itemId) => '/api/v1/cart/update/$itemId';
  static String removeCartItem(String itemId) => '/api/v1/cart/remove/$itemId';
  static const String clearCart = '/api/v1/cart/clear';
  static const String mergeCart = '/api/v1/cart/merge';

  // Orders
  static const String checkout = '/api/v1/orders/checkout';
  static const String orders = '/api/v1/orders';
  static String orderById(String id) => '/api/v1/orders/$id';
  static String orderByCode(String code) => '/api/v1/orders/code/$code';
  static String cancelOrder(String id) => '/api/v1/orders/$id/cancel';
  static const String calculateShipping = '/api/v1/orders/calculate-shipping';

  // Wishlist
  static const String wishlist = '/api/v1/wishlist';
  static const String addToWishlist = '/api/v1/wishlist/add';
  static String removeFromWishlist(String productId) => '/api/v1/wishlist/$productId';

  // Reviews
  static String productReviews(String productId) => '/api/v1/reviews/product/$productId';
  static const String createReview = '/api/v1/reviews';

  // Coupons / Vouchers
  static const String coupons = '/api/v1/coupons';
  static const String validateCoupon = '/api/v1/coupons/validate';
  static const String userCoupons = '/api/v1/coupons/user';

  // Banners
  static const String banners = '/api/v1/banners';

  // Notifications
  static const String notifications = '/api/v1/notifications';
  static const String markNotificationRead = '/api/v1/notifications/read';
  static const String markAllNotificationsRead = '/api/v1/notifications/read-all';

  // Shipping
  static const String shippingMethods = '/api/v1/shipping-methods';

  // Flash sales / promotions
  static const String flashSale = '/api/v1/products';
}
