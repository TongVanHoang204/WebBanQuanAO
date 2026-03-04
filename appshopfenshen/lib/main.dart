import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'services/api_service.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/wishlist_provider.dart';

import 'screens/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/auth/otp_verification_screen.dart';
import 'screens/product/product_list_screen.dart';
import 'screens/product/product_detail_screen.dart';
import 'screens/product/search_screen.dart';
import 'screens/product/reviews_screen.dart';
import 'screens/cart/cart_screen.dart';
import 'screens/checkout/checkout_screen.dart';
import 'screens/checkout/order_success_screen.dart';
import 'screens/order/order_list_screen.dart';
import 'screens/order/order_detail_screen.dart';
import 'screens/profile/edit_profile_screen.dart';
import 'screens/profile/change_password_screen.dart';
import 'screens/profile/address_list_screen.dart';
import 'screens/shop/shop_screen.dart';
import 'screens/shop/sale_screen.dart';
import 'screens/info/about_screen.dart';
import 'screens/info/contact_screen.dart';
import 'screens/info/policy_screen.dart';
import 'screens/notification/notification_screen.dart';
import 'screens/chat/ai_chat_screen.dart';
import 'screens/chat/support_chat_screen.dart';
import 'screens/wishlist/wishlist_screen.dart';
import 'screens/auth/reset_password_screen.dart';
import 'screens/shop/vouchers_screen.dart';
import 'screens/profile/settings_screen.dart';
import 'widgets/main_navigation.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock to portrait
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  // Light status bar
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Initialize API service
  await ApiService().init();

  runApp(const ShopFeshenApp());
}

class ShopFeshenApp extends StatelessWidget {
  const ShopFeshenApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => WishlistProvider()),
      ],
      child: MaterialApp(
        title: 'Shop Feshen',
        debugShowCheckedModeBanner: false,
        theme: _buildTheme(),
        initialRoute: '/',
        routes: {
          '/': (_) => const SplashScreen(),
          '/login': (_) => const LoginScreen(),
          '/register': (_) => const RegisterScreen(),
          '/forgot-password': (_) => const ForgotPasswordScreen(),
          '/otp-verify': (_) => const OtpVerificationScreen(),
          '/main': (_) => const MainNavigation(),
          '/products': (_) => const ProductListScreen(),
          '/product-detail': (_) => const ProductDetailScreen(),
          '/search': (_) => const SearchScreen(),
          '/reviews': (_) => const ReviewsScreen(),
          '/cart': (_) => const CartScreen(),
          '/checkout': (_) => const CheckoutScreen(),
          '/order-success': (_) => const OrderSuccessScreen(),
          '/orders': (_) => const OrderListScreen(),
          '/order-detail': (_) => const OrderDetailScreen(),
          '/edit-profile': (_) => const EditProfileScreen(),
          '/change-password': (_) => const ChangePasswordScreen(),
          '/addresses': (_) => const AddressListScreen(),
          '/shop': (_) => const ShopScreen(),
          '/sale': (_) => const SaleScreen(),
          '/about': (_) => const AboutScreen(),
          '/contact': (_) => const ContactScreen(),
          '/policy': (_) => const PolicyScreen(),
          '/notifications': (_) => const NotificationScreen(),
          '/ai-chat': (_) => const AIChatScreen(),
          '/support-chat': (_) => const SupportChatScreen(),
          '/wishlist-screen': (_) => const WishlistScreen(),
          '/reset-password': (_) => const ResetPasswordScreen(),
          '/vouchers': (_) => const VouchersScreen(),
          '/settings': (_) => const SettingsScreen(),
        },
      ),
    );
  }

  ThemeData _buildTheme() {
    const primary = Color(0xFF7F19E6);
    const bgLight = Color(0xFFF7F6F8);
    const surfaceLight = Color(0xFFFFFFFF);
    const textDark = Color(0xFF140E1B);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: bgLight,
      primaryColor: primary,
      fontFamily: 'Manrope',
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: Color(0xFFE8D5FF),
        surface: surfaceLight,
        onPrimary: Colors.white,
        onSecondary: textDark,
        onSurface: textDark,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bgLight,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: IconThemeData(color: textDark),
        titleTextStyle: TextStyle(
          color: textDark,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          fontFamily: 'Manrope',
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 0,
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            fontFamily: 'Manrope',
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
      cardTheme: CardThemeData(
        color: surfaceLight,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 0,
      ),
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: textDark,
        contentTextStyle: TextStyle(color: Colors.white),
      ),
    );
  }
}
