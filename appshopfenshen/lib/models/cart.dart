import 'product.dart';

class Cart {
  final String id;
  final List<CartItem> items;
  final double totalPrice;
  final int totalItems;

  Cart({
    required this.id,
    this.items = const [],
    this.totalPrice = 0,
    this.totalItems = 0,
  });

  factory Cart.fromJson(Map<String, dynamic> json) {
    final itemsList = json['cart_items'] != null
        ? (json['cart_items'] as List).map((i) => CartItem.fromJson(i)).toList()
        : <CartItem>[];

    double total = 0;
    int count = 0;
    for (final item in itemsList) {
      total += item.price * item.qty;
      count += item.qty;
    }

    return Cart(
      id: json['id'].toString(),
      items: itemsList,
      totalPrice: total,
      totalItems: count,
    );
  }
}

class CartItem {
  final String id;
  final String variantId;
  final int qty;
  final double price;
  final ProductVariant? variant;
  final Product? product;

  CartItem({
    required this.id,
    required this.variantId,
    required this.qty,
    required this.price,
    this.variant,
    this.product,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    final variant = json['variant'] != null
        ? ProductVariant.fromJson(json['variant'])
        : null;

    // Product can be nested inside variant
    Product? product;
    if (json['variant']?['product'] != null) {
      product = Product.fromJson(json['variant']['product']);
    }

    return CartItem(
      id: json['id'].toString(),
      variantId: json['variant_id'].toString(),
      qty: json['qty'] ?? 1,
      price: _toDouble(json['price_at_add'] ?? json['price'] ?? variant?.price),
      variant: variant,
      product: product,
    );
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}
