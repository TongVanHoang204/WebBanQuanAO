import 'package:flutter/material.dart';
import '../models/product.dart';
import '../services/wishlist_service.dart';

class WishlistProvider extends ChangeNotifier {
  final WishlistService _wishlistService = WishlistService();

  List<Product> _items = [];
  bool _isLoading = false;
  final Set<String> _wishlistIds = {};

  List<Product> get items => _items;
  bool get isLoading => _isLoading;
  int get itemCount => _items.length;

  bool isWishlisted(String productId) => _wishlistIds.contains(productId);

  Future<void> loadWishlist() async {
    try {
      _isLoading = true;
      notifyListeners();
      _items = await _wishlistService.getWishlist();
      _wishlistIds.clear();
      for (final item in _items) {
        _wishlistIds.add(item.id);
      }
    } catch (e) {
      // silently fail
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> toggleWishlist(String productId) async {
    try {
      if (isWishlisted(productId)) {
        final res = await _wishlistService.removeFromWishlist(productId);
        if (res['success'] == true) {
          _wishlistIds.remove(productId);
          _items.removeWhere((p) => p.id == productId);
          notifyListeners();
          return true;
        }
      } else {
        final res = await _wishlistService.addToWishlist(productId);
        if (res['success'] == true) {
          _wishlistIds.add(productId);
          // Load full list to get product details
          await loadWishlist();
          return true;
        }
      }
    } catch (e) {
      // error
    }
    return false;
  }
}
