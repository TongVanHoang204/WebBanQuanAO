import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  bool _passwordVisible = false;

  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _text = Color(0xFF140E1B);

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _usernameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final result = await auth.register({
      'username': _usernameCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'password': _passwordCtrl.text,
      'full_name': _fullNameCtrl.text.trim(),
    });
    if (!mounted) return;
    if (result['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('\u0110\u0103ng k\u00fd th\u00e0nh c\u00f4ng!'),
          backgroundColor: Color(0xFF2E7D32),
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.of(context).pushReplacementNamed('/main');
    } else if (auth.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.error!),
          backgroundColor: Colors.red.shade400,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: _text, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 10),
              const Text(
                'T\u1ea1o t\u00e0i kho\u1ea3n',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: _text,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '\u0110\u0103ng k\u00fd \u0111\u1ec3 tr\u1ea3i nghi\u1ec7m mua s\u1eafm tuy\u1ec7t v\u1eddi',
                style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
              ),
              const SizedBox(height: 40),
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    _field(
                      controller: _fullNameCtrl,
                      hint: 'H\u1ecd v\u00e0 t\u00ean',
                      icon: Icons.badge_outlined,
                    ),
                    const SizedBox(height: 16),
                    _field(
                      controller: _usernameCtrl,
                      hint: 'T\u00ean \u0111\u0103ng nh\u1eadp',
                      icon: Icons.person_outline,
                      validator: (v) => v == null || v.isEmpty
                          ? 'Vui l\u00f2ng nh\u1eadp t\u00ean \u0111\u0103ng nh\u1eadp'
                          : null,
                    ),
                    const SizedBox(height: 16),
                    _field(
                      controller: _emailCtrl,
                      hint: 'Email',
                      icon: Icons.email_outlined,
                      keyboard: TextInputType.emailAddress,
                      validator: (v) {
                        if (v == null || v.isEmpty)
                          return 'Vui l\u00f2ng nh\u1eadp email';
                        if (!v.contains('@'))
                          return 'Email kh\u00f4ng h\u1ee3p l\u1ec7';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    _field(
                      controller: _passwordCtrl,
                      hint: 'M\u1eadt kh\u1ea9u',
                      icon: Icons.lock_outline,
                      obscure: !_passwordVisible,
                      suffix: IconButton(
                        icon: Icon(
                          _passwordVisible
                              ? Icons.visibility_off
                              : Icons.visibility,
                          color: Colors.grey.shade400,
                          size: 20,
                        ),
                        onPressed: () => setState(
                          () => _passwordVisible = !_passwordVisible,
                        ),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty)
                          return 'Vui l\u00f2ng nh\u1eadp m\u1eadt kh\u1ea9u';
                        if (v.length < 6)
                          return 'M\u1eadt kh\u1ea9u t\u1ed1i thi\u1ec3u 6 k\u00fd t\u1ef1';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    _field(
                      controller: _confirmPasswordCtrl,
                      hint: 'X\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u',
                      icon: Icons.lock_outline,
                      obscure: true,
                      validator: (v) => v != _passwordCtrl.text
                          ? 'M\u1eadt kh\u1ea9u kh\u00f4ng kh\u1edbp'
                          : null,
                    ),
                    const SizedBox(height: 32),
                    Consumer<AuthProvider>(
                      builder: (_, auth, __) => SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: auth.isLoading ? null : _register,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            elevation: 0,
                          ),
                          child: auth.isLoading
                              ? const SizedBox(
                                  height: 22,
                                  width: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text(
                                  '\u0110\u0103ng k\u00fd',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 1,
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '\u0110\u00e3 c\u00f3 t\u00e0i kho\u1ea3n? ',
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: const Text(
                      '\u0110\u0103ng nh\u1eadp',
                      style: TextStyle(
                        color: _primary,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool obscure = false,
    Widget? suffix,
    TextInputType? keyboard,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      validator: validator,
      keyboardType: keyboard,
      style: const TextStyle(color: _text, fontSize: 15),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 15),
        prefixIcon: Icon(icon, color: Colors.grey.shade400, size: 20),
        suffixIcon: suffix,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: _primary, width: 1),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
    );
  }
}
