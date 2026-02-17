import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import '../../config/api_config.dart';
import '../../models/product.dart';
import '../../models/review.dart';
import '../../services/product_service.dart';
import '../../providers/cart_provider.dart';
import '../../providers/wishlist_provider.dart';

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({super.key});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final ProductService _productService = ProductService();

  Product? _product;
  List<Review> _reviews = [];
  bool _loading = true;
  int _selectedImageIndex = 0;
  ProductVariant? _selectedVariant;
  int _qty = 1;

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
      final product = await _productService.getProductBySlug(slug);
      List<Review> reviews = [];
      if (product != null) {
        reviews = await _productService.getProductReviews(product.id);
      }
      if (mounted) {
        setState(() {
          _product = product;
          _reviews = reviews;
          _selectedVariant = product?.variants.isNotEmpty == true
              ? product!.variants.first
              : null;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _getImageUrl(String url) {
    if (url.startsWith('http')) return url;
    return '${ApiConfig.baseUrl}$url';
  }

  String _formatPrice(double price) {
    final formatted = price
        .toStringAsFixed(0)
        .replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
    return '${formatted}đ';
  }

  Future<void> _addToCart() async {
    if (_selectedVariant == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn phiên bản sản phẩm')),
      );
      return;
    }

    final cart = Provider.of<CartProvider>(context, listen: false);
    final success = await cart.addToCart(_selectedVariant!.id, qty: _qty);

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success ? 'Đã thêm vào giỏ hàng!' : 'Không thể thêm vào giỏ hàng',
        ),
        backgroundColor: success
            ? const Color(0xFF2E7D32)
            : Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(backgroundColor: Colors.black, elevation: 0),
        body: const Center(
          child: CircularProgressIndicator(color: Color(0xFFD4AF37)),
        ),
      );
    }

    if (_product == null) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(backgroundColor: Colors.black, elevation: 0),
        body: const Center(
          child: Text(
            'Không tìm thấy sản phẩm',
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }

    final product = _product!;
    final currentPrice = _selectedVariant?.price ?? product.basePrice;

    return Scaffold(
      backgroundColor: Colors.black,
      body: CustomScrollView(
        slivers: [
          // Image Gallery
          SliverAppBar(
            expandedHeight: 400,
            pinned: true,
            backgroundColor: const Color(0xFF0A0A0A),
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.arrow_back_ios_new,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              onPressed: () => Navigator.of(context).pop(),
            ),
            actions: [
              Consumer<WishlistProvider>(
                builder: (_, wishlist, __) => IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      wishlist.isWishlisted(product.id)
                          ? Icons.favorite
                          : Icons.favorite_border,
                      color: wishlist.isWishlisted(product.id)
                          ? Colors.red
                          : Colors.white,
                      size: 20,
                    ),
                  ),
                  onPressed: () => wishlist.toggleWishlist(product.id),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: product.images.isNotEmpty
                  ? Stack(
                      children: [
                        PageView.builder(
                          itemCount: product.images.length,
                          onPageChanged: (i) =>
                              setState(() => _selectedImageIndex = i),
                          itemBuilder: (_, i) => CachedNetworkImage(
                            imageUrl: _getImageUrl(product.images[i].url),
                            fit: BoxFit.cover,
                            placeholder: (_, __) =>
                                Container(color: const Color(0xFF1A1A1A)),
                          ),
                        ),
                        // Dots indicator
                        if (product.images.length > 1)
                          Positioned(
                            bottom: 16,
                            left: 0,
                            right: 0,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(
                                product.images.length,
                                (i) => Container(
                                  width: i == _selectedImageIndex ? 24 : 8,
                                  height: 8,
                                  margin: const EdgeInsets.symmetric(
                                    horizontal: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: i == _selectedImageIndex
                                        ? const Color(0xFFD4AF37)
                                        : Colors.white.withValues(alpha: 0.3),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    )
                  : Container(
                      color: const Color(0xFF1A1A1A),
                      child: const Icon(
                        Icons.image,
                        color: Colors.grey,
                        size: 60,
                      ),
                    ),
            ),
          ),

          // Product Info
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Brand
                  if (product.brand != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        product.brand!.name.toUpperCase(),
                        style: TextStyle(
                          color: const Color(0xFFD4AF37).withValues(alpha: 0.8),
                          fontSize: 12,
                          letterSpacing: 2,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),

                  // Name
                  Text(
                    product.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Price
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        _formatPrice(currentPrice),
                        style: const TextStyle(
                          color: Color(0xFFD4AF37),
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      if (product.compareAtPrice != null &&
                          product.compareAtPrice! > currentPrice) ...[
                        const SizedBox(width: 12),
                        Text(
                          _formatPrice(product.compareAtPrice!),
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.3),
                            fontSize: 16,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.red.shade700,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '-${product.discountPercent.toInt()}%',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Variants
                  if (product.variants.isNotEmpty) ...[
                    const Text(
                      'Phiên bản',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: product.variants.map((v) {
                        final isSelected = _selectedVariant?.id == v.id;
                        final label = v.optionValues.isNotEmpty
                            ? v.optionValues.map((ov) => ov.value).join(' / ')
                            : v.variantSku;
                        return GestureDetector(
                          onTap: v.inStock
                              ? () => setState(() => _selectedVariant = v)
                              : null,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? const Color(
                                      0xFFD4AF37,
                                    ).withValues(alpha: 0.15)
                                  : const Color(0xFF1A1A1A),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSelected
                                    ? const Color(0xFFD4AF37)
                                    : v.inStock
                                    ? Colors.white.withValues(alpha: 0.1)
                                    : Colors.white.withValues(alpha: 0.04),
                                width: isSelected ? 1.5 : 1,
                              ),
                            ),
                            child: Text(
                              label,
                              style: TextStyle(
                                color: isSelected
                                    ? const Color(0xFFD4AF37)
                                    : v.inStock
                                    ? Colors.white
                                    : Colors.white.withValues(alpha: 0.3),
                                fontSize: 13,
                                fontWeight: isSelected
                                    ? FontWeight.w600
                                    : FontWeight.normal,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Description
                  if (product.description != null &&
                      product.description!.isNotEmpty) ...[
                    const Text(
                      'Mô tả sản phẩm',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      product.description!,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.6),
                        fontSize: 14,
                        height: 1.6,
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Reviews
                  if (_reviews.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Đánh giá (${_reviews.length})',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Row(
                          children: [
                            const Icon(
                              Icons.star,
                              color: Color(0xFFD4AF37),
                              size: 18,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              (_reviews.fold(0, (sum, r) => sum + r.rating) /
                                      _reviews.length)
                                  .toStringAsFixed(1),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ...(_reviews.take(3).map((r) => _buildReviewCard(r))),
                    if (_reviews.length > 3)
                      TextButton(
                        onPressed: () => Navigator.of(context).pushNamed(
                          '/reviews',
                          arguments: {
                            'productId': product.id,
                            'productName': product.name,
                          },
                        ),
                        child: Text(
                          'Xem tất cả ${_reviews.length} đánh giá →',
                          style: const TextStyle(
                            color: Color(0xFFD4AF37),
                            fontSize: 13,
                          ),
                        ),
                      ),
                    const SizedBox(height: 8),
                  ],

                  // Write review button
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.of(context).pushNamed(
                        '/reviews',
                        arguments: {
                          'productId': product.id,
                          'productName': product.name,
                        },
                      ),
                      icon: const Icon(Icons.rate_review_outlined, size: 18),
                      label: Text(
                        _reviews.isEmpty
                            ? 'Viết đánh giá đầu tiên'
                            : 'Viết đánh giá',
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFD4AF37),
                        side: BorderSide(
                          color: const Color(0xFFD4AF37).withValues(alpha: 0.3),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),

      // Bottom bar: Qty + Add to cart
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF0A0A0A),
          border: Border(
            top: BorderSide(color: Colors.white.withValues(alpha: 0.06)),
          ),
        ),
        child: SafeArea(
          child: Row(
            children: [
              // Qty selector
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF1A1A1A),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(
                        Icons.remove,
                        color: Colors.white,
                        size: 18,
                      ),
                      onPressed: _qty > 1 ? () => setState(() => _qty--) : null,
                    ),
                    Text(
                      '$_qty',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.add,
                        color: Colors.white,
                        size: 18,
                      ),
                      onPressed: () => setState(() => _qty++),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Add to cart button
              Expanded(
                child: SizedBox(
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: _addToCart,
                    icon: const Icon(Icons.shopping_bag_outlined, size: 20),
                    label: const Text(
                      'Thêm vào giỏ',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFD4AF37),
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 0,
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

  Widget _buildReviewCard(Review review) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              RatingBarIndicator(
                rating: review.rating.toDouble(),
                itemBuilder: (_, __) =>
                    const Icon(Icons.star, color: Color(0xFFD4AF37)),
                itemCount: 5,
                itemSize: 16,
              ),
              const SizedBox(width: 8),
              Text(
                review.authorName ?? 'Ẩn danh',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5),
                  fontSize: 12,
                ),
              ),
            ],
          ),
          if (review.content != null && review.content!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              review.content!,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
