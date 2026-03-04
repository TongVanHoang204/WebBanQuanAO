import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../config/api_config.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  bool _isLoading = false;
  bool _emailSent = false;

  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _text = Color(0xFF140E1B);

  @override
  void dispose() { _emailCtrl.dispose(); super.dispose(); }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      final res = await ApiService().post(ApiConfig.forgotPassword, data: {'email': _emailCtrl.text.trim()});
      if (!mounted) return;
      if (res.data['success'] == true) { setState(() => _emailSent = true); }
      else { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.data['message'] ?? 'Kh\u00f4ng th\u1ec3 g\u1eedi email'),
        backgroundColor: Colors.red.shade400, behavior: SnackBarBehavior.floating)); }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('L\u1ed7i k\u1ebft n\u1ed1i. Vui l\u00f2ng th\u1eed l\u1ea1i.'),
        backgroundColor: Colors.red, behavior: SnackBarBehavior.floating));
    } finally { if (mounted) setState(() => _isLoading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(backgroundColor: _bg, elevation: 0, scrolledUnderElevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios, color: _text, size: 20), onPressed: () => Navigator.of(context).pop())),
      body: SafeArea(child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: _emailSent ? _successView() : _formView())),
    );
  }

  Widget _successView() {
    return Column(children: [
      const SizedBox(height: 60),
      Container(width: 80, height: 80, decoration: BoxDecoration(color: Colors.green.shade50, shape: BoxShape.circle),
        child: Icon(Icons.mark_email_read_outlined, color: Colors.green.shade600, size: 40)),
      const SizedBox(height: 24),
      const Text('Ki\u1ec3m tra email', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: _text)),
      const SizedBox(height: 12),
      Text('Ch\u00fang t\u00f4i \u0111\u00e3 g\u1eedi h\u01b0\u1edbng d\u1eabn \u0111\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u \u0111\u1ebfn ${_emailCtrl.text.trim()}',
        textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Colors.grey.shade500, height: 1.5)),
      const SizedBox(height: 40),
      SizedBox(width: double.infinity, height: 52, child: ElevatedButton(
        onPressed: () => Navigator.of(context).pop(),
        style: ElevatedButton.styleFrom(backgroundColor: _primary, foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), elevation: 0),
        child: const Text('Quay l\u1ea1i \u0111\u0103ng nh\u1eadp', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)))),
      const SizedBox(height: 16),
      TextButton(onPressed: () => setState(() => _emailSent = false),
        child: Text('G\u1eedi l\u1ea1i email', style: TextStyle(color: Colors.grey.shade500, fontSize: 14))),
    ]);
  }

  Widget _formView() {
    return Form(key: _formKey, child: Column(children: [
      const SizedBox(height: 60),
      Container(width: 80, height: 80, decoration: BoxDecoration(color: _primary.withValues(alpha: 0.1), shape: BoxShape.circle),
        child: const Icon(Icons.lock_reset_outlined, color: _primary, size: 40)),
      const SizedBox(height: 24),
      const Text('Qu\u00ean m\u1eadt kh\u1ea9u?', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: _text)),
      const SizedBox(height: 12),
      Text('Nh\u1eadp email \u0111\u0103ng k\u00fd, ch\u00fang t\u00f4i s\u1ebd g\u1eedi h\u01b0\u1edbng d\u1eabn \u0111\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u',
        textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Colors.grey.shade500, height: 1.5)),
      const SizedBox(height: 40),
      TextFormField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress,
        style: const TextStyle(color: _text, fontSize: 15),
        validator: (v) { if (v == null || v.isEmpty) return 'Vui l\u00f2ng nh\u1eadp email';
          if (!RegExp(r'^[\w\-\.]+@([\w\-]+\.)+[\w\-]{2,4}$').hasMatch(v)) return 'Email kh\u00f4ng h\u1ee3p l\u1ec7'; return null; },
        decoration: InputDecoration(hintText: 'Email', hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 15),
          prefixIcon: Icon(Icons.email_outlined, color: Colors.grey.shade400, size: 20),
          filled: true, fillColor: Colors.white,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade200)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: _primary, width: 1)),
          errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Colors.redAccent, width: 1)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16))),
      const SizedBox(height: 24),
      SizedBox(width: double.infinity, height: 52, child: ElevatedButton(
        onPressed: _isLoading ? null : _submit,
        style: ElevatedButton.styleFrom(backgroundColor: _primary, foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), elevation: 0),
        child: _isLoading
          ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Text('G\u1eedi email \u0111\u1eb7t l\u1ea1i', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)))),
      const SizedBox(height: 24),
      TextButton(onPressed: () => Navigator.of(context).pop(),
        child: const Text('Quay l\u1ea1i \u0111\u0103ng nh\u1eadp', style: TextStyle(color: _primary, fontSize: 14))),
    ]));
  }
}
