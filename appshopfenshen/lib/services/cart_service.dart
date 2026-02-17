import '../config/api_config.dart';
import '../models/cart.dart';
import 'api_service.dart';

class CartService {
  final ApiService _api = ApiService();

  Future<Cart?> getCart() async {
    final res = await _api.get(ApiConfig.cart);
    if (res.data['success'] == true && res.data['data'] != null) {
      return Cart.fromJson(res.data['data']);
    }
    return null;
  }

  Future<Map<String, dynamic>> addToCart({
    required String variantId,
    int qty = 1,
  }) async {
    final res = await _api.post(ApiConfig.addToCart, data: {
      'variant_id': int.tryParse(variantId) ?? variantId,
      'qty': qty,
    });
    return res.data;
  }

  Future<Map<String, dynamic>> updateCartItem(
      String itemId, int qty) async {
    final res =
        await _api.put(ApiConfig.updateCartItem(itemId), data: {'qty': qty});
    return res.data;
  }

  Future<Map<String, dynamic>> removeCartItem(String itemId) async {
    final res = await _api.delete(ApiConfig.removeCartItem(itemId));
    return res.data;
  }

  Future<Map<String, dynamic>> clearCart() async {
    final res = await _api.delete(ApiConfig.clearCart);
    return res.data;
  }

  Future<Map<String, dynamic>> mergeCart() async {
    final res = await _api.post(ApiConfig.mergeCart);
    return res.data;
  }

  Future<Map<String, dynamic>> applyCoupon(
      String code, double cartTotal) async {
    final res = await _api.post(ApiConfig.applyCoupon, data: {
      'code': code,
      'cartTotal': cartTotal,
    });
    return res.data;
  }
}
