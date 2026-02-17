import '../config/api_config.dart';
import '../models/product.dart';
import 'api_service.dart';

class WishlistService {
  final ApiService _api = ApiService();

  Future<List<Product>> getWishlist() async {
    final res = await _api.get(ApiConfig.wishlist);
    if (res.data['data'] != null) {
      final items = res.data['data'];
      if (items is List) {
        return items.map((item) {
          // Wishlist items might be wrapped: {"product": {...}}
          if (item['product'] != null) {
            return Product.fromJson(item['product']);
          }
          return Product.fromJson(item);
        }).toList();
      }
    }
    return [];
  }

  Future<Map<String, dynamic>> addToWishlist(String productId) async {
    final res = await _api.post(ApiConfig.addToWishlist, data: {
      'product_id': int.tryParse(productId) ?? productId,
    });
    return res.data;
  }

  Future<Map<String, dynamic>> removeFromWishlist(String productId) async {
    final res = await _api.delete(ApiConfig.removeFromWishlist(productId));
    return res.data;
  }
}
