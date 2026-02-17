import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';

class OrderDetailScreen extends StatefulWidget {
  const OrderDetailScreen({super.key});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final OrderService _orderService = OrderService();
  Order? _order;
  bool _loading = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_order == null) {
      final orderId = ModalRoute.of(context)?.settings.arguments as String?;
      if (orderId != null) _loadOrder(orderId);
    }
  }

  Future<void> _loadOrder(String id) async {
    try {
      _order = await _orderService.getOrderById(id);
    } catch (e) { /* */ }
    if (mounted) setState(() => _loading = false);
  }

  String _formatPrice(double price) {
    final formatted = price.toStringAsFixed(0).replaceAllMapped(
        RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
    return '${formatted}đ';
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
        title: Text(_order != null ? '#${_order!.orderCode}' : 'Chi tiết đơn hàng',
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
          : _order == null
              ? const Center(child: Text('Không tìm thấy đơn hàng',
                  style: TextStyle(color: Colors.white)))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Status
                      _infoCard('Trạng thái', [
                        _infoRow('Tình trạng', _order!.statusLabel),
                        if (_order!.createdAt != null)
                          _infoRow('Ngày đặt',
                              '${_order!.createdAt!.day}/${_order!.createdAt!.month}/${_order!.createdAt!.year}'),
                      ]),
                      const SizedBox(height: 12),

                      // Shipping
                      _infoCard('Thông tin giao hàng', [
                        _infoRow('Người nhận', _order!.customerName),
                        _infoRow('SĐT', _order!.customerPhone),
                        _infoRow('Địa chỉ', '${_order!.shipAddressLine1}, ${_order!.shipCity}, ${_order!.shipProvince}'),
                        if (_order!.note != null && _order!.note!.isNotEmpty)
                          _infoRow('Ghi chú', _order!.note!),
                      ]),
                      const SizedBox(height: 12),

                      // Items
                      _sectionTitle('Sản phẩm'),
                      const SizedBox(height: 8),
                      ...(_order!.items.map((item) => Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFF141414),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(item.name, style: const TextStyle(
                                          color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
                                      if (item.optionsText != null)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 4),
                                          child: Text(item.optionsText!,
                                              style: TextStyle(color: Colors.white.withValues(alpha: 0.4),
                                                  fontSize: 12)),
                                        ),
                                      const SizedBox(height: 6),
                                      Text('${_formatPrice(item.unitPrice)} x ${item.qty}',
                                          style: TextStyle(color: Colors.white.withValues(alpha: 0.5),
                                              fontSize: 13)),
                                    ],
                                  ),
                                ),
                                Text(_formatPrice(item.lineTotal),
                                    style: const TextStyle(color: Color(0xFFD4AF37),
                                        fontSize: 15, fontWeight: FontWeight.w700)),
                              ],
                            ),
                          ))),
                      const SizedBox(height: 12),

                      // Payment summary
                      _infoCard('Thanh toán', [
                        _infoRow('Tạm tính', _formatPrice(_order!.subtotal)),
                        if (_order!.discountTotal > 0)
                          _infoRow('Giảm giá', '-${_formatPrice(_order!.discountTotal)}'),
                        _infoRow('Phí vận chuyển', _formatPrice(_order!.shippingFee)),
                        const Padding(padding: EdgeInsets.symmetric(vertical: 8),
                            child: Divider(color: Color(0xFF2A2A2A))),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Tổng cộng', style: TextStyle(
                                color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                            Text(_formatPrice(_order!.grandTotal),
                                style: const TextStyle(color: Color(0xFFD4AF37),
                                    fontSize: 20, fontWeight: FontWeight.w800)),
                          ],
                        ),
                        if (_order!.payments.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          _infoRow('Phương thức', _order!.payments.first.methodLabel),
                        ],
                      ]),

                      // Cancel button
                      if (_order!.status == 'pending') ...[
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: OutlinedButton(
                            onPressed: () async {
                              final confirm = await showDialog<bool>(
                                context: context,
                                builder: (_) => AlertDialog(
                                  backgroundColor: const Color(0xFF1A1A1A),
                                  title: const Text('Hủy đơn hàng', style: TextStyle(color: Colors.white)),
                                  content: const Text('Bạn chắc chắn muốn hủy đơn hàng này?',
                                      style: TextStyle(color: Colors.grey)),
                                  actions: [
                                    TextButton(onPressed: () => Navigator.pop(context, false),
                                        child: const Text('Không', style: TextStyle(color: Colors.grey))),
                                    TextButton(onPressed: () => Navigator.pop(context, true),
                                        child: const Text('Hủy đơn', style: TextStyle(color: Colors.red))),
                                  ],
                                ),
                              );
                              if (confirm == true) {
                                await _orderService.cancelOrder(_order!.id);
                                if (mounted) _loadOrder(_order!.id);
                              }
                            },
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Colors.red),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text('Hủy đơn hàng', style: TextStyle(color: Colors.red)),
                          ),
                        ),
                      ],
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
    );
  }

  Widget _sectionTitle(String title) {
    return Text(title,
        style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w600));
  }

  Widget _infoCard(String title, List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 14,
              fontWeight: FontWeight.w600, letterSpacing: 0.5)),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5), fontSize: 13)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(color: Colors.white, fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
