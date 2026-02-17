import 'package:flutter/material.dart';

class PolicyScreen extends StatelessWidget {
  const PolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(
              Icons.arrow_back_ios,
              color: Colors.white,
              size: 20,
            ),
            onPressed: () => Navigator.of(context).pop(),
          ),
          title: const Text(
            'Chính sách',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          bottom: TabBar(
            indicatorColor: const Color(0xFFD4AF37),
            labelColor: const Color(0xFFD4AF37),
            unselectedLabelColor: Colors.white.withValues(alpha: 0.5),
            labelStyle: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
            tabs: const [
              Tab(text: 'Đổi trả'),
              Tab(text: 'Bảo mật'),
              Tab(text: 'Vận chuyển'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _ReturnPolicyTab(),
            _PrivacyPolicyTab(),
            _ShippingPolicyTab(),
          ],
        ),
      ),
    );
  }
}

class _ReturnPolicyTab extends StatelessWidget {
  const _ReturnPolicyTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _policySection('Chính sách đổi trả', [
            _policyItem(
              Icons.timer_outlined,
              '30 ngày đổi trả',
              'Đổi trả miễn phí trong 30 ngày kể từ ngày nhận hàng',
            ),
            _policyItem(
              Icons.check_circle_outline,
              'Điều kiện đổi trả',
              '• Sản phẩm còn nguyên tem, nhãn mác\n'
                  '• Chưa qua sử dụng, giặt ủi\n'
                  '• Còn hóa đơn mua hàng\n'
                  '• Sản phẩm không thuộc danh mục không đổi trả',
            ),
            _policyItem(
              Icons.do_not_disturb_outlined,
              'Không áp dụng đổi trả',
              '• Đồ lót, đồ bơi\n'
                  '• Phụ kiện (tất, khăn, mũ)\n'
                  '• Sản phẩm đã sử dụng hoặc hư hỏng do người dùng',
            ),
            _policyItem(
              Icons.loop_outlined,
              'Quy trình đổi trả',
              '1. Liên hệ hotline hoặc chat hỗ trợ\n'
                  '2. Cung cấp mã đơn hàng và lý do\n'
                  '3. Gửi hàng về kho\n'
                  '4. Hoàn tiền/đổi hàng trong 3-5 ngày',
            ),
          ]),
        ],
      ),
    );
  }
}

class _PrivacyPolicyTab extends StatelessWidget {
  const _PrivacyPolicyTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _policySection('Chính sách bảo mật', [
            _policyItem(
              Icons.shield_outlined,
              'Thu thập thông tin',
              'Chúng tôi chỉ thu thập các thông tin cần thiết để xử lý đơn hàng '
                  'bao gồm: họ tên, email, số điện thoại, địa chỉ giao hàng.',
            ),
            _policyItem(
              Icons.lock_outlined,
              'Bảo vệ dữ liệu',
              '• Mã hóa SSL cho tất cả giao dịch\n'
                  '• Không chia sẻ thông tin cho bên thứ ba\n'
                  '• Lưu trữ an toàn trên hệ thống bảo mật\n'
                  '• Hỗ trợ xác thực hai bước (2FA)',
            ),
            _policyItem(
              Icons.cookie_outlined,
              'Cookie',
              'Sử dụng cookie để cải thiện trải nghiệm mua sắm. '
                  'Bạn có thể tắt cookie trong cài đặt trình duyệt.',
            ),
            _policyItem(
              Icons.delete_outline,
              'Quyền của bạn',
              '• Yêu cầu xem, sửa, xóa thông tin cá nhân\n'
                  '• Hủy đăng ký nhận tin\n'
                  '• Khiếu nại về việc xử lý dữ liệu',
            ),
          ]),
        ],
      ),
    );
  }
}

class _ShippingPolicyTab extends StatelessWidget {
  const _ShippingPolicyTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _policySection('Chính sách vận chuyển', [
            _policyItem(
              Icons.local_shipping_outlined,
              'Thời gian giao hàng',
              '• Nội thành: 1-2 ngày\n'
                  '• Ngoại thành: 2-3 ngày\n'
                  '• Tỉnh/thành khác: 3-5 ngày\n'
                  '• Vùng sâu vùng xa: 5-7 ngày',
            ),
            _policyItem(
              Icons.monetization_on_outlined,
              'Phí vận chuyển',
              '• Miễn phí cho đơn từ 500.000đ\n'
                  '• Nội thành: 30.000đ\n'
                  '• Ngoại thành: 40.000đ\n'
                  '• Tỉnh khác: 50.000đ',
            ),
            _policyItem(
              Icons.track_changes_outlined,
              'Theo dõi đơn hàng',
              'Bạn có thể theo dõi trạng thái đơn hàng trong mục "Đơn hàng của tôi". '
                  'Hệ thống sẽ gửi thông báo khi có cập nhật.',
            ),
            _policyItem(
              Icons.warning_amber_outlined,
              'Lưu ý',
              '• Kiểm tra hàng trước khi nhận\n'
                  '• Từ chối nhận nếu bao bì bị rách, hỏng\n'
                  '• Liên hệ ngay nếu hàng giao bị lỗi',
            ),
          ]),
        ],
      ),
    );
  }
}

// Shared helper widgets
Widget _policySection(String title, List<Widget> items) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        title,
        style: const TextStyle(
          color: Color(0xFFD4AF37),
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      const SizedBox(height: 16),
      ...items,
    ],
  );
}

Widget _policyItem(IconData icon, String title, String content) {
  return Container(
    margin: const EdgeInsets.only(bottom: 14),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: const Color(0xFF141414),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: const Color(0xFFD4AF37), size: 20),
            const SizedBox(width: 10),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Text(
          content,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.6),
            fontSize: 13,
            height: 1.6,
          ),
        ),
      ],
    ),
  );
}
