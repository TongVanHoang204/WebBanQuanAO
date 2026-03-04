import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../config/api_config.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _surface = Color(0xFFFFFFFF);
  static const _text = Color(0xFF140E1B);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text(
          'Tài khoản',
          style: TextStyle(
            color: _text,
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.notifications_outlined,
              color: Colors.grey.shade600,
              size: 24,
            ),
            onPressed: () => Navigator.of(context).pushNamed('/notifications'),
          ),
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (_, auth, __) {
          if (!auth.isLoggedIn) return _loginPrompt(context);
          final user = auth.user!;
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                // Avatar
                GestureDetector(
                  onTap: () => Navigator.of(context).pushNamed('/edit-profile'),
                  child: Column(
                    children: [
                      Stack(
                        children: [
                          CircleAvatar(
                            radius: 48,
                            backgroundColor: _primary.withValues(alpha: 0.1),
                            backgroundImage: user.avatarUrl != null
                                ? NetworkImage(
                                    user.avatarUrl!.startsWith('http')
                                        ? user.avatarUrl!
                                        : '${ApiConfig.baseUrl}${user.avatarUrl}',
                                  )
                                : null,
                            child: user.avatarUrl == null
                                ? Text(
                                    (user.fullName ?? user.username)
                                        .substring(0, 1)
                                        .toUpperCase(),
                                    style: const TextStyle(
                                      fontSize: 34,
                                      fontWeight: FontWeight.w800,
                                      color: _primary,
                                    ),
                                  )
                                : null,
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              width: 26,
                              height: 26,
                              decoration: BoxDecoration(
                                color: _primary,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white,
                                  width: 2,
                                ),
                              ),
                              child: const Icon(
                                Icons.camera_alt,
                                size: 14,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        user.fullName ?? user.username,
                        style: const TextStyle(
                          color: _text,
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user.email,
                        style: TextStyle(
                          color: Colors.grey.shade500,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(50),
                          border: Border.all(
                            color: _primary.withValues(alpha: 0.2),
                          ),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.star_rounded, color: _primary, size: 14),
                            SizedBox(width: 6),
                            Text(
                              'GOLD MEMBER',
                              style: TextStyle(
                                color: _primary,
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // My Orders
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: _surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.grey.shade100),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Đơn hàng',
                            style: TextStyle(
                              color: _text,
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          GestureDetector(
                            onTap: () =>
                                Navigator.of(context).pushNamed('/orders'),
                            child: const Text(
                              'Xem tất cả',
                              style: TextStyle(
                                color: _primary,
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _orderTab(
                            context,
                            Icons.inventory_2_outlined,
                            'Đang xử lý',
                            1,
                          ),
                          _orderTab(
                            context,
                            Icons.local_shipping_outlined,
                            'Đang giao',
                            2,
                          ),
                          _orderTab(
                            context,
                            Icons.check_circle_outline,
                            'Hoàn thành',
                            3,
                          ),
                          _orderTab(context, Icons.star_outline, 'Đánh giá', 4),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Shopping menu
                _section([
                  _tile(
                    context,
                    Icons.favorite_outline,
                    'Yêu thích',
                    '/wishlist-screen',
                    badge: '',
                  ),
                  _tile(
                    context,
                    Icons.location_on_outlined,
                    'Địa chỉ giao hàng',
                    '/addresses',
                    iconColor: Colors.red,
                  ),
                  _tile(
                    context,
                    Icons.confirmation_number_outlined,
                    'Voucher của tôi',
                    '/vouchers',
                    iconColor: Colors.orange,
                  ),
                  _tile(
                    context,
                    Icons.payment_outlined,
                    'Phương thức thanh toán',
                    '/payment-methods',
                    iconColor: Colors.green,
                  ),
                ]),
                const SizedBox(height: 16),

                // Support menu
                _section([
                  _tile(
                    context,
                    Icons.smart_toy_outlined,
                    'Chat với AI',
                    '/ai-chat',
                    iconColor: _primary,
                  ),
                  _tile(
                    context,
                    Icons.support_agent_outlined,
                    'Hỗ trợ khách hàng',
                    '/support-chat',
                    iconColor: Colors.blue,
                  ),
                  _tile(
                    context,
                    Icons.notifications_outlined,
                    'Thông báo',
                    '/notifications',
                    iconColor: Colors.amber,
                  ),
                ]),
                const SizedBox(height: 16),

                // Settings menu
                _section([
                  _tile(
                    context,
                    Icons.settings_outlined,
                    'Cài đặt',
                    '/settings',
                    iconColor: Colors.grey,
                  ),
                  _tile(
                    context,
                    Icons.lock_outline,
                    'Đổi mật khẩu',
                    '/change-password',
                  ),
                  _tile(context, Icons.info_outline, 'Về chúng tôi', '/about'),
                  _tile(
                    context,
                    Icons.policy_outlined,
                    'Chính sách',
                    '/policy',
                  ),
                  _tile(context, Icons.phone_outlined, 'Liên hệ', '/contact'),
                ]),
                const SizedBox(height: 24),

                // Logout
                GestureDetector(
                  onTap: () async {
                    final ok = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        title: const Text('Đăng xuất'),
                        content: const Text('Bạn có chắc muốn đăng xuất?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, false),
                            child: Text(
                              'Hủy',
                              style: TextStyle(color: Colors.grey.shade500),
                            ),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, true),
                            child: const Text(
                              'Đăng xuất',
                              style: TextStyle(
                                color: Colors.red,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                    if (ok != true || !context.mounted) return;
                    await auth.logout();
                    if (context.mounted)
                      Navigator.of(context).pushReplacementNamed('/login');
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.red.shade200),
                      borderRadius: BorderRadius.circular(50),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.logout,
                          color: Colors.red.shade400,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Đăng xuất',
                          style: TextStyle(
                            color: Colors.red.shade400,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Shop Feshen v2.1.0',
                  style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                ),
                const SizedBox(height: 40),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _loginPrompt(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: _primary.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.person_outline, size: 50, color: _primary),
          ),
          const SizedBox(height: 20),
          const Text(
            'Chưa đăng nhập',
            style: TextStyle(
              color: _text,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Đăng nhập để xem đơn hàng và tài khoản',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: 200,
            child: ElevatedButton(
              onPressed: () => Navigator.of(context).pushNamed('/login'),
              style: ElevatedButton.styleFrom(
                backgroundColor: _primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50),
                ),
              ),
              child: const Text(
                'Đăng nhập',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => Navigator.of(context).pushNamed('/register'),
            child: const Text(
              'Tạo tài khoản mới',
              style: TextStyle(color: _primary, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _orderTab(BuildContext context, IconData icon, String label, int initialIndex) {
    return GestureDetector(
      onTap: () => Navigator.of(context).pushNamed('/orders', arguments: {'initialIndex': initialIndex}),
      child: Column(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: _primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: _primary, size: 24),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _section(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        children: children
            .asMap()
            .entries
            .map(
              (e) => Column(
                children: [
                  e.value,
                  if (e.key < children.length - 1)
                    Divider(height: 1, indent: 68, color: Colors.grey.shade100),
                ],
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _tile(
    BuildContext context,
    IconData icon,
    String label,
    String? route, {
    Color? iconColor,
    String? badge,
  }) {
    return ListTile(
      onTap: route != null
          ? () {
              // Routes that don't exist yet show a coming soon dialog
              final existingRoutes = [
                '/wishlist-screen',
                '/addresses',
                '/change-password',
                '/about',
                '/policy',
                '/contact',
                '/ai-chat',
                '/support-chat',
                '/notifications',
                '/orders',
                '/edit-profile',
                '/vouchers',
                '/settings',
              ];
              if (existingRoutes.contains(route)) {
                Navigator.of(context).pushNamed(route);
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('$label - Sắp ra mắt!'),
                    behavior: SnackBarBehavior.floating,
                    backgroundColor: _primary,
                    duration: const Duration(seconds: 2),
                  ),
                );
              }
            }
          : null,
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: (iconColor ?? _primary).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 20, color: iconColor ?? _primary),
      ),
      title: Text(
        label,
        style: const TextStyle(
          color: _text,
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
      trailing: Icon(
        Icons.chevron_right,
        color: Colors.grey.shade400,
        size: 20,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      minVerticalPadding: 8,
    );
  }
}
