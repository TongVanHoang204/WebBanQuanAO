import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../models/product.dart';
import '../../services/product_service.dart';
import '../../config/api_config.dart';
import '../../providers/wishlist_provider.dart';

class SaleScreen extends StatefulWidget {
  const SaleScreen({super.key});
  @override
  State<SaleScreen> createState() => _SaleScreenState();
}

class _SaleScreenState extends State<SaleScreen> {
  final ProductService _ps = ProductService();
  final ScrollController _scrollCtrl = ScrollController();
  List<Product> _products = [];
  bool _loading = true;
  bool _loadingMore = false;
  int _page = 1;
  bool _hasMore = true;
  String _sort = 'discount_desc';

  // Countdown timer
  late Timer _timer;
  int _hours = 0, _mins = 0, _secs = 0;

  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _surface = Color(0xFFFFFFFF);
  static const _text = Color(0xFF140E1B);

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_onScroll);
    _initCountdown();
    _load();
  }

  void _initCountdown() {
    final now = DateTime.now();
    final midnight = DateTime(now.year, now.month, now.day + 1);
    final diff = midnight.difference(now);
    _hours = diff.inHours;
    _mins = diff.inMinutes.remainder(60);
    _secs = diff.inSeconds.remainder(60);
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        if (_secs > 0) { _secs--; }
        else if (_mins > 0) { _mins--; _secs = 59; }
        else if (_hours > 0) { _hours--; _mins = 59; _secs = 59; }
      });
    });
  }

  @override
  void dispose() { _timer.cancel(); _scrollCtrl.dispose(); super.dispose(); }

  void _onScroll() {
    if (_scrollCtrl.position.pixels >= _scrollCtrl.position.maxScrollExtent - 200 && !_loadingMore && _hasMore) {
      _page++; _load();
    }
  }

  Future<void> _load({bool refresh = false}) async {
    if (refresh) { _page = 1; _hasMore = true; }
    setState(() => refresh ? _loading = true : _loadingMore = true);
    try {
      final data = await _ps.getProducts(page: _page, limit: 12, onSale: true, sort: _sort, minDiscount: 10);
      final prods = data['products'] as List<Product>;
      if (mounted) setState(() {
        if (refresh) _products = prods; else _products.addAll(prods);
        _hasMore = prods.length >= 12;
        _loading = false; _loadingMore = false;
      });
    } catch (_) { if (mounted) setState(() { _loading = false; _loadingMore = false; }); }
  }

  String _img(String u) => u.startsWith('http') ? u : '${ApiConfig.baseUrl}$u';
  String _price(double p) {
    return '${p.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')}đ';
  }

  String _pad(int n) => n.toString().padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: CustomScrollView(controller: _scrollCtrl, slivers: [
        // Countdown header
        SliverToBoxAdapter(child: Container(
          decoration: const BoxDecoration(gradient: LinearGradient(colors: [Color(0xFF7F19E6), Color(0xFFE53935)], begin: Alignment.topLeft, end: Alignment.bottomRight)),
          child: SafeArea(child: Padding(padding: const EdgeInsets.fromLTRB(20, 16, 20, 24), child: Column(children: [
            Row(children: [
              IconButton(icon: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 20), onPressed: () => Navigator.pop(context)),
              const Expanded(child: Text('FLASH SALE', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: 2))),
              Icon(Icons.local_fire_department, color: Colors.orange.shade300, size: 28),
            ]),
            const SizedBox(height: 16),
            // Countdown
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Text('Kết thúc sau:', style: TextStyle(color: Colors.white70, fontSize: 14)),
              const SizedBox(width: 12),
              _timerBox(_pad(_hours)),
              _timerSep(),
              _timerBox(_pad(_mins)),
              _timerSep(),
              _timerBox(_pad(_secs)),
            ]),
          ]))),
        )),

        // Sort chips
        SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(children: [
            _sortChip('Giảm nhiều nhất', 'discount_desc'),
            const SizedBox(width: 8),
            _sortChip('Giá thấp nhất', 'price_asc'),
            const SizedBox(width: 8),
            _sortChip('Mới nhất', 'newest'),
            const Spacer(),
            if (!_loading) Text('${_products.length} SP', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
          ]))),

        // Products
        if (_loading) SliverFillRemaining(child: const Center(child: CircularProgressIndicator(color: _primary)))
        else SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.58, crossAxisSpacing: 12, mainAxisSpacing: 12),
            delegate: SliverChildBuilderDelegate(
              (_, i) {
                if (i >= _products.length) return const Center(child: CircularProgressIndicator(color: _primary, strokeWidth: 2));
                return _card(_products[i]);
              },
              childCount: _products.length + (_loadingMore ? 2 : 0)))),

        const SliverToBoxAdapter(child: SizedBox(height: 40)),
      ]),
    );
  }

  Widget _timerBox(String val) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), margin: const EdgeInsets.symmetric(horizontal: 2),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
    child: Text(val, style: const TextStyle(color: Color(0xFF7F19E6), fontSize: 22, fontWeight: FontWeight.w900)));

  Widget _timerSep() => const Padding(padding: EdgeInsets.symmetric(horizontal: 2), child: Text(':', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900)));

  Widget _sortChip(String label, String value) {
    final sel = _sort == value;
    return GestureDetector(onTap: () { setState(() => _sort = value); _load(refresh: true); },
      child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(color: sel ? _primary : _surface, borderRadius: BorderRadius.circular(50), border: sel ? null : Border.all(color: Colors.grey.shade200)),
        child: Text(label, style: TextStyle(color: sel ? Colors.white : _text, fontSize: 12, fontWeight: FontWeight.w600))));
  }

  Widget _card(Product p) {
    return GestureDetector(
      onTap: () => Navigator.of(context).pushNamed('/product-detail', arguments: p.slug),
      child: Container(
        decoration: BoxDecoration(color: _surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade100),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2))]),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(child: Stack(children: [
            ClipRRect(borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: CachedNetworkImage(imageUrl: _img(p.primaryImageUrl), width: double.infinity, height: double.infinity, fit: BoxFit.cover,
                placeholder: (_, __) => Container(color: Colors.grey.shade100),
                errorWidget: (_, __, ___) => Container(color: Colors.grey.shade100, child: Icon(Icons.image, color: Colors.grey.shade400)))),
            if (p.discountPercent > 0) Positioned(top: 8, left: 8, child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: Colors.red.shade500, borderRadius: BorderRadius.circular(8)),
              child: Text('-${p.discountPercent.toInt()}%', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800)))),
            Positioned(top: 8, right: 8, child: Consumer<WishlistProvider>(builder: (_, wl, __) {
              final fav = wl.isWishlisted(p.id);
              return GestureDetector(onTap: () => wl.toggleWishlist(p.id),
                child: Container(width: 32, height: 32, decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.9), shape: BoxShape.circle),
                  child: Icon(fav ? Icons.favorite_rounded : Icons.favorite_border, size: 16, color: fav ? Colors.red : Colors.grey.shade400)));
            })),
          ])),
          Padding(padding: const EdgeInsets.all(10), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: _text, fontSize: 12, fontWeight: FontWeight.w600, height: 1.3)),
            const SizedBox(height: 6),
            Row(children: [
              Text(_price(p.basePrice), style: const TextStyle(color: _primary, fontSize: 13, fontWeight: FontWeight.w800)),
              const SizedBox(width: 6),
              if (p.compareAtPrice != null && p.compareAtPrice! > p.basePrice)
                Text(_price(p.compareAtPrice!), style: TextStyle(color: Colors.grey.shade400, fontSize: 10, decoration: TextDecoration.lineThrough)),
            ]),
          ])),
        ]),
      ),
    );
  }
}
