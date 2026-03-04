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
    final bool isAdding = !isWishlisted(productId);

    // Optimistic UI update
    if (isAdding) {
      _wishlistIds.add(productId);
    } else {
      _wishlistIds.remove(productId);
      _items.removeWhere((p) => p.id == productId);
    }
    notifyListeners();

    try {
      if (!isAdding) {
        final res = await _wishlistService.removeFromWishlist(productId);
        if (res['success'] == true) {
          return true;
        }
      } else {
        final res = await _wishlistService.addToWishlist(productId);
        if (res['success'] == true) {
          // Fetch items silently without clearing the optimistically added ID
          final newItems = await _wishlistService.getWishlist();
          _items = newItems;
          for (final item in _items) {
            _wishlistIds.add(item.id);
          }
          notifyListeners();
          return true;
        }
      }
    } catch (e) {
      // error
    }

    // Revert optimistic update on failure
    if (isAdding) {
      _wishlistIds.remove(productId);
    } else {
      _wishlistIds.add(productId);
      loadWishlist(); // reload fully to restore items
    }
    notifyListeners();
    return false;
  }
}
