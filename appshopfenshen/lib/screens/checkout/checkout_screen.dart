import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/order_service.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _provinceCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();
  final _couponCtrl = TextEditingController();

  String _paymentMethod = 'cod';
  bool _ordering = false;
  double _discount = 0;

  @override
  void initState() {
    super.initState();
    _prefillUserInfo();
  }

  void _prefillUserInfo() {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    if (user != null) {
      _nameCtrl.text = user.fullName ?? '';
      _phoneCtrl.text = user.phone ?? '';
      _addressCtrl.text = user.addressLine1 ?? '';
      _cityCtrl.text = user.city ?? '';
      _provinceCtrl.text = user.province ?? '';
    }
  }

  Future<void> _applyCoupon() async {
    if (_couponCtrl.text.trim().isEmpty) return;
    final cart = Provider.of<CartProvider>(context, listen: false);
    final result = await cart.applyCoupon(_couponCtrl.text.trim());
    if (!mounted) return;

    if (result != null) {
      setState(() {
        _discount = (result['discount'] ?? 0).toDouble();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã áp dụng mã giảm giá!'),
          backgroundColor: Color(0xFF2E7D32),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Mã giảm giá không hợp lệ'),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _ordering = true);

    try {
      final orderService = OrderService();
      final res = await orderService.checkout(
        customerName: _nameCtrl.text.trim(),
        customerPhone: _phoneCtrl.text.trim(),
        addressLine1: _addressCtrl.text.trim(),
        city: _cityCtrl.text.trim(),
        province: _provinceCtrl.text.trim(),
        paymentMethod: _paymentMethod,
        note: _noteCtrl.text.trim().isEmpty ? null : _noteCtrl.text.trim(),
        couponCode: _couponCtrl.text.trim().isEmpty
            ? null
            : _couponCtrl.text.trim(),
      );

      if (!mounted) return;

      if (res['success'] == true) {
        // Reload cart (should be empty now)
        Provider.of<CartProvider>(context, listen: false).loadCart();

        final orderCode =
            res['data']?['order_code'] ?? res['data']?['code'] ?? '';
        final paymentUrl =
            res['data']?['paymentUrl'] ?? res['data']?['payment_url'];

        // Handle VNPay redirect
        if (_paymentMethod == 'vnpay' &&
            paymentUrl != null &&
            paymentUrl.toString().isNotEmpty) {
          final uri = Uri.tryParse(paymentUrl.toString());
          if (uri != null && await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          }
        }

        Navigator.of(context).pushReplacementNamed(
          '/order-success',
          arguments: {'orderCode': orderCode, 'paymentMethod': _paymentMethod},
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['message'] ?? 'Đặt hàng thất bại'),
            backgroundColor: Colors.red.shade700,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Lỗi kết nối. Vui lòng thử lại.'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _ordering = false);
    }
  }

  String _formatPrice(double price) {
    final formatted = price
        .toStringAsFixed(0)
        .replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
    return '${formatted}đ';
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _provinceCtrl.dispose();
    _noteCtrl.dispose();
    _couponCtrl.dispose();
    super.dispose();
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
        title: const Text(
          'Thanh toán',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Shipping info
              _sectionTitle('Thông tin giao hàng'),
              const SizedBox(height: 12),
              _buildField(
                _nameCtrl,
                'Họ và tên',
                Icons.person_outline,
                validator: (v) => v!.isEmpty ? 'Vui lòng nhập họ tên' : null,
              ),
              const SizedBox(height: 12),
              _buildField(
                _phoneCtrl,
                'Số điện thoại',
                Icons.phone_outlined,
                keyboardType: TextInputType.phone,
                validator: (v) => v!.isEmpty ? 'Vui lòng nhập SĐT' : null,
              ),
              const SizedBox(height: 12),
              _buildField(
                _addressCtrl,
                'Địa chỉ',
                Icons.location_on_outlined,
                validator: (v) => v!.isEmpty ? 'Vui lòng nhập địa chỉ' : null,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildField(
                      _cityCtrl,
                      'Quận/Huyện',
                      Icons.map_outlined,
                      validator: (v) => v!.isEmpty ? 'Bắt buộc' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildField(
                      _provinceCtrl,
                      'Tỉnh/TP',
                      Icons.flag_outlined,
                      validator: (v) => v!.isEmpty ? 'Bắt buộc' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _buildField(_noteCtrl, 'Ghi chú (tùy chọn)', Icons.note_outlined),

              const SizedBox(height: 28),

              // Payment method
              _sectionTitle('Phương thức thanh toán'),
              const SizedBox(height: 12),
              _paymentOption('cod', 'Thanh toán khi nhận hàng', Icons.money),
              const SizedBox(height: 8),
              _paymentOption(
                'bank_transfer',
                'Chuyển khoản ngân hàng',
                Icons.account_balance,
              ),
              const SizedBox(height: 8),
              _paymentOption('vnpay', 'VNPay', Icons.payment),

              const SizedBox(height: 28),

              // Coupon
              _sectionTitle('Mã giảm giá'),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildField(
                      _couponCtrl,
                      'Nhập mã giảm giá',
                      Icons.discount_outlined,
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _applyCoupon,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1A1A1A),
                        foregroundColor: const Color(0xFFD4AF37),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: const Text('Áp dụng'),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 28),

              // Order summary
              _sectionTitle('Tóm tắt đơn hàng'),
              const SizedBox(height: 12),
              Consumer<CartProvider>(
                builder: (_, cart, __) => Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF141414),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.06),
                    ),
                  ),
                  child: Column(
                    children: [
                      _summaryRow(
                        'Tạm tính (${cart.itemCount} sp)',
                        _formatPrice(cart.totalPrice),
                      ),
                      if (_discount > 0) ...[
                        const SizedBox(height: 8),
                        _summaryRow(
                          'Giảm giá',
                          '-${_formatPrice(_discount)}',
                          valueColor: Colors.green,
                        ),
                      ],
                      const SizedBox(height: 8),
                      _summaryRow(
                        'Phí vận chuyển',
                        'Miễn phí',
                        valueColor: const Color(0xFFD4AF37),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        child: Divider(color: Color(0xFF2A2A2A)),
                      ),
                      _summaryRow(
                        'Tổng cộng',
                        _formatPrice(cart.totalPrice - _discount),
                        isBold: true,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Place order button
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _ordering ? null : _placeOrder,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFD4AF37),
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: _ordering
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.black,
                          ),
                        )
                      : const Text(
                          'Đặt hàng',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 17,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _buildField(
    TextEditingController ctrl,
    String hint,
    IconData icon, {
    String? Function(String?)? validator,
    TextInputType? keyboardType,
  }) {
    return TextFormField(
      controller: ctrl,
      validator: validator,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white, fontSize: 15),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(
          color: Colors.white.withValues(alpha: 0.3),
          fontSize: 15,
        ),
        prefixIcon: Icon(
          icon,
          color: Colors.white.withValues(alpha: 0.4),
          size: 20,
        ),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.06),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFD4AF37), width: 1),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
    );
  }

  Widget _paymentOption(String value, String label, IconData icon) {
    final selected = _paymentMethod == value;
    return GestureDetector(
      onTap: () => setState(() => _paymentMethod = value),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFFD4AF37).withValues(alpha: 0.1)
              : const Color(0xFF141414),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected
                ? const Color(0xFFD4AF37)
                : Colors.white.withValues(alpha: 0.06),
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: selected ? const Color(0xFFD4AF37) : Colors.grey,
              size: 22,
            ),
            const SizedBox(width: 14),
            Text(
              label,
              style: TextStyle(
                color: selected ? const Color(0xFFD4AF37) : Colors.white,
                fontSize: 14,
              ),
            ),
            const Spacer(),
            if (selected)
              const Icon(
                Icons.check_circle,
                color: Color(0xFFD4AF37),
                size: 20,
              ),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(
    String label,
    String value, {
    bool isBold = false,
    Color? valueColor,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: isBold ? 1 : 0.6),
            fontSize: isBold ? 16 : 14,
            fontWeight: isBold ? FontWeight.w700 : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color:
                valueColor ?? (isBold ? const Color(0xFFD4AF37) : Colors.white),
            fontSize: isBold ? 18 : 14,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
