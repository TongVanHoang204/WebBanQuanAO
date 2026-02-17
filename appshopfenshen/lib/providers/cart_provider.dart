import 'package:flutter/material.dart';
import '../models/cart.dart';
import '../services/cart_service.dart';

class CartProvider extends ChangeNotifier {
  final CartService _cartService = CartService();

  Cart? _cart;
  bool _isLoading = false;

  Cart? get cart => _cart;
  bool get isLoading => _isLoading;
  int get itemCount => _cart?.totalItems ?? 0;
  double get totalPrice => _cart?.totalPrice ?? 0;
  List<CartItem> get items => _cart?.items ?? [];

  Future<void> loadCart() async {
    try {
      _isLoading = true;
      notifyListeners();
      _cart = await _cartService.getCart();
    } catch (e) {
      // silently fail
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addToCart(String variantId, {int qty = 1}) async {
    try {
      final res = await _cartService.addToCart(variantId: variantId, qty: qty);
      if (res['success'] == true) {
        await loadCart();
        return true;
      }
    } catch (e) {
      // error
    }
    return false;
  }

  Future<bool> updateQty(String itemId, int qty) async {
    try {
      final res = await _cartService.updateCartItem(itemId, qty);
      if (res['success'] == true) {
        await loadCart();
        return true;
      }
    } catch (e) {
      // error
    }
    return false;
  }

  Future<bool> removeItem(String itemId) async {
    try {
      final res = await _cartService.removeCartItem(itemId);
      if (res['success'] == true) {
        await loadCart();
        return true;
      }
    } catch (e) {
      // error
    }
    return false;
  }

  Future<bool> clearAll() async {
    try {
      final res = await _cartService.clearCart();
      if (res['success'] == true) {
        _cart = null;
        notifyListeners();
        return true;
      }
    } catch (e) {
      // error
    }
    return false;
  }

  Future<Map<String, dynamic>?> applyCoupon(String code) async {
    try {
      final res = await _cartService.applyCoupon(code, totalPrice);
      if (res['success'] == true) {
        return res['data'] is Map<String, dynamic> ? res['data'] : res;
      }
    } catch (e) {
      // error
    }
    return null;
  }
}
