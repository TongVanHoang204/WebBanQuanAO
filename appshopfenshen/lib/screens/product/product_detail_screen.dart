import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:flutter_html/flutter_html.dart';
import '../../config/api_config.dart';
import '../../models/product.dart';
import '../../models/review.dart';
import '../../services/product_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/wishlist_provider.dart';

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({super.key});
  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  String _selectedSize = '';
  String _selectedColor = '';
  bool _loading = true;
  Product? _product;
  List<Review> _reviews = [];
  ProductVariant? _selVariant;
  int _qty = 1;
  bool _addingToCart = false;
  int _imgIdx = 0;
  final ProductService _ps = ProductService();

  static const Color _bg = Color(0xFFF9F6FF);
  static const Color _surface = Colors.white;
  static const Color _primary = Color(0xFF7F19E6);
  static const Color _text = Color(0xFF140E1B);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_product == null) {
      final slug = ModalRoute.of(context)?.settings.arguments as String?;
      if (slug != null) _loadProduct(slug);
    }
  }

  Future<void> _loadProduct(String slug) async {
    try {
      final product = await _ps.getProductBySlug(slug);
      List<Review> reviews = [];
      if (product != null) reviews = await _ps.getProductReviews(product.id);
      if (mounted) {
        setState(() {
          _product = product;
          _reviews = reviews;
          if (product?.variants.isNotEmpty == true) {
            _selVariant = product!.variants.first;
            // Try to figure out size and color from options
            for (var val in _selVariant!.optionValues) {
              if (val.optionName.toLowerCase() == 'size' ||
                  val.optionName.toLowerCase() == 'kích thước') {
                _selectedSize = val.value;
              } else if (val.optionName.toLowerCase() == 'color' ||
                  val.optionName.toLowerCase() == 'màu sắc') {
                _selectedColor = val.value;
              }
            }
          }
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _updateVariantSelection() {
    if (_product == null) return;
    // Find variant matching both size and color if possible
    for (var v in _product!.variants) {
      bool matchSize = _selectedSize.isEmpty;
      bool matchColor = _selectedColor.isEmpty;
      for (var o in v.optionValues) {
        if (o.optionName.toLowerCase() == 'size' ||
            o.optionName.toLowerCase() == 'kích thước') {
          if (o.value == _selectedSize) matchSize = true;
        } else if (o.optionName.toLowerCase() == 'color' ||
            o.optionName.toLowerCase() == 'màu sắc') {
          if (o.value == _selectedColor) matchColor = true;
        }
      }
      if (matchSize && matchColor) {
        setState(() => _selVariant = v);
        return;
      }
    }
    // Fallback if not perfectly matching
    for (var v in _product!.variants) {
      for (var o in v.optionValues) {
        if (o.value == _selectedSize || o.value == _selectedColor) {
          setState(() => _selVariant = v);
          return;
        }
      }
    }
  }

  String _img(String u) => u.startsWith('http') ? u : '${ApiConfig.baseUrl}$u';
  String _price(double p) {
    final f = p
        .toStringAsFixed(0)
        .replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
    return '${f}đ'; // Fallback to VND format although mockup says $
  }

  bool get _isOutOfStock {
    if (_product == null) return true;
    if (_product!.variants.isEmpty) return true;
    if (_selVariant != null) return _selVariant!.stockQty <= 0;
    return _product!.variants.every((v) => v.stockQty <= 0);
  }

  Future<bool> _addToCart() async {
    // Login guard
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (!auth.isLoggedIn) {
      final goLogin = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Chưa đăng nhập'),
        content: const Text('Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Để sau', style: TextStyle(color: Colors.grey.shade500))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Đăng nhập', style: TextStyle(color: _primary, fontWeight: FontWeight.w700))),
        ]));
      if (goLogin == true && mounted) Navigator.of(context).pushNamed('/login');
      return false;
    }

    // Out-of-stock guard
    if (_isOutOfStock) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: const Text('Sản phẩm hiện đã hết hàng'), backgroundColor: Colors.orange.shade400, behavior: SnackBarBehavior.floating));
      return false;
    }

    // Variant selection guard
    if (_selVariant == null && _product?.variants.isNotEmpty == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn phiên bản sản phẩm'), behavior: SnackBarBehavior.floating));
      return false;
    }

    setState(() => _addingToCart = true);
    final targetId = _selVariant?.id ?? _product!.id;
    final cart = Provider.of<CartProvider>(context, listen: false);
    final ok = await cart.addToCart(targetId, qty: _qty);
    if (!mounted) return false;
    setState(() => _addingToCart = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok ? 'Đã thêm vào giỏ hàng!' : 'Không thể thêm vào giỏ hàng'),
        backgroundColor: ok ? Colors.green : Colors.red.shade400,
        behavior: SnackBarBehavior.floating,
      ),
    );
    return ok;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: _bg,
        body: const Center(child: CircularProgressIndicator(color: _primary)),
      );
    }
    if (_product == null) {
      return Scaffold(
        backgroundColor: _bg,
        appBar: AppBar(
          backgroundColor: _bg,
          elevation: 0,
          leading: const BackButton(color: _text),
        ),
        body: const Center(child: Text('Không tìm thấy sản phẩm')),
      );
    }

    final p = _product!;
    final price = _selVariant?.price ?? p.basePrice;

    // Extract sizes and colors for UI
    Set<String> sizes = {};
    Set<String> colors = {};
    for (var v in p.variants) {
      for (var o in v.optionValues) {
        if (o.optionName.toLowerCase() == 'size' ||
            o.optionName.toLowerCase() == 'kích thước' ||
            o.optionName.toLowerCase() == 'size (chữ)') {
          sizes.add(o.value);
        } else if (o.optionName.toLowerCase() == 'color' ||
            o.optionName.toLowerCase() == 'màu sắc') {
          colors.add(o.value);
        }
      }
      // If no option names exist but variantSku looks like Size
      if (v.optionValues.isEmpty) {
        sizes.add(v.variantSku.split('-').last); // Fallback
      }
    }
    // Set initial size/color if empty and variants exist
    if (_selectedSize.isEmpty && sizes.isNotEmpty) _selectedSize = sizes.first;
    if (_selectedColor.isEmpty && colors.isNotEmpty) _selectedColor = colors.first;


    // Review Stats
    double avgRating = 0;
    int fiveStars = 0;
    int fourStars = 0;
    if (_reviews.isNotEmpty) {
      for (var r in _reviews) {
        avgRating += r.rating;
        if (r.rating == 5) fiveStars++;
        if (r.rating == 4) fourStars++;
      }
      avgRating /= _reviews.length;
    }

    return Scaffold(
      backgroundColor: _surface, // White background overall
      body: CustomScrollView(
        slivers: [
          // 1. Image Carousel with Floating action buttons
          SliverToBoxAdapter(
            child: SizedBox(
              height: 480,
              child: Stack(
                children: [
                  PageView.builder(
                    itemCount: p.images.isNotEmpty ? p.images.length : 1,
                    onPageChanged: (i) => setState(() => _imgIdx = i),
                    itemBuilder: (_, i) => p.images.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: _img(p.images[i].url),
                            fit: BoxFit.cover,
                            width: double.infinity,
                            placeholder: (_, __) =>
                                Container(color: Colors.grey.shade100),
                            errorWidget: (_, __, ___) =>
                                Container(color: Colors.grey.shade100),
                          )
                        : Container(
                            color: Colors.grey.shade100,
                            child: const Icon(Icons.image, size: 60, color: Colors.grey),
                          ),
                  ),
                  // Pagination dots
                  if (p.images.length > 1)
                    Positioned(
                      bottom: 20,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          p.images.length,
                          (i) => Container(
                            width: 8,
                            height: 8,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            decoration: BoxDecoration(
                              color: i == _imgIdx
                                  ? Colors.white
                                  : Colors.white.withAlpha(128),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      ),
                    ),
                  // Floating action buttons (Top)
                  Positioned(
                    top: MediaQuery.of(context).padding.top + 10,
                    left: 20,
                    child: _buildCircleBtn(
                      Icons.arrow_back,
                      () => Navigator.of(context).pop(),
                    ),
                  ),
                  Positioned(
                    top: MediaQuery.of(context).padding.top + 10,
                    right: 20,
                    child: Row(
                      children: [
                        Consumer<WishlistProvider>(
                          builder: (_, wl, __) => _buildCircleBtn(
                            wl.isWishlisted(p.id) ? Icons.favorite : Icons.favorite_border,
                            () => wl.toggleWishlist(p.id),
                            iconColor: wl.isWishlisted(p.id) ? Colors.white : Colors.white,
                          ),
                        ),
                        const SizedBox(width: 12),
                        _buildCircleBtn(Icons.share, () {}),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 2. Info Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and Price Side-by-side
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          p.name,
                          style: const TextStyle(
                            color: _text,
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            height: 1.2,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Text(
                        _price(price),
                        style: const TextStyle(
                          color: _primary,
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Reviews Stars Row
                  Row(
                    children: [
                      RatingBarIndicator(
                        rating: avgRating,
                        itemBuilder: (_, __) => const Icon(Icons.star, color: Colors.amber),
                        itemCount: 5,
                        itemSize: 16,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${avgRating.toStringAsFixed(1)} ',
                        style: const TextStyle(
                          color: _text,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '(${_reviews.length} đánh giá)',
                        style: TextStyle(
                          color: Colors.grey.shade500,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Select Size
                  if (sizes.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Chọn Kích Thước',
                          style: TextStyle(
                            color: _text,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {},
                          child: const Text(
                            'Hướng dẫn chọn size',
                            style: TextStyle(
                              color: _primary,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: sizes.map((sizeStr) {
                        final isSel = _selectedSize == sizeStr;
                        return GestureDetector(
                          onTap: () {
                            setState(() => _selectedSize = sizeStr);
                            _updateVariantSelection();
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: isSel ? _primary : _surface,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isSel ? _primary : Colors.grey.shade300,
                                width: isSel ? 0 : 1.5,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                sizeStr,
                                style: TextStyle(
                                  color: isSel ? Colors.white : _text,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 28),
                  ],

                  // Select Color
                  if (colors.isNotEmpty) ...[
                    const Text(
                      'Chọn Màu Sắc',
                      style: TextStyle(
                        color: _text,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: colors.map((colStr) {
                        final isSel = _selectedColor == colStr;
                        // Map popular color names to Flutter Colors for UI rendering
                        Color c = Colors.grey.shade200; // fallback
                        String cLower = colStr.toLowerCase();
                        if (cLower.contains('black') || cLower.contains('đen')) c = Colors.black;
                        if (cLower.contains('white') || cLower.contains('trắng')) c = const Color(0xFFF9F9F9);
                        if (cLower.contains('red') || cLower.contains('đỏ')) c = Colors.red;
                        if (cLower.contains('blue') || cLower.contains('xanh dương')) c = Colors.blue;
                        if (cLower.contains('green') || cLower.contains('xanh lá')) c = Colors.green;
                        if (cLower.contains('yellow') || cLower.contains('vàng')) c = Colors.yellow.shade300;
                        if (cLower.contains('purple') || cLower.contains('tím') || cLower.contains('lavender')) c = const Color(0xFFE6E6FA); // Lavender approx
                        if (cLower.contains('pink') || cLower.contains('hồng')) c = Colors.pink.shade100;
                        if (cLower.contains('grey') || cLower.contains('gray') || cLower.contains('xám')) c = Colors.grey;

                        return GestureDetector(
                          onTap: () {
                            setState(() => _selectedColor = colStr);
                            _updateVariantSelection();
                          },
                          child: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isSel ? _primary : Colors.transparent,
                                width: 2,
                              ),
                            ),
                            padding: const EdgeInsets.all(4),
                            child: Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: c,
                                border: Border.all(
                                  color: Colors.black.withAlpha(20),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 32),
                  ],

                  // Collapsible Info Sections
                  _buildExpansionTile(
                    'Mô tả sản phẩm',
                    p.description?.isNotEmpty == true
                        ? p.description!
                        : 'Sản phẩm này chưa có mô tả.',
                  ),
                  const Divider(height: 1, color: Color(0xFFEEEEEE)),
                  _buildExpansionTile(
                    'Chất liệu & Bảo quản',
                    '100% Cotton / lụa pha tùy theo phiên bản. Giặt tay hoặc giặt máy chế độ nhẹ.',
                  ),
                  const Divider(height: 1, color: Color(0xFFEEEEEE)),
                  _buildExpansionTile(
                    'Giao hàng & Đổi trả',
                    'Giao hàng tiêu chuẩn miễn phí trong nội thành. Đổi trả trong vòng 7 ngày nếu lỗi từ nhà sản xuất.',
                  ),
                  const Divider(height: 1, color: Color(0xFFEEEEEE)),
                  const SizedBox(height: 32),

                  // Reviews Summary
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Đánh giá (${_reviews.length})',
                        style: const TextStyle(
                          color: _text,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.of(context).pushNamed(
                          '/reviews',
                          arguments: {
                            'productId': p.id,
                            'productName': p.name,
                          },
                        ),
                        child: const Text(
                          'Xem tất cả',
                          style: TextStyle(
                            color: _primary,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (_reviews.isNotEmpty) ...[
                    _buildReviewProgressLine('5', fiveStars / _reviews.length),
                    const SizedBox(height: 8),
                    _buildReviewProgressLine('4', fourStars / _reviews.length),
                  ],

                  const SizedBox(height: 100), // padding for bottom bar
                ],
              ),
            ),
          ),
        ],
      ),

      // Fixed Bottom Navigation Bar
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        decoration: BoxDecoration(
          color: _surface,
          border: Border(top: BorderSide(color: Colors.grey.shade100)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(10), // ~0.04 alpha
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              // Add to Cart Button (Outline)
              Expanded(
                child: SizedBox(
                  height: 52,
                  child: OutlinedButton(
                    onPressed: (_addingToCart || _isOutOfStock) ? null : () => _addToCart(),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _text,
                      side: BorderSide(color: _isOutOfStock ? Colors.grey.shade300 : Colors.grey.shade200, width: 2),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: _addingToCart
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: _primary))
                      : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.shopping_bag_outlined, size: 20, color: _isOutOfStock ? Colors.grey.shade400 : _text),
                        const SizedBox(width: 8),
                        Text(
                          _isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: _isOutOfStock ? Colors.grey.shade400 : null,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              // Buy Now Button (Solid)
              Expanded(
                child: SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: (_addingToCart || _isOutOfStock) ? null : () async {
                      final ok = await _addToCart();
                      if (ok && mounted) Navigator.of(context).pushNamed('/checkout');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isOutOfStock ? Colors.grey.shade300 : _primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Text(
                      _isOutOfStock ? 'Hết hàng' : 'Mua ngay',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Helper Widgets

  Widget _buildCircleBtn(IconData icon, VoidCallback onTap, {Color iconColor = Colors.white}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(64), // translucent white
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 20, color: iconColor),
      ),
    );
  }

  Widget _buildExpansionTile(String title, String content) {
    // We can use a plain ExpansionTile with custom styling
    return Theme(
      data: Theme.of(context).copyWith(
        dividerColor: Colors.transparent,
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
      ),
      child: ExpansionTile(
        title: Text(
          title,
          style: const TextStyle(
            color: _text,
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
        ),
        tilePadding: EdgeInsets.zero,
        iconColor: Colors.grey.shade500,
        collapsedIconColor: Colors.grey.shade500,
        childrenPadding: const EdgeInsets.only(bottom: 20),
        children: [
          Html(
            data: content,
            style: {
              "body": Style(
                color: Colors.grey.shade600,
                margin: Margins.zero,
                padding: HtmlPaddings.zero,
                fontSize: FontSize(14.0),
              ),
              "p": Style(
                margin: Margins.zero,
                padding: HtmlPaddings.zero,
              ),
            },
          ),
        ],
      ),
    );
  }

  Widget _buildReviewProgressLine(String star, double percent) {
    return Row(
      children: [
        Text(
          '$star',
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(width: 4),
        const Icon(Icons.star, size: 12, color: _text), // Black star in mockup
        const SizedBox(width: 12),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: percent,
              backgroundColor: Colors.grey.shade100,
              valueColor: const AlwaysStoppedAnimation(_primary),
              minHeight: 6,
            ),
          ),
        ),
      ],
    );
  }
}
