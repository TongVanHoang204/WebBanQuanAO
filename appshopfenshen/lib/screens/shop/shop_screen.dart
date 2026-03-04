import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/product.dart';
import '../../models/category.dart';
import '../../services/product_service.dart';
import '../../config/api_config.dart';
import '../../widgets/custom_pagination.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  final ProductService _productService = ProductService();
  final ScrollController _scrollCtrl = ScrollController();

  List<Product> _products = [];
  List<CategoryModel> _categories = [];
  bool _isLoading = true;
  int _currentPage = 1;
  int _totalPages = 1;

  // Filters
  String? _selectedCategory;
  String _sortBy = 'created_at';
  String _sortOrder = 'desc';
  RangeValues _priceRange = const RangeValues(0, 10000000);
  bool _showFilters = false;

  @override
  void initState() {
    super.initState();
    _loadData(1);
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    super.dispose();
  }



  Future<void> _loadData([int page = 1]) async {
    setState(() => _isLoading = true);
    try {
      final futures = await Future.wait([
        _productService.getProducts(
          page: page,
          category: _selectedCategory,
          sort: '${_sortBy}_$_sortOrder',
          minPrice: _priceRange.start > 0 ? _priceRange.start : null,
          maxPrice: _priceRange.end < 10000000 ? _priceRange.end : null,
        ),
        _productService.getCategories(),
      ]);

      final productsData = futures[0] as Map<String, dynamic>;
      final catData = futures[1] as List<CategoryModel>;

      if (mounted) {
        setState(() {
          _products = productsData['products'] as List<Product>;
          _totalPages = productsData['totalPages'] as int? ?? 1;
          _currentPage = page;
          _categories = catData;
          _isLoading = false;
        });
        
        // Scroll to top when page changes
        if (_scrollCtrl.hasClients) {
          _scrollCtrl.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _applySort(String sort) {
    final parts = sort.split('_');
    setState(() {
      if (parts.length >= 2) {
        _sortBy = parts.sublist(0, parts.length - 1).join('_');
        _sortOrder = parts.last;
      }
    });
    _loadData(1);
    Navigator.of(context).pop();
  }

  String _formatPrice(double price) {
    final formatted = price
        .toStringAsFixed(0)
        .replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
    return '${formatted}đ';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F6F8),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF7F6F8),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: const Color(0xFF140E1B), size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Cửa hàng',
          style: TextStyle(
            color: const Color(0xFF140E1B),
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: const Color(0xFF140E1B)),
            onPressed: () => Navigator.of(context).pushNamed('/search'),
          ),
          IconButton(
            icon: Icon(
              _showFilters ? Icons.filter_list_off : Icons.filter_list,
              color: const Color(0xFF7F19E6),
            ),
            onPressed: () => setState(() => _showFilters = !_showFilters),
          ),
          IconButton(
            icon: const Icon(Icons.sort, color: const Color(0xFF140E1B)),
            onPressed: _showSortSheet,
          ),
        ],
      ),
      body: Column(
        children: [
          // Category filter chips
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _categoryChip(null, 'Tất cả'),
                ..._categories.map((c) => _categoryChip(c.slug, c.name)),
              ],
            ),
          ),

          // Filter panel
          if (_showFilters) _buildFilterPanel(),

          // Product grid
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFF7F19E6)),
                  )
                : _products.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(
                    onRefresh: () => _loadData(_currentPage),
                    color: const Color(0xFF7F19E6),
                    child: ListView(
                      controller: _scrollCtrl,
                      padding: const EdgeInsets.all(16),
                      children: [
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.62,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                              ),
                          itemCount: _products.length,
                          itemBuilder: (_, i) => _buildProductCard(_products[i]),
                        ),
                        if (_totalPages > 1)
                          CustomPagination(
                            currentPage: _currentPage,
                            totalPages: _totalPages,
                            onPageChanged: (page) => _loadData(page),
                          ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterPanel() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: const Color(0xFFFFFFFF),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Khoảng giá',
            style: TextStyle(
              color: Colors.grey.shade700,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          RangeSlider(
            values: _priceRange,
            min: 0,
            max: 10000000,
            divisions: 100,
            activeColor: const Color(0xFF7F19E6),
            inactiveColor: Colors.grey.shade200,
            labels: RangeLabels(
              _formatPrice(_priceRange.start),
              _formatPrice(_priceRange.end),
            ),
            onChanged: (values) => setState(() => _priceRange = values),
            onChangeEnd: (_) => _loadData(1),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _formatPrice(_priceRange.start),
                style: TextStyle(
                  color: Colors.grey.shade500,
                  fontSize: 12,
                ),
              ),
              Text(
                _formatPrice(_priceRange.end),
                style: TextStyle(
                  color: Colors.grey.shade500,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _categoryChip(String? slug, String name) {
    final selected = _selectedCategory == slug;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: selected,
        label: Text(name),
        labelStyle: TextStyle(
          color: selected ? const Color(0xFFFFFFFF) : const Color(0xFF140E1B),
          fontSize: 12,
          fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
        ),
        backgroundColor: const Color(0xFFFFFFFF),
        selectedColor: const Color(0xFF7F19E6),
        side: BorderSide(
          color: selected
              ? const Color(0xFF7F19E6)
              : Colors.grey.shade200,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        onSelected: (_) {
          setState(() => _selectedCategory = slug);
          _loadData(1);
        },
      ),
    );
  }

  void _showSortSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFFFFFFFF),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Sắp xếp theo',
              style: TextStyle(
                color: const Color(0xFF140E1B),
                fontSize: 17,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            _sortOption('Mới nhất', 'created_at_desc'),
            _sortOption('Giá thấp → cao', 'base_price_asc'),
            _sortOption('Giá cao → thấp', 'base_price_desc'),
            _sortOption('Tên A-Z', 'name_asc'),
            _sortOption('Bán chạy nhất', 'sold_count_desc'),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _sortOption(String label, String value) {
    final current = '${_sortBy}_$_sortOrder';
    final selected = current == value;
    return ListTile(
      onTap: () => _applySort(value),
      title: Text(
        label,
        style: TextStyle(
          color: selected ? const Color(0xFF7F19E6) : const Color(0xFF140E1B),
          fontSize: 15,
        ),
      ),
      trailing: selected
          ? const Icon(Icons.check, color: Color(0xFF7F19E6), size: 20)
          : null,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.shopping_bag_outlined,
            size: 64,
            color: Colors.grey.shade200,
          ),
          const SizedBox(height: 16),
          Text(
            'Không tìm thấy sản phẩm',
            style: TextStyle(
              color: Colors.grey.shade500,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () {
              setState(() {
                _selectedCategory = null;
                _priceRange = const RangeValues(0, 10000000);
              });
              _loadData(1);
            },
            child: const Text(
              'Xóa bộ lọc',
              style: TextStyle(color: Color(0xFF7F19E6)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductCard(Product product) {
    final imageUrl = product.primaryImageUrl;
    final hasDiscount = product.discountPercent > 0;

    return GestureDetector(
      onTap: () => Navigator.of(
        context,
      ).pushNamed('/product-detail', arguments: {'slug': product.slug}),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFFFFFFF),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              flex: 3,
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(14),
                    ),
                    child: CachedNetworkImage(
                      imageUrl: imageUrl.startsWith('http')
                          ? imageUrl
                          : '${ApiConfig.baseUrl}$imageUrl',
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                      placeholder: (_, __) =>
                          Container(color: Colors.grey.shade100),
                      errorWidget: (_, __, ___) => Container(
                        color: Colors.grey.shade100,
                        child: const Icon(
                          Icons.image_not_supported,
                          color: Colors.grey,
                        ),
                      ),
                    ),
                  ),
                  if (hasDiscount)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red.shade700,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '-${product.discountPercent.toStringAsFixed(0)}%',
                          style: const TextStyle(
                            color: const Color(0xFF140E1B),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Info
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (product.category != null)
                      Text(
                        product.category!.name,
                        style: TextStyle(
                          color: Colors.grey.shade500,
                          fontSize: 10,
                        ),
                        maxLines: 1,
                      ),
                    const SizedBox(height: 2),
                    Text(
                      product.name,
                      style: const TextStyle(
                        color: const Color(0xFF140E1B),
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    Row(
                      children: [
                        Text(
                          _formatPrice(product.basePrice),
                          style: const TextStyle(
                            color: Color(0xFF7F19E6),
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
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
