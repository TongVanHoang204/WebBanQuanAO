import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../config/api_config.dart';
import '../../models/product.dart';
import '../../services/product_service.dart';
import '../../providers/wishlist_provider.dart';
import '../../widgets/custom_pagination.dart';

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});
  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  final ProductService _ps = ProductService();
  final ScrollController _scrollCtrl = ScrollController();
  List<Product> _products = [];
  bool _loading = true;
  int _page = 1;
  int _totalPages = 1;

  String? _catSlug;
  String _title = 'Bộ sưu tập';
  String _sortBy = 'newest';
  String _sortLabel = 'Mới nhất';
  double? _maxPrice;
  bool _onSaleOnly = false;

  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _surface = Color(0xFFFFFFFF);
  static const _text = Color(0xFF140E1B);

  @override
  void initState() {
    super.initState();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map<String, dynamic>) {
      _catSlug = args['category'] as String?;
      _title = args['title'] as String? ?? 'Bộ sưu tập';
    } else if (args is String) {
      _catSlug = args;
    }
    if (_products.isEmpty) _load();
  }

  Future<void> _load({int? targetPage}) async {
    if (targetPage != null) {
      _page = targetPage;
    } else {
      _page = 1;
    }
    
    try {
      setState(() => _loading = true);
      final res = await _ps.getProducts(
        page: _page,
        limit: 12,
        categoryId: _catSlug,
        sort: _sortBy,
        onSale: _onSaleOnly ? true : null,
        maxPrice: _maxPrice,
      );
      final prods = res['products'] as List<Product>;
      if (mounted) {
        setState(() {
          _products = prods;
          _totalPages = res['totalPages'] as int? ?? 1;
          _loading = false;
        });
        
        // Scroll to top when page changes
        if (_scrollCtrl.hasClients) {
          _scrollCtrl.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
        }
      }
    } catch (_) {
      if (mounted)
        setState(() {
          _loading = false;
        });
    }
  }


  void _showSortBottomSheet() {
    final sorts = [
      {'key': 'newest', 'label': 'Mới nhất'},
      {'key': 'price_asc', 'label': 'Giá tăng dần'},
      {'key': 'price_desc', 'label': 'Giá giảm dần'},
      {'key': 'popular', 'label': 'Phổ biến'},
    ];
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 4,
            width: 40,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: Text(
              'Sắp xếp',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
          ...sorts.map(
            (s) => ListTile(
              title: Text(
                s['label']!,
                style: TextStyle(
                  color: _text,
                  fontWeight: s['key'] == _sortBy
                      ? FontWeight.w700
                      : FontWeight.w400,
                ),
              ),
              trailing: s['key'] == _sortBy
                  ? const Icon(Icons.check, color: _primary)
                  : null,
              onTap: () {
                Navigator.pop(context);
                setState(() {
                  _sortBy = s['key']!;
                  _sortLabel = s['label']!;
                });
                _load(targetPage: 1);
              },
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  void _showFilterBottomSheet() {
    double tempMax = _maxPrice ?? 5000000;
    bool tempSale = _onSaleOnly;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setModal) => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                height: 4,
                width: 40,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Text(
                'Lọc sản phẩm',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Giá tối đa',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  Text(
                    '${(tempMax / 1000000).toStringAsFixed(1)}Mđ',
                    style: const TextStyle(
                      color: _primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              Slider(
                value: tempMax,
                min: 100000,
                max: 10000000,
                divisions: 99,
                activeColor: _primary,
                onChanged: (v) => setModal(() => tempMax = v),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Chỉ sản phẩm giảm giá',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  Switch(
                    value: tempSale,
                    activeColor: _primary,
                    onChanged: (v) => setModal(() => tempSale = v),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        setState(() {
                          _maxPrice = null;
                          _onSaleOnly = false;
                        });
                        _load(targetPage: 1);
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: _text,
                        side: BorderSide(color: Colors.grey.shade300),
                      ),
                      child: const Text('Xóa bộ lọc'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        setState(() {
                          _maxPrice = tempMax;
                          _onSaleOnly = tempSale;
                        });
                        _load(targetPage: 1);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _primary,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Áp dụng'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  String _img(String u) => u.startsWith('http') ? u : '${ApiConfig.baseUrl}$u';
  String _price(double p) {
    final f = p
        .toStringAsFixed(0)
        .replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
    return '${f}đ';
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20, color: _text),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          _title,
          style: const TextStyle(
            color: _text,
            fontSize: 18,
            fontWeight: FontWeight.w800,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.search, color: _text, size: 24),
            onPressed: () => Navigator.of(context).pushNamed('/search'),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter bar
          Container(
            color: _bg,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Row(
              children: [
                _filterChip(
                  Icons.tune_rounded,
                  'Lọc',
                  _showFilterBottomSheet,
                  active: _maxPrice != null || _onSaleOnly,
                ),
                const SizedBox(width: 8),
                _filterChip(
                  Icons.sort_rounded,
                  'Sắp xếp: $_sortLabel',
                  _showSortBottomSheet,
                  active: true,
                ),
                const Spacer(),
                if (!_loading)
                  Text(
                    '${_products.length} sản phẩm',
                    style: TextStyle(
                      color: Colors.grey.shade500,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: _primary),
                  )
                : RefreshIndicator(
                    onRefresh: () => _load(targetPage: _page),
                    color: _primary,
                    child: ListView(
                      controller: _scrollCtrl,
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                      children: [
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.58,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                              ),
                          itemCount: _products.length,
                          itemBuilder: (_, i) => _card(_products[i]),
                        ),
                        if (_totalPages > 1)
                          CustomPagination(
                            currentPage: _page,
                            totalPages: _totalPages,
                            onPageChanged: (page) => _load(targetPage: page),
                          ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(
    IconData icon,
    String label,
    VoidCallback onTap, {
    bool active = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active ? _primary : _surface,
          borderRadius: BorderRadius.circular(50),
          border: active ? null : Border.all(color: Colors.grey.shade200),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: _primary.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: active ? Colors.white : Colors.grey.shade500,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: active ? Colors.white : _text,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _card(Product p) {
    return GestureDetector(
      onTap: () =>
          Navigator.of(context).pushNamed('/product-detail', arguments: p.slug),
      child: Container(
        decoration: BoxDecoration(
          color: _surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                    child: CachedNetworkImage(
                      imageUrl: _img(p.primaryImageUrl),
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
                    top: 8,
                    right: 8,
                    child: Consumer<WishlistProvider>(
                      builder: (_, wl, __) {
                        final fav = wl.isWishlisted(p.id);
                        return GestureDetector(
                          onTap: () => wl.toggleWishlist(p.id),
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.9),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.06),
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                            child: Icon(
                              fav
                                  ? Icons.favorite_rounded
                                  : Icons.favorite_border,
                              size: 16,
                              color: fav ? Colors.red : Colors.grey.shade400,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  if (p.discountPercent > 0)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 7,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red.shade400,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '-${p.discountPercent.toInt()}%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
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
                      color: _text,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          _price(p.basePrice),
                          style: const TextStyle(
                            color: _primary,
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      if (p.compareAtPrice != null &&
                          p.compareAtPrice! > p.basePrice)
                        Text(
                          _price(p.compareAtPrice!),
                          style: TextStyle(
                            color: Colors.grey.shade400,
                            fontSize: 10,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
