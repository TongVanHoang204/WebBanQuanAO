class Product {
  final String id;
  final String? categoryId;
  final String? brandId;
  final String sku;
  final String name;
  final String slug;
  final String? description;
  final double basePrice;
  final double? compareAtPrice;
  final bool isActive;
  final String? metaTitle;
  final String? metaDescription;
  final List<ProductVariant> variants;
  final List<ProductImage> images;
  final Category? category;
  final Brand? brand;
  final DateTime? createdAt;

  Product({
    required this.id,
    this.categoryId,
    this.brandId,
    required this.sku,
    required this.name,
    required this.slug,
    this.description,
    required this.basePrice,
    this.compareAtPrice,
    this.isActive = true,
    this.metaTitle,
    this.metaDescription,
    this.variants = const [],
    this.images = const [],
    this.category,
    this.brand,
    this.createdAt,
  });

  String get primaryImageUrl {
    final primary = images.where((i) => i.isPrimary).toList();
    if (primary.isNotEmpty) return primary.first.url;
    if (images.isNotEmpty) return images.first.url;
    return '';
  }

  double get discountPercent {
    if (compareAtPrice == null || compareAtPrice! <= basePrice) return 0;
    return ((compareAtPrice! - basePrice) / compareAtPrice! * 100);
  }

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'].toString(),
      categoryId: json['category_id']?.toString(),
      brandId: json['brand_id']?.toString(),
      sku: json['sku'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      description: json['description'],
      basePrice: _toDouble(json['base_price']),
      compareAtPrice: json['compare_at_price'] != null
          ? _toDouble(json['compare_at_price'])
          : null,
      isActive: json['is_active'] == true || json['is_active'] == 1,
      metaTitle: json['meta_title'],
      metaDescription: json['meta_description'],
      variants: json['product_variants'] != null
          ? (json['product_variants'] as List)
              .map((v) => ProductVariant.fromJson(v))
              .toList()
          : [],
      images: json['product_images'] != null
          ? (json['product_images'] as List)
              .map((i) => ProductImage.fromJson(i))
              .toList()
          : [],
      category: json['category'] != null
          ? Category.fromJson(json['category'])
          : null,
      brand: json['brand'] != null ? Brand.fromJson(json['brand']) : null,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}

class ProductVariant {
  final String id;
  final String variantSku;
  final double price;
  final double? compareAtPrice;
  final double? cost;
  final int stockQty;
  final bool isActive;
  final String? imageUrl;
  final List<VariantOptionValue> optionValues;

  ProductVariant({
    required this.id,
    required this.variantSku,
    required this.price,
    this.compareAtPrice,
    this.cost,
    required this.stockQty,
    this.isActive = true,
    this.imageUrl,
    this.optionValues = const [],
  });

  bool get inStock => stockQty > 0;

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    return ProductVariant(
      id: json['id'].toString(),
      variantSku: json['variant_sku'] ?? '',
      price: Product._toDouble(json['price']),
      compareAtPrice: json['compare_at_price'] != null
          ? Product._toDouble(json['compare_at_price'])
          : null,
      cost: json['cost'] != null ? Product._toDouble(json['cost']) : null,
      stockQty: json['stock_qty'] ?? 0,
      isActive: json['is_active'] == true || json['is_active'] == 1,
      imageUrl: json['image_url'],
      optionValues: json['variant_option_values'] != null
          ? (json['variant_option_values'] as List)
              .map((v) => VariantOptionValue.fromJson(v))
              .toList()
          : [],
    );
  }
}

class ProductImage {
  final String id;
  final String url;
  final String? altText;
  final bool isPrimary;
  final int sortOrder;

  ProductImage({
    required this.id,
    required this.url,
    this.altText,
    this.isPrimary = false,
    this.sortOrder = 0,
  });

  factory ProductImage.fromJson(Map<String, dynamic> json) {
    return ProductImage(
      id: json['id'].toString(),
      url: json['url'] ?? '',
      altText: json['alt_text'],
      isPrimary: json['is_primary'] == true || json['is_primary'] == 1,
      sortOrder: json['sort_order'] ?? 0,
    );
  }
}

class VariantOptionValue {
  final String optionName;
  final String value;

  VariantOptionValue({required this.optionName, required this.value});

  factory VariantOptionValue.fromJson(Map<String, dynamic> json) {
    return VariantOptionValue(
      optionName: json['option_value']?['option']?['name'] ?? '',
      value: json['option_value']?['value'] ?? '',
    );
  }
}

class Category {
  final String id;
  final String name;
  final String slug;

  Category({required this.id, required this.name, required this.slug});

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
    );
  }
}

class Brand {
  final String id;
  final String name;
  final String? logo;

  Brand({required this.id, required this.name, this.logo});

  factory Brand.fromJson(Map<String, dynamic> json) {
    return Brand(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      logo: json['logo'],
    );
  }
}
