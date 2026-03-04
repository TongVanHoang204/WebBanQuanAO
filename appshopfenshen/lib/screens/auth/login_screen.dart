import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/wishlist_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _passwordVisible = false;

  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _text = Color(0xFF140E1B);

  @override
  void dispose() { _usernameCtrl.dispose(); _passwordCtrl.dispose(); super.dispose(); }

  Future<void> _afterLogin(BuildContext ctx) async {
    final auth = Provider.of<AuthProvider>(ctx, listen: false);
    if (auth.isLoggedIn) {
      Provider.of<CartProvider>(ctx, listen: false).loadCart();
      Provider.of<WishlistProvider>(ctx, listen: false).loadWishlist();
    }
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final result = await auth.login(_usernameCtrl.text.trim(), _passwordCtrl.text);
    if (!mounted) return;
    if (result['success'] == true) {
      await _afterLogin(context);
      Navigator.of(context).pushReplacementNamed('/main');
    } else if (result['require_2fa'] == true) {
      Navigator.of(context).pushNamed('/otp-verify', arguments: {'email': result['email'] ?? ''});
    } else if (auth.error != null && auth.error != '2FA_REQUIRED') {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.error!),
        backgroundColor: Colors.red.shade400, behavior: SnackBarBehavior.floating));
    }
  }

  Future<void> _loginWithGoogle() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final result = await auth.loginWithGoogle();
    if (!mounted) return;
    if (result['success'] == true) {
      await _afterLogin(context);
      Navigator.of(context).pushReplacementNamed('/main');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(result['message'] ?? 'Đăng nhập Google thất bại'),
        backgroundColor: Colors.red.shade400, behavior: SnackBarBehavior.floating));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(children: [
          const SizedBox(height: 48),
          // Logo
          Container(width: 80, height: 80,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [_primary, Color(0xFFAB5CFF)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(22),
              boxShadow: [BoxShadow(color: _primary.withValues(alpha: 0.35), blurRadius: 24, offset: const Offset(0, 8))]),
            child: const Center(child: Text('SF', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white)))),
          const SizedBox(height: 24),
          const Text('Chào mừng trở lại', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: _text)),
          const SizedBox(height: 8),
          Text('Đăng nhập để tiếp tục mua sắm', style: TextStyle(fontSize: 14, color: Colors.grey.shade500)),
          const SizedBox(height: 40),
          Form(key: _formKey, child: Column(children: [
            _field(ctrl: _usernameCtrl, hint: 'Tên đăng nhập / Email', icon: Icons.person_outline,
              validator: (v) => v == null || v.isEmpty ? 'Vui lòng nhập tên đăng nhập' : null),
            const SizedBox(height: 14),
            _field(ctrl: _passwordCtrl, hint: 'Mật khẩu', icon: Icons.lock_outline, obscure: !_passwordVisible,
              suffix: IconButton(icon: Icon(_passwordVisible ? Icons.visibility_off : Icons.visibility, color: Colors.grey.shade400, size: 20),
                onPressed: () => setState(() => _passwordVisible = !_passwordVisible)),
              validator: (v) => v == null || v.isEmpty ? 'Vui lòng nhập mật khẩu' : null),
            const SizedBox(height: 10),
            Align(alignment: Alignment.centerRight,
              child: TextButton(onPressed: () => Navigator.of(context).pushNamed('/forgot-password'),
                child: const Text('Quên mật khẩu?', style: TextStyle(color: _primary, fontSize: 13, fontWeight: FontWeight.w600)))),
            const SizedBox(height: 20),
            Consumer<AuthProvider>(builder: (_, auth, __) => SizedBox(width: double.infinity, height: 52,
              child: ElevatedButton(
                onPressed: auth.isLoading ? null : _login,
                style: ElevatedButton.styleFrom(backgroundColor: _primary, foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), elevation: 0),
                child: auth.isLoading
                  ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Đăng nhập', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700))))),
          ])),
          const SizedBox(height: 28),
          Row(children: [
            Expanded(child: Divider(color: Colors.grey.shade200)),
            Padding(padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text('hoặc', style: TextStyle(color: Colors.grey.shade400, fontSize: 13))),
            Expanded(child: Divider(color: Colors.grey.shade200)),
          ]),
          const SizedBox(height: 20),
          // Google Sign-In button
          Consumer<AuthProvider>(builder: (_, auth, __) =>
            SizedBox(width: double.infinity, height: 52, child: OutlinedButton(
              onPressed: auth.isLoading ? null : _loginWithGoogle,
              style: OutlinedButton.styleFrom(side: BorderSide(color: Colors.grey.shade300),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                backgroundColor: Colors.white),
              child: auth.isLoading
                ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF7F19E6)))
                : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    // Google G logo
                    SizedBox(width: 22, height: 22, child: Stack(alignment: Alignment.center, children: [
                      Container(decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.white),
                        child: const Text('G', style: TextStyle(color: Color(0xFF4285F4), fontWeight: FontWeight.w900, fontSize: 16))),
                    ])),
                    const SizedBox(width: 12),
                    Text('Tiếp tục với Google', style: TextStyle(color: Colors.grey.shade700, fontSize: 15, fontWeight: FontWeight.w600)),
                  ])))),
          const SizedBox(height: 12),
          // Guest mode
          SizedBox(width: double.infinity, height: 48, child: OutlinedButton(
            onPressed: () => Navigator.of(context).pushReplacementNamed('/main'),
            style: OutlinedButton.styleFrom(side: BorderSide(color: Colors.grey.shade200),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
            child: Text('Tiếp tục không đăng nhập', style: TextStyle(color: Colors.grey.shade600, fontSize: 14)))),
          const SizedBox(height: 24),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text('Chưa có tài khoản? ', style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
            GestureDetector(onTap: () => Navigator.of(context).pushNamed('/register'),
              child: const Text('Đăng ký ngay', style: TextStyle(color: _primary, fontWeight: FontWeight.w700, fontSize: 14))),
          ]),
          const SizedBox(height: 40),
        ]),
      )),
    );
  }

  Widget _field({required TextEditingController ctrl, required String hint, required IconData icon,
    bool obscure = false, Widget? suffix, String? Function(String?)? validator}) {
    return TextFormField(controller: ctrl, obscureText: obscure, validator: validator,
      style: const TextStyle(color: _text, fontSize: 15),
      decoration: InputDecoration(hintText: hint, hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 15),
        prefixIcon: Icon(icon, color: Colors.grey.shade400, size: 20), suffixIcon: suffix,
        filled: true, fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade200)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: _primary, width: 1.5)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Colors.redAccent, width: 1)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16)));
  }
}
