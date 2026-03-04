import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';
import '../../widgets/custom_pagination.dart';

class OrderListScreen extends StatefulWidget {
  const OrderListScreen({super.key});
  @override
  State<OrderListScreen> createState() => _OrderListScreenState();
}

class _OrderListScreenState extends State<OrderListScreen> with SingleTickerProviderStateMixin {
  final OrderService _orderService = OrderService();
  List<Order> _orders = [];
  bool _loading = true;
  late TabController _tabCtrl;
  int _currentPage = 1;
  int _totalPages = 1;

  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _surface = Color(0xFFFFFFFF);
  static const _text = Color(0xFF140E1B);

  final _tabs = const ['Tất cả', 'Đang xử lý', 'Đang giao', 'Hoàn thành', 'Đánh giá', 'Đã hủy'];
  final _statusGroups = const [
    [],                                            // All
    ['pending', 'confirmed', 'paid', 'processing'], // Đang xử lý
    ['shipped'],                                   // Đang giao
    ['completed'],                                 // Hoàn thành
    ['completed'],                                 // Đánh giá
    ['cancelled', 'refunded'],                     // Đã hủy
  ];

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: _tabs.length, vsync: this);
    _loadOrders();
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      if (args != null && args.containsKey('initialIndex')) {
        final int initialIndex = args['initialIndex'];
        if (initialIndex >= 0 && initialIndex < _tabs.length) {
          _tabCtrl.index = initialIndex;
        }
      }
    });

    _tabCtrl.addListener(() {
      if (!_tabCtrl.indexIsChanging) {
        // Optional: Reset to page 1 when switching tabs and reload if we had server-side filtering
        // We currently do client-side filtering on the fetched page.
      }
    });
  }

  @override
  void dispose() { _tabCtrl.dispose(); super.dispose(); }

  Future<void> _loadOrders({int? page}) async {
    final targetPage = page ?? _currentPage;
    try {
      setState(() => _loading = true);
      // NOTE: Since the backend `getOrders` for user doesn't support ?status= filter yet,
      // pagination applies to ALL orders. Filtering happens client-side on the current page.
      final res = await _orderService.getOrders(page: targetPage, limit: 10);
      _orders = res.data;
      _totalPages = res.totalPages;
      _currentPage = targetPage;
    } catch (e) { /* */ }
    if (mounted) setState(() => _loading = false);
  }

  List<Order> _filtered(int tabIdx) {
    if (tabIdx == 0) return _orders;
    return _orders.where((o) => _statusGroups[tabIdx].contains(o.status)).toList();
  }

  String _price(double p) {
    final f = p.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
    return '${f}đ';
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'pending': return Colors.orange;
      case 'confirmed': case 'paid': return Colors.blue;
      case 'processing': return Colors.cyan;
      case 'shipped': return Colors.purple;
      case 'completed': return Colors.green;
      case 'cancelled': case 'refunded': return Colors.red;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg, elevation: 0, scrolledUnderElevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, size: 20, color: _text), onPressed: () => Navigator.of(context).pop()),
        title: const Text('Đơn hàng của tôi', style: TextStyle(color: _text, fontSize: 18, fontWeight: FontWeight.w800)),
        bottom: TabBar(
          controller: _tabCtrl,
          isScrollable: true, tabAlignment: TabAlignment.start,
          labelColor: _primary, unselectedLabelColor: Colors.grey.shade500,
          labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
          unselectedLabelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
          indicatorColor: _primary, indicatorSize: TabBarIndicatorSize.label,
          dividerColor: Colors.grey.shade200,
          tabs: _tabs.map((t) => Tab(text: t)).toList()),
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator(color: _primary))
        : TabBarView(
            controller: _tabCtrl,
            children: List.generate(_tabs.length, (ti) {
              final orders = _filtered(ti);
              
              if (orders.isEmpty && _orders.isEmpty) {
                return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.receipt_long_outlined, size: 80, color: Colors.grey.shade200),
                  const SizedBox(height: 16),
                  Text('Chưa có đơn hàng nào', style: TextStyle(color: Colors.grey.shade500, fontSize: 15)),
                ]));
              }
              
              if (orders.isEmpty && _orders.isNotEmpty) {
                return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.search_off_outlined, size: 60, color: Colors.grey.shade300),
                  const SizedBox(height: 16),
                  Text('Không có đơn hàng ở trạng thái này\ntrên trang hiện tại.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
                ]));
              }

              return Column(
                children: [
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: () => _loadOrders(page: 1), 
                      color: _primary,
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: orders.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (_, i) {
                          final order = orders[i];
                          return GestureDetector(
                            onTap: () => Navigator.of(context).pushNamed('/order-detail', arguments: order.id),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(color: _surface, borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.grey.shade100),
                                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2))]),
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                  Text('#${order.orderCode}', style: const TextStyle(color: _text, fontSize: 15, fontWeight: FontWeight.w700)),
                                  Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(color: _statusColor(order.status).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(50)),
                                    child: Text(order.statusLabel, style: TextStyle(color: _statusColor(order.status), fontSize: 12, fontWeight: FontWeight.w700))),
                                ]),
                                const SizedBox(height: 10),
                                if (order.items.isNotEmpty) Row(children: [
                                  Icon(Icons.inventory_2_outlined, size: 14, color: Colors.grey.shade400),
                                  const SizedBox(width: 6),
                                  Text('${order.items.length} sản phẩm', style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
                                ]),
                                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                  if (order.createdAt != null) Row(children: [
                                    Icon(Icons.schedule, size: 14, color: Colors.grey.shade400),
                                    const SizedBox(width: 4),
                                    Text('${order.createdAt!.day}/${order.createdAt!.month}/${order.createdAt!.year}',
                                      style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
                                  ]),
                                  Text(_price(order.grandTotal), style: const TextStyle(color: _primary, fontSize: 16, fontWeight: FontWeight.w800)),
                                ]),
                                if (order.status == 'completed') ...[
                                  const SizedBox(height: 12),
                                  Divider(height: 1, color: Colors.grey.shade100),
                                  const SizedBox(height: 12),
                                  SizedBox(
                                    width: double.infinity,
                                    child: OutlinedButton(
                                      onPressed: () {
                                        if (order.items.length == 1 && order.items.first.productId.isNotEmpty) {
                                          Navigator.of(context).pushNamed('/reviews', arguments: {
                                            'productId': order.items.first.productId,
                                            'productName': order.items.first.name,
                                          });
                                        } else {
                                          Navigator.of(context).pushNamed('/order-detail', arguments: order.id);
                                        }
                                      },
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: _primary,
                                        side: const BorderSide(color: _primary),
                                        padding: const EdgeInsets.symmetric(vertical: 10),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
                                      ),
                                      child: const Text('Đánh giá sản phẩm', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                                    ),
                                  ),
                                ],
                              ]),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  if (_totalPages > 1)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 24, top: 8),
                      child: CustomPagination(
                        currentPage: _currentPage,
                        totalPages: _totalPages,
                        onPageChanged: (page) => _loadOrders(page: page),
                      ),
                    ),
                ],
              );
            }),
          ),
    );
  }
}
