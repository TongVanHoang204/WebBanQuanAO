import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/coupon_service.dart';

class VouchersScreen extends StatefulWidget {
  const VouchersScreen({super.key});
  @override
  State<VouchersScreen> createState() => _VouchersScreenState();
}

class _VouchersScreenState extends State<VouchersScreen> with SingleTickerProviderStateMixin {
  final CouponService _couponService = CouponService();
  late TabController _tabCtrl;
  List<Map<String, dynamic>> _myCoupons = [];
  List<Map<String, dynamic>> _publicCoupons = [];
  bool _loading = true;

  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _surface = Color(0xFFFFFFFF);
  static const _text = Color(0xFF140E1B);

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() { _tabCtrl.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    final results = await Future.wait([
      _couponService.getUserCoupons(),
      _couponService.getPublicCoupons(),
    ]);
    if (mounted) setState(() { _myCoupons = results[0]; _publicCoupons = results[1]; _loading = false; });
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'percent': return Colors.orange;
      case 'fixed': return Colors.blue;
      case 'free_ship': return Colors.green;
      default: return _primary;
    }
  }

  String _typeLabel(String type) {
    switch (type) { case 'percent': return 'Giảm %'; case 'fixed': return 'Giảm tiền'; case 'free_ship': return 'Free ship'; default: return type; }
  }

  String _value(Map c) {
    final type = c['type'] ?? '';
    final val = (c['value'] ?? 0).toDouble();
    if (type == 'percent') return '-${val.toInt()}%';
    if (type == 'free_ship') return 'Miễn phí vận chuyển';
    return '-${val.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')}đ';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(backgroundColor: _bg, elevation: 0, scrolledUnderElevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios, size: 20, color: _text), onPressed: () => Navigator.pop(context)),
        title: const Text('Voucher & Mã giảm giá', style: TextStyle(color: _text, fontSize: 18, fontWeight: FontWeight.w800)),
        bottom: TabBar(controller: _tabCtrl, labelColor: _primary, unselectedLabelColor: Colors.grey.shade500,
          labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
          indicatorColor: _primary, dividerColor: Colors.grey.shade200,
          tabs: const [Tab(text: 'Của tôi'), Tab(text: 'Công khai')])),
      body: _loading
        ? const Center(child: CircularProgressIndicator(color: _primary))
        : TabBarView(controller: _tabCtrl, children: [
            _voucherList(_myCoupons),
            _voucherList(_publicCoupons),
          ]),
    );
  }

  Widget _voucherList(List<Map<String, dynamic>> coupons) {
    if (coupons.isEmpty) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.confirmation_number_outlined, size: 80, color: Colors.grey.shade200),
      const SizedBox(height: 16),
      Text('Không có voucher nào', style: TextStyle(color: Colors.grey.shade500, fontSize: 15)),
    ]));
    return RefreshIndicator(onRefresh: _load, color: _primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: coupons.length,
        itemBuilder: (_, i) {
          final c = coupons[i];
          final type = c['type'] as String? ?? 'fixed';
          final color = _typeColor(type);
          final isUsed = c['is_used'] == true;
          final isExpired = c['expires_at'] != null && DateTime.tryParse(c['expires_at'])?.isBefore(DateTime.now()) == true;
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(color: _surface, borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade100),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2))]),
            child: Row(children: [
              // Left color bar + icon
              Container(width: 80, height: 100,
                decoration: BoxDecoration(color: isUsed || isExpired ? Colors.grey.shade100 : color.withValues(alpha: 0.1),
                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(16))),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(type == 'free_ship' ? Icons.local_shipping_outlined : Icons.discount_outlined,
                    color: isUsed || isExpired ? Colors.grey.shade400 : color, size: 28),
                  const SizedBox(height: 4),
                  Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: isUsed || isExpired ? Colors.grey.shade400 : color, borderRadius: BorderRadius.circular(4)),
                    child: Text(_typeLabel(type), style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700))),
                ])),
              // Dashed divider
              Container(height: 80, child: VerticalDivider(width: 1, color: Colors.grey.shade200, thickness: 1)),
              const SizedBox(width: 12),
              Expanded(child: Opacity(opacity: isUsed || isExpired ? 0.5 : 1.0, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_value(c), style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text(c['description'] ?? c['name'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12, height: 1.4)),
                const SizedBox(height: 6),
                if (c['min_order_value'] != null) Text(
                  'Đơn tối thiểu ${(c['min_order_value'] as num).toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')}đ',
                  style: TextStyle(color: Colors.grey.shade400, fontSize: 11)),
                if (isExpired) const Text('Đã hết hạn', style: TextStyle(color: Colors.red, fontSize: 11, fontWeight: FontWeight.w600)),
                if (isUsed) const Text('Đã sử dụng', style: TextStyle(color: Colors.orange, fontSize: 11, fontWeight: FontWeight.w600)),
              ]))),
              const SizedBox(width: 8),
              // Copy button
              if (!isUsed && !isExpired && c['code'] != null) Padding(
                padding: const EdgeInsets.only(right: 12),
                child: GestureDetector(
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: c['code'] as String));
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text('Đã sao chép mã!'), behavior: SnackBarBehavior.floating,
                      duration: Duration(seconds: 1)));
                  },
                  child: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(color: _primary, borderRadius: BorderRadius.circular(8)),
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Text(c['code'] as String, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 2),
                      const Text('Sao chép', style: TextStyle(color: Colors.white70, fontSize: 10)),
                    ])),
                )),
              const SizedBox(width: 4),
            ]),
          );
        }));
  }
}
