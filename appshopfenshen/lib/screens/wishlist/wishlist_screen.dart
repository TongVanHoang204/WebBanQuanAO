import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/api_config.dart';
import '../../providers/wishlist_provider.dart';
import '../../providers/cart_provider.dart';

class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});
  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _surface = Color(0xFFFFFFFF);
  static const _text = Color(0xFF140E1B);

  @override
  void initState() {
    super.initState();
    Provider.of<WishlistProvider>(context, listen: false).loadWishlist();
  }

  String _img(String u) => u.startsWith('http') ? u : '${ApiConfig.baseUrl}$u';
  String _price(double p) {
    final f = p.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
    return '${f}đ';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: _bg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: ModalRoute.of(context)?.settings.name == '/wishlist-screen' ? IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20, color: _text),
          onPressed: () => Navigator.of(context).pop(),
        ) : null,
        centerTitle: true,
        title: Consumer<WishlistProvider>(
          builder: (_, wl, __) => Text(
            'Sản phẩm Yêu thích (${wl.itemCount})',
            style: const TextStyle(
              color: _text,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ),
      body: Consumer<WishlistProvider>(
        builder: (_, wl, __) {
          if (wl.isLoading) return _buildLoading();
          
          if (wl.items.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: _primary.withValues(alpha: 0.05),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.favorite_border,
                      size: 60,
                      color: _primary,
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Chưa có sản phẩm yêu thích',
                    style: TextStyle(
                      color: _text,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Lưu lại những món đồ bạn thích\nđể mua sắm dễ dàng hơn nhé.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.grey.shade500,
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: () => Navigator.of(context).pushReplacementNamed('/'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(50),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'KHÁM PHÁ NGAY',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: wl.loadWishlist,
            color: _primary,
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              itemCount: wl.items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 16),
              itemBuilder: (ctx, i) {
                final p = wl.items[i];
                return _buildPremiumWishlistCard(p, wl, context);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildPremiumWishlistCard(p, WishlistProvider wl, BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.of(context).pushNamed('/product-detail', arguments: p.slug),
      child: Container(
        height: 140,
        decoration: BoxDecoration(
          color: _surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Row(
          children: [
            // Image Section
            Container(
              width: 120,
              height: 140,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(20),
                  bottomLeft: Radius.circular(20),
                ),
                color: Colors.grey.shade50,
              ),
              clipBehavior: Clip.hardEdge,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: _img(p.primaryImageUrl),
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: Colors.grey.shade100),
                    errorWidget: (_, __, ___) => Container(
                      color: Colors.grey.shade100,
                      child: Icon(Icons.image, color: Colors.grey.shade300),
                    ),
                  ),
                  if (p.variants.isEmpty || p.variants.first.stockQty == 0)
                    Container(
                      color: Colors.black.withValues(alpha: 0.5),
                      alignment: Alignment.center,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _surface.withValues(alpha: 0.9),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'HẾT HÀNG',
                          style: TextStyle(
                            color: Colors.red,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            
            // Info Section
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            p.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: _text,
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              height: 1.3,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () => wl.toggleWishlist(p.id),
                          child: Icon(
                            Icons.close,
                            color: Colors.grey.shade400,
                            size: 20,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _price(p.basePrice),
                      style: const TextStyle(
                        color: _primary,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const Spacer(),
                    
                    // Add to cart button
                    SizedBox(
                      width: double.infinity,
                      height: 36,
                      child: ElevatedButton(
                        onPressed: () {
                          if (p.variants.isNotEmpty && p.variants.first.stockQty > 0) {
                            final cart = Provider.of<CartProvider>(context, listen: false);
                            cart.addToCart(p.variants.first.id).then((ok) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(ok ? 'Đã thêm vào giỏ hàng!' : 'Có lỗi khi thêm vào giỏ'),
                                  backgroundColor: ok ? Colors.green : Colors.red.shade400,
                                  behavior: SnackBarBehavior.floating,
                                  duration: const Duration(seconds: 2),
                                ),
                              );
                            });
                          } else if (p.variants.isEmpty || p.variants.first.stockQty == 0) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: const Text('Sản phẩm tạm thời hết hàng'),
                                backgroundColor: Colors.orange.shade400,
                                behavior: SnackBarBehavior.floating,
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          } else {
                            Navigator.of(context).pushNamed('/product-detail', arguments: p.slug);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _primary,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          padding: EdgeInsets.zero,
                        ),
                        child: const Text(
                          'Thêm vào giỏ',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoading() {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (_, __) => Container(
        height: 140,
        decoration: BoxDecoration(
          color: _surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          children: [
            Container(
              width: 120,
              height: 140,
              decoration: const BoxDecoration(
                color: Color(0xFFEEEEEE),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  bottomLeft: Radius.circular(20),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(height: 14, width: double.infinity, color: const Color(0xFFEEEEEE)),
                    const SizedBox(height: 8),
                    Container(height: 14, width: 100, color: const Color(0xFFEEEEEE)),
                    const SizedBox(height: 16),
                    Container(height: 16, width: 80, color: const Color(0xFFEEEEEE)),
                    const Spacer(),
                    Container(
                      height: 36,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEEEEE),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
