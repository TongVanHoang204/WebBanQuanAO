import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../config/api_config.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: const Text(
          'Tài khoản',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          Consumer<AuthProvider>(
            builder: (_, auth, __) => auth.isLoggedIn
                ? IconButton(
                    icon: const Icon(
                      Icons.notifications_outlined,
                      color: Colors.white,
                      size: 22,
                    ),
                    onPressed: () =>
                        Navigator.of(context).pushNamed('/notifications'),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (_, auth, __) {
          if (!auth.isLoggedIn) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.person_outline,
                    size: 80,
                    color: Colors.white.withValues(alpha: 0.1),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Vui lòng đăng nhập',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.5),
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => Navigator.of(context).pushNamed('/login'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFD4AF37),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 14,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Đăng nhập',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            );
          }

          final user = auth.user!;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Avatar + Name
                GestureDetector(
                  onTap: () => Navigator.of(context).pushNamed('/edit-profile'),
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFFD4AF37).withValues(alpha: 0.15),
                          const Color(0xFF141414),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFFD4AF37).withValues(alpha: 0.2),
                      ),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 30,
                          backgroundColor: const Color(0xFFD4AF37),
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
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black,
                                  ),
                                )
                              : null,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user.fullName ?? user.username,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                user.email,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.5),
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          Icons.edit_outlined,
                          color: Colors.white.withValues(alpha: 0.3),
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Menu items
                _menuItem(
                  context,
                  Icons.shopping_bag_outlined,
                  'Đơn hàng của tôi',
                  '/orders',
                ),
                _menuItem(
                  context,
                  Icons.favorite_border,
                  'Sản phẩm yêu thích',
                  null,
                  onTap: () {
                    // Switch to wishlist tab in MainNavigation
                    Navigator.of(context).pop();
                  },
                ),
                _menuItem(
                  context,
                  Icons.location_on_outlined,
                  'Địa chỉ giao hàng',
                  '/addresses',
                ),
                _menuItem(
                  context,
                  Icons.lock_outline,
                  'Đổi mật khẩu',
                  '/change-password',
                ),
                _menuItem(
                  context,
                  Icons.notifications_outlined,
                  'Thông báo',
                  '/notifications',
                ),

                const SizedBox(height: 8),
                Divider(color: Colors.white.withValues(alpha: 0.06)),
                const SizedBox(height: 8),

                _menuItem(
                  context,
                  Icons.storefront_outlined,
                  'Cửa hàng',
                  '/shop',
                ),
                _menuItem(
                  context,
                  Icons.local_offer_outlined,
                  'Flash Sale',
                  '/sale',
                ),
                _menuItem(context, Icons.help_outline, 'Liên hệ', '/contact'),
                _menuItem(
                  context,
                  Icons.policy_outlined,
                  'Chính sách',
                  '/policy',
                ),
                _menuItem(
                  context,
                  Icons.info_outline,
                  'Về ShopFeshen',
                  '/about',
                ),

                const SizedBox(height: 24),

                // Logout
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final confirmed = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          backgroundColor: const Color(0xFF1A1A1A),
                          title: const Text(
                            'Đăng xuất',
                            style: TextStyle(color: Colors.white),
                          ),
                          content: const Text(
                            'Bạn có chắc muốn đăng xuất?',
                            style: TextStyle(color: Colors.white70),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.of(ctx).pop(false),
                              child: const Text(
                                'Hủy',
                                style: TextStyle(color: Colors.grey),
                              ),
                            ),
                            TextButton(
                              onPressed: () => Navigator.of(ctx).pop(true),
                              child: const Text(
                                'Đăng xuất',
                                style: TextStyle(color: Colors.red),
                              ),
                            ),
                          ],
                        ),
                      );
                      if (confirmed != true) return;
                      await auth.logout();
                      if (context.mounted) {
                        Navigator.of(context).pushReplacementNamed('/login');
                      }
                    },
                    icon: const Icon(Icons.logout, size: 18),
                    label: const Text('Đăng xuất'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      side: BorderSide(
                        color: Colors.red.withValues(alpha: 0.3),
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _menuItem(
    BuildContext context,
    IconData icon,
    String label,
    String? route, {
    VoidCallback? onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap:
            onTap ??
            (route != null
                ? () => Navigator.of(context).pushNamed(route)
                : null),
        leading: Icon(
          icon,
          color: Colors.white.withValues(alpha: 0.7),
          size: 22,
        ),
        title: Text(
          label,
          style: const TextStyle(color: Colors.white, fontSize: 15),
        ),
        trailing: Icon(
          Icons.chevron_right,
          color: Colors.white.withValues(alpha: 0.3),
          size: 20,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        tileColor: const Color(0xFF141414),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      ),
    );
  }
}
