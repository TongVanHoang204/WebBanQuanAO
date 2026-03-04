import 'package:flutter/material.dart';
import '../../services/auth_service.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});
  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _tokenCtrl = TextEditingController();
  final _pwCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _pwVisible = false, _loading = false;
  final AuthService _auth = AuthService();

  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _text = Color(0xFF140E1B);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final token = ModalRoute.of(context)?.settings.arguments as String?;
    if (token != null) _tokenCtrl.text = token;
  }

  @override
  void dispose() { _tokenCtrl.dispose(); _pwCtrl.dispose(); _confirmCtrl.dispose(); super.dispose(); }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final result = await _auth.resetPassword(_tokenCtrl.text.trim(), _pwCtrl.text);
    if (!mounted) return;
    setState(() => _loading = false);
    if (result['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.'),
        backgroundColor: Colors.green));
      Navigator.of(context).pushReplacementNamed('/login');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(result['message'] ?? 'Thất bại'), backgroundColor: Colors.red.shade400));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(backgroundColor: _bg, elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios, size: 20, color: _text), onPressed: () => Navigator.pop(context)),
        title: const Text('Đặt lại mật khẩu', style: TextStyle(color: _text, fontSize: 18, fontWeight: FontWeight.w800))),
      body: SingleChildScrollView(padding: const EdgeInsets.all(28), child: Form(key: _formKey, child: Column(children: [
        Container(width: 72, height: 72, margin: const EdgeInsets.only(bottom: 24),
          decoration: BoxDecoration(color: _primary.withValues(alpha: 0.1), shape: BoxShape.circle),
          child: const Icon(Icons.lock_reset, color: _primary, size: 36)),
        const Text('Đặt lại mật khẩu mới', style: TextStyle(color: _text, fontSize: 20, fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        Text('Nhập mã xác nhận từ email và mật khẩu mới', style: TextStyle(color: Colors.grey.shade500, fontSize: 14), textAlign: TextAlign.center),
        const SizedBox(height: 32),
        _fieldWidget(_tokenCtrl, 'Mã xác nhận từ email', Icons.vpn_key_outlined, validator: (v) => v == null || v.isEmpty ? 'Nhập mã xác nhận' : null),
        const SizedBox(height: 14),
        _fieldWidget(_pwCtrl, 'Mật khẩu mới', Icons.lock_outline, obscure: !_pwVisible,
          suffix: IconButton(icon: Icon(_pwVisible ? Icons.visibility_off : Icons.visibility, color: Colors.grey.shade400, size: 20), onPressed: () => setState(() => _pwVisible = !_pwVisible)),
          validator: (v) => v == null || v.length < 6 ? 'Mật khẩu ít nhất 6 ký tự' : null),
        const SizedBox(height: 14),
        _fieldWidget(_confirmCtrl, 'Xác nhận mật khẩu', Icons.lock_outline, obscure: !_pwVisible,
          validator: (v) => v != _pwCtrl.text ? 'Mật khẩu không khớp' : null),
        const SizedBox(height: 28),
        SizedBox(width: double.infinity, height: 52, child: ElevatedButton(onPressed: _loading ? null : _submit,
          style: ElevatedButton.styleFrom(backgroundColor: _primary, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
          child: _loading ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Text('Đặt lại mật khẩu', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)))),
      ]))),
    );
  }

  Widget _fieldWidget(TextEditingController ctrl, String hint, IconData icon, {bool obscure = false, Widget? suffix, String? Function(String?)? validator}) {
    return TextFormField(controller: ctrl, obscureText: obscure, validator: validator,
      style: const TextStyle(color: _text),
      decoration: InputDecoration(hintText: hint, prefixIcon: Icon(icon, color: Colors.grey.shade400, size: 20), suffixIcon: suffix,
        filled: true, fillColor: Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade200)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: _primary, width: 1.5)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16)));
  }
}
