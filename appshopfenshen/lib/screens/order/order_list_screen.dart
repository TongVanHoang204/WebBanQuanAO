import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';

class OrderListScreen extends StatefulWidget {
  const OrderListScreen({super.key});

  @override
  State<OrderListScreen> createState() => _OrderListScreenState();
}

class _OrderListScreenState extends State<OrderListScreen> {
  final OrderService _orderService = OrderService();
  List<Order> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    try {
      setState(() => _loading = true);
      _orders = await _orderService.getOrders();
    } catch (e) {
      // silently fail
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatPrice(double price) {
    final formatted = price.toStringAsFixed(0).replaceAllMapped(
        RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
    return '${formatted}đ';
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'confirmed': return Colors.blue;
      case 'paid': return Colors.green;
      case 'processing': return Colors.cyan;
      case 'shipped': return Colors.purple;
      case 'completed': return const Color(0xFF2E7D32);
      case 'cancelled': return Colors.red;
      case 'refunded': return Colors.amber;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text('Đơn hàng của tôi',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
          : _orders.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.receipt_long_outlined, size: 80,
                          color: Colors.white.withValues(alpha: 0.1)),
                      const SizedBox(height: 16),
                      Text('Chưa có đơn hàng nào', style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.4), fontSize: 16)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadOrders,
                  color: const Color(0xFFD4AF37),
                  backgroundColor: const Color(0xFF1A1A1A),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _orders.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, index) {
                      final order = _orders[index];
                      return GestureDetector(
                        onTap: () => Navigator.of(context).pushNamed(
                            '/order-detail', arguments: order.id),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF141414),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('#${order.orderCode}',
                                      style: const TextStyle(color: Colors.white,
                                          fontSize: 15, fontWeight: FontWeight.w600)),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _statusColor(order.status).withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(order.statusLabel,
                                        style: TextStyle(color: _statusColor(order.status),
                                            fontSize: 12, fontWeight: FontWeight.w600)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              if (order.items.isNotEmpty)
                                Text('${order.items.length} sản phẩm',
                                    style: TextStyle(color: Colors.white.withValues(alpha: 0.4),
                                        fontSize: 13)),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  if (order.createdAt != null)
                                    Text(
                                      '${order.createdAt!.day}/${order.createdAt!.month}/${order.createdAt!.year}',
                                      style: TextStyle(color: Colors.white.withValues(alpha: 0.3),
                                          fontSize: 12),
                                    ),
                                  Text(_formatPrice(order.grandTotal),
                                      style: const TextStyle(color: Color(0xFFD4AF37),
                                          fontSize: 16, fontWeight: FontWeight.w700)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
