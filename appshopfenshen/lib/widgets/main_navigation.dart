import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../providers/wishlist_provider.dart';
import '../providers/auth_provider.dart';
import '../screens/home/home_screen.dart';
import '../screens/product/search_screen.dart';
import '../screens/cart/cart_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/wishlist/wishlist_screen.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});
  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _idx = 0;
  static const _primary = Color(0xFF7F19E6);

  final _screens = const [
    HomeScreen(), 
    SearchScreen(), 
    WishlistScreen(), 
    CartScreen(), 
    ProfileScreen()
  ];

  @override
  void initState() {
    super.initState();
    // Pre-load cart and wishlist if logged in
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.isLoggedIn) {
        Provider.of<CartProvider>(context, listen: false).loadCart();
        Provider.of<WishlistProvider>(context, listen: false).loadWishlist();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _idx, children: _screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.grey.shade100)),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 20, offset: const Offset(0, -4))],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              _navItem(0, Icons.home_outlined, Icons.home_rounded, 'Trang chủ'),
              _navItem(1, Icons.search, Icons.search, 'Tìm kiếm'),
              _navItem(2, Icons.favorite_border, Icons.favorite, 'Yêu thích'),
              _cartNavItem(),
              _navItem(4, Icons.person_outline, Icons.person, 'Tài khoản'),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _navItem(int idx, IconData icon, IconData activeIcon, String label) {
    final sel = _idx == idx;
    return GestureDetector(
      onTap: () => setState(() => _idx = idx),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 72,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(sel ? activeIcon : icon, size: 26, color: sel ? _primary : Colors.grey.shade400),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 10, fontWeight: sel ? FontWeight.w700 : FontWeight.w500,
            color: sel ? _primary : Colors.grey.shade400)),
          const SizedBox(height: 2),
          AnimatedContainer(duration: const Duration(milliseconds: 200),
            width: sel ? 20 : 0, height: 3,
            decoration: BoxDecoration(color: _primary, borderRadius: BorderRadius.circular(2))),
        ]),
      ),
    );
  }

  Widget _cartNavItem() {
    final sel = _idx == 3;
    return GestureDetector(
      onTap: () => setState(() => _idx = 3),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 72,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Stack(clipBehavior: Clip.none, children: [
            Icon(sel ? Icons.shopping_cart_rounded : Icons.shopping_cart_outlined, size: 26, color: sel ? _primary : Colors.grey.shade400),
            Consumer<CartProvider>(builder: (_, cart, __) {
              if (cart.itemCount == 0) return const SizedBox();
              return Positioned(top: -6, right: -8, child: Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(color: _primary, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 1.5)),
                child: Text('${cart.itemCount > 9 ? '9+' : cart.itemCount}',
                  style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w800))));
            }),
          ]),
          const SizedBox(height: 4),
          Text('Giỏ hàng', style: TextStyle(fontSize: 10, fontWeight: sel ? FontWeight.w700 : FontWeight.w500,
            color: sel ? _primary : Colors.grey.shade400)),
          const SizedBox(height: 2),
          AnimatedContainer(duration: const Duration(milliseconds: 200),
            width: sel ? 20 : 0, height: 3,
            decoration: BoxDecoration(color: _primary, borderRadius: BorderRadius.circular(2))),
        ]),
      ),
    );
  }
}
