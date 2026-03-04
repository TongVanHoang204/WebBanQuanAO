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
  bool _cancelling = false;

  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _surface = Color(0xFFFFFFFF);
  static const _text = Color(0xFF140E1B);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_order == null) {
      final id = ModalRoute.of(context)?.settings.arguments as String?;
      if (id != null) _loadOrder(id);
    }
  }

  Future<void> _loadOrder(String id) async {
    try { _order = await _orderService.getOrderById(id); } catch (e) { /* */ }
    if (mounted) setState(() => _loading = false);
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
      case 'shipped': return Colors.indigo;
      case 'completed': return Colors.green;
      case 'cancelled': case 'refunded': return Colors.red;
      default: return Colors.grey;
    }
  }

  List<Map<String, dynamic>> _trackingSteps(String status) {
    final steps = [
      {'label': 'Đặt hàng', 'icon': Icons.receipt_outlined, 'statuses': ['pending', 'confirmed', 'paid', 'processing', 'shipped', 'completed']},
      {'label': 'Xác nhận', 'icon': Icons.check_circle_outline, 'statuses': ['confirmed', 'paid', 'processing', 'shipped', 'completed']},
      {'label': 'Đang giao', 'icon': Icons.local_shipping_outlined, 'statuses': ['shipped', 'completed']},
      {'label': 'Hoàn thành', 'icon': Icons.star_outline, 'statuses': ['completed']},
    ];
    return steps.map((s) => {...s, 'done': (s['statuses'] as List).contains(status)}).toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return Scaffold(backgroundColor: _bg, appBar: AppBar(backgroundColor: _bg, elevation: 0,
      leading: IconButton(icon: const Icon(Icons.arrow_back_ios, size: 20, color: _text), onPressed: () => Navigator.of(context).pop())),
      body: const Center(child: CircularProgressIndicator(color: _primary)));
    if (_order == null) return Scaffold(backgroundColor: _bg,
      appBar: AppBar(backgroundColor: _bg, elevation: 0, leading: IconButton(icon: const Icon(Icons.arrow_back_ios, size: 20, color: _text), onPressed: () => Navigator.of(context).pop())),
      body: const Center(child: Text('Không tìm thấy đơn hàng')));

    final o = _order!;
    final steps = o.status != 'cancelled' && o.status != 'refunded' ? _trackingSteps(o.status) : null;

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg, elevation: 0, scrolledUnderElevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios, size: 20, color: _text), onPressed: () => Navigator.of(context).pop()),
        title: Text('#${o.orderCode}', style: const TextStyle(color: _text, fontSize: 18, fontWeight: FontWeight.w800)),
        actions: [Container(margin: const EdgeInsets.only(right: 16), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(color: _statusColor(o.status).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(50)),
          child: Text(o.statusLabel, style: TextStyle(color: _statusColor(o.status), fontSize: 12, fontWeight: FontWeight.w700)))],
      ),
      body: SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Tracking steps
        if (steps != null) _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Theo dõi đơn hàng', style: TextStyle(color: _text, fontSize: 14, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          Row(children: steps.asMap().entries.map((e) {
            final idx = e.key; final step = e.value; final done = step['done'] as bool;
            return Expanded(child: Column(children: [
              Row(children: [
                if (idx > 0) Expanded(child: Container(height: 2, color: steps[idx - 1]['done'] as bool ? _primary : Colors.grey.shade200)),
                Container(width: 36, height: 36, decoration: BoxDecoration(
                  color: done ? _primary : Colors.grey.shade100, shape: BoxShape.circle),
                  child: Icon(step['icon'] as IconData, size: 18, color: done ? Colors.white : Colors.grey.shade400)),
                if (idx < steps.length - 1) Expanded(child: Container(height: 2, color: done ? _primary : Colors.grey.shade200)),
              ]),
              const SizedBox(height: 6),
              Text(step['label'] as String, textAlign: TextAlign.center, style: TextStyle(
                fontSize: 10, fontWeight: done ? FontWeight.w700 : FontWeight.w400,
                color: done ? _primary : Colors.grey.shade400)),
            ]));
          }).toList()),
        ])),
        if (steps != null) const SizedBox(height: 12),

        // Shipping info
        _card(title: 'Thông tin giao hàng', child: Column(children: [
          _row(Icons.person_outline, 'Người nhận', o.customerName),
          _row(Icons.phone_outlined, 'Số điện thoại', o.customerPhone),
          _row(Icons.location_on_outlined, 'Địa chỉ', '${o.shipAddressLine1}, ${o.shipCity}, ${o.shipProvince}'),
          if (o.note != null && o.note!.isNotEmpty) _row(Icons.note_outlined, 'Ghi chú', o.note!),
        ])),
        const SizedBox(height: 12),

        // Products
        _card(title: 'Sản phẩm (${o.items.length})', child: Column(children: o.items.map((item) => Container(
          margin: const EdgeInsets.only(bottom: 12),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item.name, style: const TextStyle(color: _text, fontSize: 14, fontWeight: FontWeight.w600)),
              if (item.optionsText != null) Padding(padding: const EdgeInsets.only(top: 3),
                child: Text(item.optionsText!, style: TextStyle(color: Colors.grey.shade500, fontSize: 12))),
              const SizedBox(height: 4),
              Text(_price(item.unitPrice) + ' × ${item.qty}', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
              if (o.status == 'completed' && item.productId.isNotEmpty) ...[
                const SizedBox(height: 8),
                SizedBox(
                  height: 32,
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pushNamed('/reviews', arguments: {
                      'productId': item.productId,
                      'productName': item.name,
                    }),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _primary,
                      side: const BorderSide(color: _primary),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
                    ),
                    child: const Text('Đánh giá', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ])),
            Text(_price(item.lineTotal), style: const TextStyle(color: _primary, fontSize: 14, fontWeight: FontWeight.w700)),
          ]))).toList())),
        const SizedBox(height: 12),

        // Payment
        _card(title: 'Thanh toán', child: Column(children: [
          _amountRow('Tạm tính', _price(o.subtotal)),
          if (o.discountTotal > 0) _amountRow('Giảm giá', '-${_price(o.discountTotal)}', valueColor: Colors.green),
          _amountRow('Phí vận chuyển', o.shippingFee == 0 ? 'Miễn phí' : _price(o.shippingFee), valueColor: o.shippingFee == 0 ? Colors.green : null),
          Divider(height: 20, color: Colors.grey.shade100),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Tổng cộng', style: TextStyle(color: _text, fontSize: 15, fontWeight: FontWeight.w800)),
            Text(_price(o.grandTotal), style: const TextStyle(color: _primary, fontSize: 18, fontWeight: FontWeight.w800)),
          ]),
          if (o.payments.isNotEmpty) ...[
            const SizedBox(height: 10),
            Divider(height: 1, color: Colors.grey.shade100),
            const SizedBox(height: 10),
            _amountRow('Phương thức', o.payments.first.methodLabel),
          ],
        ])),

        // Cancel button
        if (o.status == 'pending') ...[
          const SizedBox(height: 20),
          SizedBox(width: double.infinity, height: 50, child: OutlinedButton.icon(
            icon: _cancelling
              ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.red))
              : const Icon(Icons.cancel_outlined, size: 20),
            label: Text(_cancelling ? 'Đang hủy...' : 'Hủy đơn hàng', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            onPressed: _cancelling ? null : () async {
              final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                title: const Text('Hủy đơn hàng?'),
                content: const Text('Bạn có chắc muốn hủy đơn hàng này?'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Không', style: TextStyle(color: Colors.grey.shade500))),
                  TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Hủy đơn', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700))),
                ]));
              if (ok == true) {
                setState(() => _cancelling = true);
                try {
                  final res = await _orderService.cancelOrder(o.id);
                  if (!mounted) return;
                  if (res['success'] == true) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Đã hủy đơn hàng thành công'), backgroundColor: Colors.green, behavior: SnackBarBehavior.floating));
                    _loadOrder(o.id);
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(res['message'] ?? 'Không thể hủy đơn hàng'), backgroundColor: Colors.red.shade400, behavior: SnackBarBehavior.floating));
                  }
                } catch (e) {
                  if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Lỗi kết nối. Vui lòng thử lại.'), backgroundColor: Colors.red, behavior: SnackBarBehavior.floating));
                } finally {
                  if (mounted) setState(() => _cancelling = false);
                }
              }},
            style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: BorderSide(color: Colors.red.shade300),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
          )),
        ],
        const SizedBox(height: 40),
      ])),
    );
  }

  Widget _card({String? title, required Widget child}) {
    return Container(
      width: double.infinity, padding: const EdgeInsets.all(16), margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: _surface, borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2))]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (title != null) ...[Text(title, style: const TextStyle(color: _text, fontSize: 14, fontWeight: FontWeight.w700)), const SizedBox(height: 12)],
        child,
      ]));
  }

  Widget _row(IconData icon, String label, String value) {
    return Padding(padding: const EdgeInsets.only(bottom: 10), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, size: 16, color: _primary.withValues(alpha: 0.7)),
      const SizedBox(width: 8),
      SizedBox(width: 90, child: Text(label, style: TextStyle(color: Colors.grey.shade500, fontSize: 13))),
      Expanded(child: Text(value, style: const TextStyle(color: _text, fontSize: 13, fontWeight: FontWeight.w500))),
    ]));
  }

  Widget _amountRow(String label, String value, {Color? valueColor}) {
    return Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
      Text(value, style: TextStyle(color: valueColor ?? _text, fontSize: 13, fontWeight: FontWeight.w600)),
    ]));
  }
}
