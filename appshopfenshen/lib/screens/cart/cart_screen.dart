import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/api_config.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});
  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _promoCtrl = TextEditingController();
  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _surface = Color(0xFFFFFFFF);
  static const _text = Color(0xFF140E1B);

  @override
  void initState() {
    super.initState();
    Provider.of<CartProvider>(context, listen: false).loadCart();
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
    _promoCtrl.dispose();
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
        leading: ModalRoute.of(context)?.settings.name == '/cart' ? IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20, color: _text),
          onPressed: () => Navigator.of(context).pop(),
        ) : null,
        centerTitle: true,
        title: Consumer<CartProvider>(
          builder: (_, cart, __) => Text(
            'Giỏ của tôi (${cart.itemCount})',
            style: const TextStyle(
              color: _text,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ),
      body: Consumer<CartProvider>(
        builder: (_, cart, __) {
          if (cart.isLoading)
            return const Center(
              child: CircularProgressIndicator(color: _primary),
            );
          if (cart.items.isEmpty)
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.shopping_bag_outlined,
                    size: 80,
                    color: Colors.grey.shade300,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Giỏ hàng trống',
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 16),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () =>
                        Navigator.of(context).pushReplacementNamed('/main'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 14,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(50),
                      ),
                    ),
                    child: const Text(
                      'Tiếp tục mua sắm',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            );

          return Column(
            children: [
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(20),
                  itemCount: cart.items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (ctx, i) {
                    final item = cart.items[i];
                    final img =
                        item.product?.primaryImageUrl ??
                        item.variant?.imageUrl ??
                        '';
                    return Dismissible(
                      key: Key(item.id),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 24),
                        decoration: BoxDecoration(
                          color: Colors.red.shade400,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.delete_outline,
                          color: Colors.white,
                        ),
                      ),
                      onDismissed: (_) => cart.removeItem(item.id),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade100),
                        ),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: CachedNetworkImage(
                                imageUrl: _img(img),
                                width: 80,
                                height: 80,
                                fit: BoxFit.cover,
                                placeholder: (_, __) => Container(
                                  width: 80,
                                  height: 80,
                                  color: Colors.grey.shade100,
                                ),
                                errorWidget: (_, __, ___) => Container(
                                  width: 80,
                                  height: 80,
                                  color: Colors.grey.shade100,
                                  child: const Icon(
                                    Icons.image,
                                    color: Colors.grey,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.product?.name ?? 'Sản phẩm',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: _text,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  if (item.variant != null &&
                                      item.variant!.optionValues.isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 2),
                                      child: Text(
                                        item.variant!.optionValues
                                            .map((o) => o.value)
                                            .join(' | '),
                                        style: TextStyle(
                                          color: Colors.grey.shade500,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  const SizedBox(height: 8),
                                  Text(
                                    _price(item.price),
                                    style: const TextStyle(
                                      color: _primary,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                GestureDetector(
                                  onTap: () async {
                                    final confirm = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                      title: const Text('Xóa sản phẩm'),
                                      content: Text('Bạn có chắc muốn xóa "${item.product?.name ?? 'Sản phẩm'}" khỏi giỏ hàng?'),
                                      actions: [
                                        TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Hủy', style: TextStyle(color: Colors.grey.shade500))),
                                        TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Xóa', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700))),
                                      ]));
                                    if (confirm == true) cart.removeItem(item.id);
                                  },
                                  child: const Icon(Icons.close,
                                      size: 18, color: Colors.grey),
                                ),
                                const SizedBox(height: 12),
                                _qtyBtn(
                                  Icons.remove,
                                  item.qty > 1
                                      ? () => cart.updateQty(
                                          item.id,
                                          item.qty - 1,
                                        )
                                      : null,
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 4,
                                  ),
                                  child: Text(
                                    '${item.qty}',
                                    style: const TextStyle(
                                      color: _text,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                _qtyBtn(
                                  Icons.add,
                                  () async {
                                    final ok = await cart.updateQty(
                                        item.id, item.qty + 1);
                                    if (!ok && context.mounted) {
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        const SnackBar(
                                          content: Text('Vượt mức tồn kho'),
                                          backgroundColor: Colors.red,
                                          duration: Duration(seconds: 2),
                                        ),
                                      );
                                    }
                                  },
                                  active: true,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              // Bottom summary
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: _surface,
                  border: Border(top: BorderSide(color: Colors.grey.shade100)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, -2),
                    ),
                  ],
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Promo code
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: Row(
                          children: [
                            const Text(
                              'MÃ GIẢM GIÁ',
                              style: TextStyle(
                                color: _text,
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              height: 44,
                              decoration: BoxDecoration(
                                color: _bg,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: Row(
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.only(left: 12),
                                    child: Icon(
                                      Icons.confirmation_number_outlined,
                                      size: 18,
                                      color: _primary.withValues(alpha: 0.5),
                                    ),
                                  ),
                                  Expanded(
                                    child: TextField(
                                      controller: _promoCtrl,
                                      style: const TextStyle(fontSize: 13),
                                      decoration: const InputDecoration(
                                        hintText: 'Nhập mã giảm giá',
                                        border: InputBorder.none,
                                        contentPadding: EdgeInsets.symmetric(
                                          horizontal: 8,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () {
                              final code = _promoCtrl.text.trim();
                              if (code.isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Vui lòng nhập mã giảm giá'), behavior: SnackBarBehavior.floating, backgroundColor: Colors.orange));
                                return;
                              }
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Mã "$code" - Tính năng sắp ra mắt!'), behavior: SnackBarBehavior.floating, backgroundColor: _primary));
                            },
                            child: Container(
                              height: 44,
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              decoration: BoxDecoration(
                                color: _primary,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Center(
                                child: Text(
                                  'Áp dụng',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _summaryRow('Tạm tính', _price(cart.totalPrice)),
                      const SizedBox(height: 8),
                      _summaryRow(
                        'Vận chuyển',
                        'Miễn phí',
                        valueColor: Colors.green,
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        child: Divider(height: 1),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Tổng cộng',
                            style: TextStyle(
                              color: _text,
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            _price(cart.totalPrice),
                            style: const TextStyle(
                              color: _primary,
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: () {
                              final auth = Provider.of<AuthProvider>(context, listen: false);
                              if (!auth.isLoggedIn) {
                                showDialog(context: context, builder: (ctx) => AlertDialog(
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  title: const Text('Chưa đăng nhập'),
                                  content: const Text('Bạn cần đăng nhập để tiến hành thanh toán.'),
                                  actions: [
                                    TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Để sau', style: TextStyle(color: Colors.grey.shade500))),
                                    TextButton(onPressed: () { Navigator.pop(ctx); Navigator.of(context).pushNamed('/login'); },
                                      child: const Text('Đăng nhập', style: TextStyle(color: Color(0xFF7F19E6), fontWeight: FontWeight.w700))),
                                  ]));
                                return;
                              }
                              Navigator.of(context).pushNamed('/checkout');
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 0,
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Tiến hành thanh toán',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward, size: 20),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _qtyBtn(IconData icon, VoidCallback? onTap, {bool active = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: active ? _primary : Colors.grey.shade100,
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          size: 14,
          color: active
              ? Colors.white
              : (onTap != null ? _text : Colors.grey.shade400),
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value, {Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
        ),
        Text(
          value,
          style: TextStyle(
            color: valueColor ?? _text,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
