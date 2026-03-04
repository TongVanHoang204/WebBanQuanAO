import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notifOrder = true;
  bool _notifPromo = true;
  bool _notifSystem = false;

  static const _primary = Color(0xFF7F19E6);
  static const _bg = Color(0xFFF7F6F8);
  static const _surface = Color(0xFFFFFFFF);
  static const _text = Color(0xFF140E1B);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(backgroundColor: _bg, elevation: 0, scrolledUnderElevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios, size: 20, color: _text), onPressed: () => Navigator.pop(context)),
        title: const Text('Cài đặt', style: TextStyle(color: _text, fontSize: 18, fontWeight: FontWeight.w800))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        // Thông báo
        _header('Thông báo'),
        _card(children: [
          _switchTile('Đơn hàng', 'Cập nhật trạng thái đơn hàng', Icons.receipt_long_outlined, _notifOrder, (v) => setState(() => _notifOrder = v)),
          Divider(height: 1, color: Colors.grey.shade100),
          _switchTile('Khuyến mãi', 'Flash sale và voucher', Icons.local_offer_outlined, _notifPromo, (v) => setState(() => _notifPromo = v)),
          Divider(height: 1, color: Colors.grey.shade100),
          _switchTile('Hệ thống', 'Thông báo từ admin', Icons.info_outlined, _notifSystem, (v) => setState(() => _notifSystem = v)),
        ]),
        const SizedBox(height: 16),

        // Tài khoản
        _header('Tài khoản'),
        _card(children: [
          _navTile(context, 'Chỉnh sửa hồ sơ', Icons.person_outline, '/edit-profile', _primary),
          Divider(height: 1, color: Colors.grey.shade100),
          _navTile(context, 'Đổi mật khẩu', Icons.lock_outline, '/change-password', Colors.blue),
          Divider(height: 1, color: Colors.grey.shade100),
          _navTile(context, 'Địa chỉ giao hàng', Icons.location_on_outlined, '/addresses', Colors.red),
          Divider(height: 1, color: Colors.grey.shade100),
          _navTile(context, 'Phương thức thanh toán', Icons.payment_outlined, null, Colors.green, soon: true),
        ]),
        const SizedBox(height: 16),

        // Ứng dụng
        _header('Về ứng dụng'),
        _card(children: [
          _navTile(context, 'Về chúng tôi', Icons.info_outline, '/about', Colors.indigo),
          Divider(height: 1, color: Colors.grey.shade100),
          _navTile(context, 'Chính sách & Điều khoản', Icons.policy_outlined, '/policy', Colors.orange),
          Divider(height: 1, color: Colors.grey.shade100),
          _navTile(context, 'Liên hệ & Hỗ trợ', Icons.phone_outlined, '/contact', Colors.teal),
          Divider(height: 1, color: Colors.grey.shade100),
          ListTile(leading: Container(width: 38, height: 38, decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(10)), child: const Icon(Icons.info_outline, size: 20, color: Colors.grey)),
            title: const Text('Phiên bản', style: TextStyle(color: _text, fontSize: 14, fontWeight: FontWeight.w600)),
            trailing: Text('v2.1.0', style: TextStyle(color: Colors.grey.shade400, fontSize: 13)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2)),
        ]),
        const SizedBox(height: 24),

        // Logout
        Consumer<AuthProvider>(builder: (_, auth, __) => auth.isLoggedIn
          ? SizedBox(width: double.infinity, height: 52, child: OutlinedButton.icon(
              icon: const Icon(Icons.logout, size: 20),
              label: const Text('Đăng xuất', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              onPressed: () async {
                final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  title: const Text('Đăng xuất?'),
                  content: const Text('Bạn có chắc muốn đăng xuất?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Hủy', style: TextStyle(color: Colors.grey.shade500))),
                    TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Đăng xuất', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700))),
                  ]));
                if (ok == true && context.mounted) {
                  await auth.logout();
                  if (context.mounted) Navigator.of(context).pushReplacementNamed('/login');
                }
              },
              style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: BorderSide(color: Colors.red.shade200),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
            ))
          : const SizedBox()),
        const SizedBox(height: 40),
      ]),
    );
  }

  Widget _header(String title) => Padding(
    padding: const EdgeInsets.only(bottom: 8, left: 4),
    child: Text(title, style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1)));

  Widget _card({required List<Widget> children}) => Container(
    decoration: BoxDecoration(color: _surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade100)),
    child: Column(children: children));

  Widget _switchTile(String title, String subtitle, IconData icon, bool value, ValueChanged<bool> onChanged) {
    return ListTile(
      leading: Container(width: 38, height: 38, decoration: BoxDecoration(color: _primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(10)), child: Icon(icon, size: 20, color: _primary)),
      title: Text(title, style: const TextStyle(color: _text, fontSize: 14, fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle, style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
      trailing: Switch(value: value, onChanged: onChanged, activeColor: _primary),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2));
  }

  Widget _navTile(BuildContext context, String title, IconData icon, String? route, Color iconColor, {bool soon = false}) {
    return ListTile(
      onTap: route != null ? () => Navigator.of(context).pushNamed(route) : () => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$title — Sắp ra mắt!'), behavior: SnackBarBehavior.floating, backgroundColor: _primary)),
      leading: Container(width: 38, height: 38, decoration: BoxDecoration(color: iconColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)), child: Icon(icon, size: 20, color: iconColor)),
      title: Text(title, style: const TextStyle(color: _text, fontSize: 14, fontWeight: FontWeight.w600)),
      trailing: soon
        ? Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: Colors.orange.shade50, borderRadius: BorderRadius.circular(4)), child: const Text('Sắp ra mắt', style: TextStyle(color: Colors.orange, fontSize: 10, fontWeight: FontWeight.w600)))
        : Icon(Icons.chevron_right, color: Colors.grey.shade400, size: 20),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2));
  }
}
