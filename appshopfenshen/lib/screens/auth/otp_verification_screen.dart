import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({super.key});
  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final List<TextEditingController> _otpCtrls = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _isLoading = false;
  String? _email;
  int _resendCountdown = 60;
  bool _canResend = false;

  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _text = Color(0xFF140E1B);

  @override
  void initState() { super.initState(); _startResendTimer(); }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    _email = args?['email'];
  }

  void _startResendTimer() {
    _canResend = false; _resendCountdown = 60;
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      setState(() { _resendCountdown--; if (_resendCountdown <= 0) _canResend = true; });
      return _resendCountdown > 0 && mounted;
    });
  }

  String get _otp => _otpCtrls.map((c) => c.text).join();

  Future<void> _verifyOtp() async {
    if (_otp.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui l\u00f2ng nh\u1eadp \u0111\u1ee7 6 s\u1ed1 OTP'),
        backgroundColor: Colors.red, behavior: SnackBarBehavior.floating)); return; }
    if (_email == null || _email!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Thi\u1ebfu th\u00f4ng tin email'),
        backgroundColor: Colors.red, behavior: SnackBarBehavior.floating)); return; }
    setState(() => _isLoading = true);
    try {
      final res = await AuthService().verify2FA(_otp, _email!);
      if (!mounted) return;
      if (res['success'] == true) {
        final token = res['token'] ?? res['data']?['token'];
        if (token != null) {
          await ApiService().setToken(token);
          final auth = Provider.of<AuthProvider>(context, listen: false);
          await auth.refreshUser();
          if (mounted) Navigator.of(context).pushNamedAndRemoveUntil('/main', (route) => false);
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'M\u00e3 OTP kh\u00f4ng \u0111\u00fang'),
          backgroundColor: Colors.red.shade400, behavior: SnackBarBehavior.floating));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('L\u1ed7i x\u00e1c th\u1ef1c. Vui l\u00f2ng th\u1eed l\u1ea1i.'),
        backgroundColor: Colors.red, behavior: SnackBarBehavior.floating));
    } finally { if (mounted) setState(() => _isLoading = false); }
  }

  Future<void> _resendOtp() async {
    if (!_canResend || _email == null) return;
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('\u0110\u00e3 g\u1eedi l\u1ea1i m\u00e3 OTP'),
      backgroundColor: Color(0xFF2E7D32), behavior: SnackBarBehavior.floating));
    _startResendTimer();
  }

  @override
  void dispose() { for (final c in _otpCtrls) c.dispose(); for (final f in _focusNodes) f.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(backgroundColor: _bg, elevation: 0, scrolledUnderElevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios, color: _text, size: 20), onPressed: () => Navigator.of(context).pop())),
      body: SafeArea(child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(children: [
          const SizedBox(height: 40),
          Container(width: 80, height: 80, decoration: BoxDecoration(color: _primary.withValues(alpha: 0.1), shape: BoxShape.circle),
            child: const Icon(Icons.security_outlined, color: _primary, size: 40)),
          const SizedBox(height: 24),
          const Text('X\u00e1c th\u1ef1c hai b\u01b0\u1edbc', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: _text)),
          const SizedBox(height: 12),
          Text('Nh\u1eadp m\u00e3 6 s\u1ed1 \u0111\u00e3 g\u1eedi \u0111\u1ebfn email\n${_email ?? ''}',
            textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Colors.grey.shade500, height: 1.5)),
          const SizedBox(height: 40),
          Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: List.generate(6, (i) => SizedBox(
            width: 46, height: 56, child: TextFormField(
              controller: _otpCtrls[i], focusNode: _focusNodes[i], keyboardType: TextInputType.number,
              textAlign: TextAlign.center, maxLength: 1,
              style: const TextStyle(color: _text, fontSize: 22, fontWeight: FontWeight.bold),
              decoration: InputDecoration(counterText: '', filled: true, fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _primary, width: 1.5)),
                contentPadding: const EdgeInsets.symmetric(vertical: 14)),
              onChanged: (v) { if (v.isNotEmpty && i < 5) _focusNodes[i+1].requestFocus();
                if (v.isEmpty && i > 0) _focusNodes[i-1].requestFocus();
                if (_otp.length == 6) _verifyOtp(); })))),
          const SizedBox(height: 32),
          SizedBox(width: double.infinity, height: 52, child: ElevatedButton(
            onPressed: _isLoading ? null : _verifyOtp,
            style: ElevatedButton.styleFrom(backgroundColor: _primary, foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), elevation: 0),
            child: _isLoading
              ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('X\u00e1c th\u1ef1c', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)))),
          const SizedBox(height: 24),
          TextButton(onPressed: _canResend ? _resendOtp : null,
            child: Text(_canResend ? 'G\u1eedi l\u1ea1i m\u00e3 OTP' : 'G\u1eedi l\u1ea1i sau ${_resendCountdown}s',
              style: TextStyle(color: _canResend ? _primary : Colors.grey.shade400, fontSize: 14))),
        ]),
      )),
    );
  }
}
