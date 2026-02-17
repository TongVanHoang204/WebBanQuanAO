import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/api_config.dart';
import '../../providers/cart_provider.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  @override
  void initState() {
    super.initState();
    Provider.of<CartProvider>(context, listen: false).loadCart();
  }

  String _getImageUrl(String url) {
    if (url.startsWith('http')) return url;
    return '${ApiConfig.baseUrl}$url';
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
        title: const Text(
          'Giỏ hàng',
          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
        ),
        actions: [
          Consumer<CartProvider>(
            builder: (_, cart, __) => cart.items.isNotEmpty
                ? TextButton(
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (_) => AlertDialog(
                          backgroundColor: const Color(0xFF1A1A1A),
                          title: const Text('Xóa giỏ hàng', style: TextStyle(color: Colors.white)),
                          content: const Text('Bạn chắc chắn muốn xóa toàn bộ giỏ hàng?',
                              style: TextStyle(color: Colors.grey)),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(context, false),
                                child: const Text('Hủy', style: TextStyle(color: Colors.grey))),
                            TextButton(onPressed: () => Navigator.pop(context, true),
                                child: const Text('Xóa', style: TextStyle(color: Colors.red))),
                          ],
                        ),
                      );
                      if (confirm == true) cart.clearAll();
                    },
                    child: const Text('Xóa tất cả', style: TextStyle(color: Colors.red, fontSize: 13)),
                  )
                : const SizedBox(),
          ),
        ],
      ),
      body: Consumer<CartProvider>(
        builder: (_, cart, __) {
          if (cart.isLoading) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)));
          }

          if (cart.items.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.shopping_bag_outlined, size: 80,
                      color: Colors.white.withValues(alpha: 0.1)),
                  const SizedBox(height: 16),
                  Text('Giỏ hàng trống', style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.4), fontSize: 16)),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => Navigator.of(context).pushReplacementNamed('/main'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFD4AF37),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Tiếp tục mua sắm', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: cart.items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = cart.items[index];
                    final imageUrl = item.product?.primaryImageUrl ??
                        item.variant?.imageUrl ?? '';

                    return Dismissible(
                      key: Key(item.id),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 24),
                        decoration: BoxDecoration(
                          color: Colors.red.shade700,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.delete_outline, color: Colors.white),
                      ),
                      onDismissed: (_) => cart.removeItem(item.id),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF141414),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
                        ),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: CachedNetworkImage(
                                imageUrl: _getImageUrl(imageUrl),
                                width: 80, height: 80, fit: BoxFit.cover,
                                placeholder: (_, __) => Container(
                                    width: 80, height: 80, color: const Color(0xFF1A1A1A)),
                                errorWidget: (_, __, ___) => Container(
                                    width: 80, height: 80, color: const Color(0xFF1A1A1A),
                                    child: const Icon(Icons.image, color: Colors.grey)),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.product?.name ?? 'Sản phẩm',
                                    maxLines: 2, overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: Colors.white, fontSize: 14,
                                        fontWeight: FontWeight.w500),
                                  ),
                                  if (item.variant != null && item.variant!.optionValues.isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text(
                                        item.variant!.optionValues.map((o) => o.value).join(' / '),
                                        style: TextStyle(color: Colors.white.withValues(alpha: 0.4),
                                            fontSize: 12),
                                      ),
                                    ),
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(_formatPrice(item.price),
                                          style: const TextStyle(color: Color(0xFFD4AF37),
                                              fontSize: 15, fontWeight: FontWeight.w700)),
                                      // Qty controls
                                      Container(
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF0A0A0A),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            InkWell(
                                              onTap: item.qty > 1
                                                  ? () => cart.updateQty(item.id, item.qty - 1)
                                                  : null,
                                              child: Padding(
                                                padding: const EdgeInsets.all(6),
                                                child: Icon(Icons.remove, size: 16,
                                                    color: item.qty > 1 ? Colors.white : Colors.grey),
                                              ),
                                            ),
                                            Padding(
                                              padding: const EdgeInsets.symmetric(horizontal: 10),
                                              child: Text('${item.qty}',
                                                  style: const TextStyle(color: Colors.white,
                                                      fontSize: 14, fontWeight: FontWeight.w600)),
                                            ),
                                            InkWell(
                                              onTap: () => cart.updateQty(item.id, item.qty + 1),
                                              child: const Padding(
                                                padding: EdgeInsets.all(6),
                                                child: Icon(Icons.add, size: 16, color: Colors.white),
                                              ),
                                            ),
                                          ],
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
                  },
                ),
              ),

              // Bottom checkout bar
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0A0A0A),
                  border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.06))),
                ),
                child: SafeArea(
                  child: Row(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('Tổng cộng', style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.5), fontSize: 13)),
                          const SizedBox(height: 2),
                          Text(_formatPrice(cart.totalPrice),
                              style: const TextStyle(color: Color(0xFFD4AF37),
                                  fontSize: 22, fontWeight: FontWeight.w800)),
                        ],
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: SizedBox(
                          height: 52,
                          child: ElevatedButton(
                            onPressed: () => Navigator.of(context).pushNamed('/checkout'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFD4AF37),
                              foregroundColor: Colors.black,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14)),
                              elevation: 0,
                            ),
                            child: const Text('Thanh toán',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
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
}
