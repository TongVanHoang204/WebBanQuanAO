import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../../config/api_config.dart';
import '../../models/product.dart';
import '../../models/banner.dart' as app;
import '../../models/category.dart';
import '../../services/product_service.dart';
import '../../providers/cart_provider.dart';
import '../../providers/wishlist_provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ProductService _productService = ProductService();

  List<app.BannerModel> _banners = [];
  List<CategoryModel> _categories = [];
  List<Product> _newArrivals = [];
  List<Product> _flashSaleProducts = [];
  List<Product> _bestSellers = [];
  bool _loading = true;
  int _selectedCategoryIndex = 0;


  static const _primary = Color(0xFF7F19E6);
  static const _bgLight = Color(0xFFF7F6F8);
  static const _surfaceLight = Color(0xFFFFFFFF);
  static const _textDark = Color(0xFF140E1B);

  @override
  void initState() {
    super.initState();
    _loadData();
  }
  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        _productService.getBanners(),
        _productService.getCategories(),
        _productService.getNewArrivals(),
        _productService.getProducts(onSale: true, limit: 6, minDiscount: 10),
        _productService.getProducts(sort: 'best_seller', limit: 6),
      ]);

      if (mounted) {
        setState(() {
          _banners = results[0] as List<app.BannerModel>;
          _categories = results[1] as List<CategoryModel>;
          _newArrivals = results[2] as List<Product>;
          final flashData = results[3] as Map<String, dynamic>;
          _flashSaleProducts = flashData['products'] as List<Product>;
          final bestData = results[4] as Map<String, dynamic>;
          _bestSellers = bestData['products'] as List<Product>;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _getImageUrl(String url) {
    if (url.startsWith('http')) {
      if (url.contains('localhost:4000')) {
        return url.replaceFirst('http://localhost:4000', ApiConfig.baseUrl);
      }
      return url;
    }
    if (!url.startsWith('/')) {
      url = '/uploads/$url';
    }
    return '${ApiConfig.baseUrl}$url';
  }

  String _formatPrice(double price) {
    final formatted = price
        .toStringAsFixed(0)
        .replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
    return '${formatted}d';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgLight,
      body: RefreshIndicator(
        color: _primary,
        onRefresh: _loadData,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _buildHeader()),
            SliverToBoxAdapter(
              child: _loading ? _buildBannerShimmer() : _buildHeroBanner(),
            ),
            SliverToBoxAdapter(
              child: _loading ? _buildCategoryShimmer() : _buildCategories(),
            ),
            // Flash Sale Section
            if (!_loading && _flashSaleProducts.isNotEmpty)
              SliverToBoxAdapter(child: _buildFlashSaleSection()),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Xu hướng',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: _textDark,
                      ),
                    ),
                    Row(
                      children: [
                        _circleBtn(Icons.arrow_back, () {}),
                        const SizedBox(width: 4),
                        _circleBtn(Icons.arrow_forward, () {}),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            _loading
                ? SliverToBoxAdapter(child: _buildProductShimmer())
                : SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.58,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                          ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) =>
                            _buildProductCard(_newArrivals[index]),
                        childCount: _newArrivals.length,
                      ),
                    ),
                  ),
            SliverToBoxAdapter(child: _buildPromoBanner()),
            // Best Sellers
            if (!_loading && _bestSellers.isNotEmpty)
              SliverToBoxAdapter(child: _buildBestSellersSection()),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  String _pad(int n) => n.toString().padLeft(2, '0');

  Widget _buildFlashSaleSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Container(
          margin: const EdgeInsets.fromLTRB(20, 24, 20, 0),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF7F19E6), Color(0xFFAB5CFF)],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.discount_outlined,
                color: Colors.white,
                size: 20,
              ),
              const SizedBox(width: 8),
              const Text(
                'Đang giảm giá',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => Navigator.of(context).pushNamed('/shop'),
                child: const Row(
                  children: [
                    Text(
                      'Xem tất cả',
                      style: TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                    Icon(Icons.chevron_right, color: Colors.white70, size: 16),
                  ],
                ),
              ),
            ],
          ),
        ),
        // Products horizontal scroll
        SizedBox(
          height: 200,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
            itemCount: _flashSaleProducts.length,
            itemBuilder: (_, i) => _buildFlashCard(_flashSaleProducts[i]),
          ),
        ),
      ],
    );
  }


  Widget _buildFlashCard(Product p) {
    final img = _getImageUrl(p.primaryImageUrl);
    return GestureDetector(
      onTap: () =>
          Navigator.of(context).pushNamed('/product-detail', arguments: p.slug),
      child: Container(
        width: 130,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: _surfaceLight,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(14),
                  ),
                  child: CachedNetworkImage(
                    imageUrl: img,
                    width: 130,
                    height: 110,
                    fit: BoxFit.cover,
                    placeholder: (_, __) =>
                        Container(height: 110, color: Colors.grey.shade100),
                    errorWidget: (_, __, ___) =>
                        Container(height: 110, color: Colors.grey.shade100),
                  ),
                ),
                if (p.discountPercent > 0)
                  Positioned(
                    top: 6,
                    left: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.red.shade500,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '-${p.discountPercent.toInt()}%',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: _textDark,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatPrice(p.basePrice),
                    style: const TextStyle(
                      color: _primary,
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBestSellersSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Bán chạy nhất',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: _textDark,
                ),
              ),
              GestureDetector(
                onTap: () => Navigator.of(context).pushNamed('/shop'),
                child: Text(
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
        ),
        SizedBox(
          height: 230,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
            itemCount: _bestSellers.length,
            itemBuilder: (_, i) => _buildBestSellerCard(_bestSellers[i]),
          ),
        ),
      ],
    );
  }

  Widget _buildBestSellerCard(Product p) {
    final img = _getImageUrl(p.primaryImageUrl);
    return GestureDetector(
      onTap: () =>
          Navigator.of(context).pushNamed('/product-detail', arguments: p.slug),
      child: Container(
        width: 150,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: _surfaceLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16),
                  ),
                  child: CachedNetworkImage(
                    imageUrl: img,
                    width: 150,
                    height: 140,
                    fit: BoxFit.cover,
                    placeholder: (_, __) =>
                        Container(height: 140, color: Colors.grey.shade100),
                    errorWidget: (_, __, ___) =>
                        Container(height: 140, color: Colors.grey.shade100),
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Consumer<WishlistProvider>(
                    builder: (_, wl, __) {
                      final fav = wl.isWishlisted(p.id);
                      return GestureDetector(
                        onTap: () => wl.toggleWishlist(p.id),
                        child: Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.9),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            fav
                                ? Icons.favorite_rounded
                                : Icons.favorite_border,
                            size: 14,
                            color: fav ? Colors.red : Colors.grey.shade400,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: _textDark,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatPrice(p.basePrice),
                    style: const TextStyle(
                      color: _primary,
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _circleBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 16, color: Colors.grey.shade500),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 12,
        left: 20,
        right: 20,
        bottom: 16,
      ),
      color: _bgLight,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'CHÀO MỪNG TRỞ LẠI',
                    style: TextStyle(
                      color: Colors.grey.shade500,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'CỪa Hàng Thời Trang',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: _textDark,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => Navigator.of(context).pushNamed('/cart'),
                child: Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: _surfaceLight,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.grey.shade100),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      const Icon(
                        Icons.shopping_bag_outlined,
                        size: 22,
                        color: _textDark,
                      ),
                      Consumer<CartProvider>(
                        builder: (_, cart, __) {
                          if (cart.itemCount == 0) return const SizedBox();
                          return Positioned(
                            top: 6,
                            right: 6,
                            child: Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                color: _primary,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: _surfaceLight,
                                  width: 2,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () => Navigator.of(context).pushNamed('/search'),
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                color: _surfaceLight,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  const SizedBox(width: 16),
                  Icon(
                    Icons.search,
                    color: _primary.withValues(alpha: 0.7),
                    size: 22,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Tìm kiếm áo, váy, phụ kiện...',
                    style: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                  ),
                  const Spacer(),
                  Container(
                    width: 34,
                    height: 34,
                    margin: const EdgeInsets.only(right: 8),
                    child: Icon(
                      Icons.tune,
                      size: 18,
                      color: Colors.grey.shade400,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroBanner() {
    if (_banners.isEmpty)
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: GestureDetector(
          onTap: () => Navigator.of(context).pushNamed('/products'),
          child: Container(
            height: 400,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: const LinearGradient(
                colors: [Color(0xFF7F19E6), Color(0xFFAB5CFF)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF7F19E6).withValues(alpha: 0.35),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF7F19E6),
                          const Color(0xFF5E00C8),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  ),
                  Positioned(
                    right: -30,
                    top: -20,
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.06),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Positioned(
                    right: 20,
                    bottom: -40,
                    child: Container(
                      width: 150,
                      height: 150,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(50),
                          ),
                          child: const Text(
                            'NEW SEASON',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        const Text(
                          'Th\u1eddi trang\nB\u1ed3 S\u01b0u T\u1eadp',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            height: 1.1,
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Kh\u00e1m ph\u00e1 xu h\u01b0\u1edbng m\u1ed9t nh\u1ea5t 2025',
                          style: TextStyle(color: Colors.white70, fontSize: 14),
                        ),
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 11,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(50),
                          ),
                          child: const Text(
                            'Mua ngay',
                            style: TextStyle(
                              color: Color(0xFF7F19E6),
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    final banner = _banners.first;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GestureDetector(
        onTap: () => Navigator.of(context).pushNamed('/products'),
        child: Container(
          height: 220,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Stack(
              fit: StackFit.expand,
              children: [
                CachedNetworkImage(
                  imageUrl: '${_getImageUrl(banner.imageUrl)}?v=1',
                  fit: BoxFit.cover,
                  placeholder: (_, __) =>
                      Container(color: Colors.grey.shade200),
                  errorWidget: (_, __, ___) => Container(
                    color: Colors.grey.shade200,
                    child: const Icon(
                      Icons.image,
                      color: Colors.grey,
                      size: 60,
                    ),
                  ),
                ),
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.15),
                        Colors.black.withValues(alpha: 0.6),
                      ],
                      stops: const [0.3, 0.6, 1.0],
                    ),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (banner.title.isNotEmpty)
                          Text(
                            banner.title,
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              height: 1.1,
                            ),
                          ),
                        if (banner.subtitle?.isNotEmpty == true) ...[
                          const SizedBox(height: 6),
                          Text(
                            banner.subtitle!,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.8),
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                        if (banner.buttonText?.isNotEmpty == true) ...[
                          const SizedBox(height: 12),
                          Container(
                            height: 38,
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            decoration: BoxDecoration(
                              color: _primary,
                              borderRadius: BorderRadius.circular(50),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  banner.buttonText!,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Icon(
                                  Icons.arrow_forward,
                                  size: 16,
                                  color: Colors.white,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCategories() {
    if (_categories.isEmpty) return const SizedBox();
    final chips = ['Tất cả', ..._categories.map((c) => c.name)];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Danh mục',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: _textDark,
                ),
              ),
              GestureDetector(
                onTap: () => Navigator.of(context).pushNamed('/shop'),
                child: const Text(
                  'Xem tất cả',
                  style: TextStyle(
                    color: _primary,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 42,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: chips.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final selected = _selectedCategoryIndex == index;
              return GestureDetector(
                onTap: () {
                  setState(() => _selectedCategoryIndex = index);
                  if (index > 0)
                    Navigator.of(context).pushNamed(
                      '/products',
                      arguments: {
                        'category': _categories[index - 1].slug,
                        'title': _categories[index - 1].name,
                      },
                    );
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  decoration: BoxDecoration(
                    color: selected ? _primary : _surfaceLight,
                    borderRadius: BorderRadius.circular(50),
                    border: selected
                        ? null
                        : Border.all(color: Colors.grey.shade200),
                    boxShadow: selected
                        ? [
                            BoxShadow(
                              color: _primary.withValues(alpha: 0.2),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : null,
                  ),
                  child: Center(
                    child: Text(
                      chips[index],
                      style: TextStyle(
                        color: selected ? Colors.white : Colors.grey.shade600,
                        fontSize: 13,
                        fontWeight: selected
                            ? FontWeight.w700
                            : FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildProductCard(Product product) {
    return GestureDetector(
      onTap: () => Navigator.of(
        context,
      ).pushNamed('/product-detail', arguments: product.slug),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: Colors.grey.shade100,
              ),
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: CachedNetworkImage(
                      imageUrl: _getImageUrl(product.primaryImageUrl),
                      width: double.infinity,
                      height: double.infinity,
                      fit: BoxFit.cover,
                      placeholder: (_, __) =>
                          Container(color: Colors.grey.shade100),
                      errorWidget: (_, __, ___) => Container(
                        color: Colors.grey.shade100,
                        child: Icon(
                          Icons.image,
                          color: Colors.grey.shade400,
                          size: 30,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Consumer<WishlistProvider>(
                      builder: (_, wishlist, __) {
                        final isFav = wishlist.isWishlisted(product.id);
                        return GestureDetector(
                          onTap: () => wishlist.toggleWishlist(product.id),
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.8),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.06),
                                  blurRadius: 6,
                                ),
                              ],
                            ),
                            child: Icon(
                              isFav ? Icons.favorite : Icons.favorite_border,
                              size: 16,
                              color: isFav ? Colors.red : Colors.grey.shade500,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  if (product.discountPercent > 0)
                    Positioned(
                      bottom: 10,
                      left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'SALE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            product.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: _textDark,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    _formatPrice(product.basePrice),
                    style: const TextStyle(
                      color: _primary,
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (product.compareAtPrice != null &&
                      product.compareAtPrice! > product.basePrice) ...[
                    const SizedBox(width: 6),
                    Text(
                      _formatPrice(product.compareAtPrice!),
                      style: TextStyle(
                        color: Colors.grey.shade400,
                        fontSize: 11,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                  ],
                ],
              ),
              if (product.discountPercent > 0)
                Row(
                  children: [
                    const Icon(Icons.star, size: 14, color: Colors.amber),
                    const SizedBox(width: 2),
                    Text(
                      '-${product.discountPercent.toInt()}%',
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPromoBanner() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: _surfaceLight,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'ƯU ĐÃI CÓ HẠN',
                    style: TextStyle(
                      color: _primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Giảm 20%',
                    style: TextStyle(
                      color: _textDark,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Cho đơn hàng đầu tiên trên 500K',
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Nhận mã',
                    style: TextStyle(
                      color: _primary,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      decoration: TextDecoration.underline,
                      decorationThickness: 2,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                shape: BoxShape.circle,
              ),
              child: Transform.rotate(
                angle: -0.2,
                child: const Icon(Icons.loyalty, size: 36, color: _primary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBannerShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: Container(
        height: 400,
        margin: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }

  Widget _buildCategoryShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
        child: Row(
          children: List.generate(
            4,
            (_) => Container(
              width: 80,
              height: 40,
              margin: const EdgeInsets.only(right: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(50),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProductShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.58,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
          ),
          itemCount: 4,
          itemBuilder: (_, __) => Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
          ),
        ),
      ),
    );
  }
}
