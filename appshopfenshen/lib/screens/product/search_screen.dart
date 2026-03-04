import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/api_config.dart';
import '../../models/product.dart';
import '../../services/product_service.dart';
import '../../widgets/custom_pagination.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final ProductService _ps = ProductService();
  final _ctrl = TextEditingController();
  final _focusNode = FocusNode();
  List<Product> _results = [];
  bool _loading = false;
  bool _searched = false;
  int _currentPage = 1;
  int _totalPages = 1;
  final ScrollController _scrollCtrl = ScrollController();

  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _surface = Color(0xFFFFFFFF);
  static const _text = Color(0xFF140E1B);

  final _suggestions = ['Váy hoa', 'Quần jean', 'Áo sơ mi', 'Blazer', 'Đầm dự tiệc', 'Khăn cổ'];
  final _trending = ['Đầm miêm mả', 'Thời trang bảo vệ', 'Set local brand', 'Phong cách Y2K'];

  Future<void> _search(String q, [int page = 1]) async {
    if (q.trim().isEmpty) return;
    _focusNode.unfocus();
    setState(() { 
      _loading = true; 
      _searched = true; 
      _currentPage = page;
    });
    try {
      final r = await _ps.getProducts(search: q.trim(), page: page, limit: 12);
      if (mounted) {
        setState(() {
          _results = r['products'] as List<Product>;
          _totalPages = r['totalPages'] as int? ?? 1;
        });
        
        if (_scrollCtrl.hasClients) {
          _scrollCtrl.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  String _img(String u) => u.startsWith('http') ? u : '${ApiConfig.baseUrl}$u';
  String _price(double p) {
    final f = p.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
    return '${f}đ';
  }

  @override
  void dispose() { 
    _ctrl.dispose(); 
    _focusNode.dispose(); 
    _scrollCtrl.dispose();
    super.dispose(); 
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(child: Column(children: [
        // Search bar
        Container(color: _bg, padding: const EdgeInsets.fromLTRB(16, 12, 20, 12),
          child: Row(children: [
            if (ModalRoute.of(context)?.settings.name == '/search')
              IconButton(icon: const Icon(Icons.arrow_back_ios, size: 20, color: _text), onPressed: () => Navigator.of(context).pop()),
            Expanded(child: Container(height: 46,
              decoration: BoxDecoration(color: _surface, borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8)]),
              child: TextField(
                controller: _ctrl, focusNode: _focusNode, autofocus: true,
                style: const TextStyle(color: _text, fontSize: 14),
                textInputAction: TextInputAction.search,
                onSubmitted: _search,
                onChanged: (v) => setState(() {}),
                decoration: InputDecoration(
                  hintText: 'Tìm kiếm sản phẩm...', hintStyle: TextStyle(color: Colors.grey.shade400),
                  border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                  prefixIcon: Icon(Icons.search, color: _primary.withValues(alpha: 0.6), size: 20),
                  suffixIcon: _ctrl.text.isNotEmpty ? IconButton(
                    icon: Icon(Icons.close, size: 18, color: Colors.grey.shade400),
                    onPressed: () { _ctrl.clear(); setState(() { _results = []; _searched = false; _currentPage = 1; _totalPages = 1; }); _focusNode.requestFocus(); }) : null)))),
          ])),

        Expanded(child: !_searched
          ? SingleChildScrollView(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // Popular suggestions
              Padding(padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                child: const Text('Tìm kiếm phổ biến', style: TextStyle(color: _text, fontSize: 15, fontWeight: FontWeight.w700))),
              Wrap(spacing: 8, runSpacing: 8, children: _suggestions.map((s) =>
                GestureDetector(onTap: () { _ctrl.text = s; _search(s); }, child: Container(
                  margin: const EdgeInsets.only(left: 20),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(color: _primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(50),
                    border: Border.all(color: _primary.withValues(alpha: 0.15))),
                  child: Text(s, style: const TextStyle(color: _primary, fontSize: 13, fontWeight: FontWeight.w600))))).toList()),
              Padding(padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                child: const Text('Xu hướng đang hot', style: TextStyle(color: _text, fontSize: 15, fontWeight: FontWeight.w700))),
              ..._trending.asMap().entries.map((e) => ListTile(
                onTap: () { _ctrl.text = e.value; _search(e.value); },
                leading: Container(width: 36, height: 36,
                  decoration: BoxDecoration(color: Colors.grey.shade100, shape: BoxShape.circle),
                  child: Center(child: Text('${e.key + 1}', style: TextStyle(
                    color: e.key < 3 ? _primary : Colors.grey.shade500, fontSize: 14, fontWeight: FontWeight.w700)))),
                title: Text(e.value, style: const TextStyle(color: _text, fontSize: 14, fontWeight: FontWeight.w500)),
                trailing: Icon(Icons.trending_up, color: e.key < 3 ? _primary : Colors.grey.shade400, size: 20),
                contentPadding: const EdgeInsets.symmetric(horizontal: 20),
              )),
            ]))
          : _loading
            ? const Center(child: CircularProgressIndicator(color: _primary))
            : _results.isEmpty
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.search_off, size: 64, color: Colors.grey.shade300),
                  const SizedBox(height: 16),
                  Text('Không tìm thấy "${_ctrl.text}"', style: TextStyle(color: Colors.grey.shade500, fontSize: 15)),
                  const SizedBox(height: 8),
                  Text('Thử tìm kiếm với từ khóa khác', style: TextStyle(color: Colors.grey.shade400, fontSize: 13)),
                ]))
              : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Padding(padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
                    child: Text('Đang hiển thị ${_results.length} kết quả (Trang $_currentPage/$_totalPages)',
                      style: TextStyle(color: Colors.grey.shade500, fontSize: 13, fontWeight: FontWeight.w500))),
                  Expanded(child: ListView(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    children: [
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2, childAspectRatio: 0.6, crossAxisSpacing: 12, mainAxisSpacing: 12),
                        itemCount: _results.length,
                        itemBuilder: (_, i) {
                          final p = _results[i];
                          return GestureDetector(
                            onTap: () => Navigator.of(context).pushNamed('/product-detail', arguments: p.slug),
                            child: Container(
                              decoration: BoxDecoration(color: _surface, borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.grey.shade100)),
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Expanded(child: Stack(children: [
                                  ClipRRect(borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                                    child: CachedNetworkImage(imageUrl: _img(p.primaryImageUrl),
                                      width: double.infinity, height: double.infinity, fit: BoxFit.cover,
                                      placeholder: (_, __) => Container(color: Colors.grey.shade100),
                                      errorWidget: (_, __, ___) => Container(color: Colors.grey.shade100,
                                        child: Icon(Icons.image, color: Colors.grey.shade400)))),
                                  if (p.discountPercent > 0) Positioned(top: 8, left: 8, child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                    decoration: BoxDecoration(color: Colors.red.shade400, borderRadius: BorderRadius.circular(6)),
                                    child: Text('-${p.discountPercent.toInt()}%',
                                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)))),
                                ])),
                                Padding(padding: const EdgeInsets.all(10), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: _text, fontSize: 12, fontWeight: FontWeight.w600, height: 1.3)),
                                  const SizedBox(height: 4),
                                  Text(_price(p.basePrice), style: const TextStyle(color: _primary, fontSize: 13, fontWeight: FontWeight.w800)),
                                ])),
                              ]),
                            ));
                        },
                      ),
                      if (_totalPages > 1) CustomPagination(
                        currentPage: _currentPage,
                        totalPages: _totalPages,
                        onPageChanged: (page) => _search(_ctrl.text, page),
                      ),
                    ],
                  )),
                ]),
        ),
      ])),
    );
  }
}
