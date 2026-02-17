import '../config/api_config.dart';
import '../models/product.dart';
import '../models/category.dart';
import '../models/banner.dart';
import '../models/review.dart';
import 'api_service.dart';

class ProductService {
  final ApiService _api = ApiService();

  Future<Map<String, dynamic>> getProducts({
    int page = 1,
    int limit = 10,
    String? category,
    String? categoryId,
    String? sort,
    double? minPrice,
    double? maxPrice,
    bool? onSale,
    int? minDiscount,
    String? brand,
  }) async {
    final params = <String, dynamic>{'page': page, 'limit': limit};
    if (category != null) params['category'] = category;
    if (categoryId != null) params['category'] = categoryId;
    if (sort != null) params['sort'] = sort;
    if (minPrice != null) params['min_price'] = minPrice;
    if (maxPrice != null) params['max_price'] = maxPrice;
    if (onSale == true) params['on_sale'] = true;
    if (minDiscount != null) params['min_discount'] = minDiscount;
    if (brand != null) params['brand'] = brand;

    final res = await _api.get(ApiConfig.products, queryParameters: params);
    final data = res.data;

    List<Product> products = [];
    int totalPages = 1;
    if (data['data'] != null) {
      if (data['data'] is List) {
        products = (data['data'] as List)
            .map((p) => Product.fromJson(p))
            .toList();
      } else if (data['data'] is Map) {
        final d = data['data'] as Map<String, dynamic>;
        if (d['products'] != null) {
          products = (d['products'] as List)
              .map((p) => Product.fromJson(p))
              .toList();
        }
      }
    }
    if (data['pagination'] != null) {
      totalPages = data['pagination']['totalPages'] ?? 1;
    }

    return {
      'products': products,
      'pagination': data['pagination'],
      'totalPages': totalPages,
    };
  }

  Future<List<Product>> getNewArrivals() async {
    final res = await _api.get(ApiConfig.newArrivals);
    if (res.data['data'] != null) {
      return (res.data['data'] as List)
          .map((p) => Product.fromJson(p))
          .toList();
    }
    return [];
  }

  Future<List<Product>> searchProducts(String query) async {
    final res = await _api.get(
      ApiConfig.searchProducts,
      queryParameters: {'q': query},
    );
    if (res.data['data'] != null) {
      return (res.data['data'] as List)
          .map((p) => Product.fromJson(p))
          .toList();
    }
    return [];
  }

  Future<Product?> getProductBySlug(String slug) async {
    final res = await _api.get(ApiConfig.productBySlug(slug));
    if (res.data['data'] != null) {
      return Product.fromJson(res.data['data']);
    }
    return null;
  }

  Future<Product?> getProductById(String id) async {
    final res = await _api.get(ApiConfig.productById(id));
    if (res.data['data'] != null) {
      return Product.fromJson(res.data['data']);
    }
    return null;
  }

  // Categories
  Future<List<CategoryModel>> getCategories() async {
    final res = await _api.get(ApiConfig.categories);
    if (res.data['data'] != null) {
      return (res.data['data'] as List)
          .map((c) => CategoryModel.fromJson(c))
          .toList();
    }
    return [];
  }

  // Banners
  Future<List<BannerModel>> getBanners() async {
    final res = await _api.get(ApiConfig.banners);
    if (res.data['data'] != null) {
      return (res.data['data'] as List)
          .map((b) => BannerModel.fromJson(b))
          .toList();
    }
    return [];
  }

  // Reviews
  Future<List<Review>> getProductReviews(String productId) async {
    final res = await _api.get(ApiConfig.productReviews(productId));
    if (res.data['data'] != null) {
      final reviewsData = res.data['data'];
      if (reviewsData is Map && reviewsData['reviews'] != null) {
        return (reviewsData['reviews'] as List)
            .map((r) => Review.fromJson(r))
            .toList();
      }
      if (reviewsData is List) {
        return reviewsData.map((r) => Review.fromJson(r)).toList();
      }
    }
    return [];
  }

  Future<Map<String, dynamic>> createReview(Review review) async {
    final res = await _api.post(ApiConfig.createReview, data: review.toJson());
    return res.data;
  }
}
