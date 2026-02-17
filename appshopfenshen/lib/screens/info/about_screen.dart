import 'package:flutter/material.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Về ShopFeshen',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Logo & brand
            Center(
              child: Column(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFD4AF37), Color(0xFFF5E6A8)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Center(
                      child: Text(
                        'SF',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          color: Colors.black,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Shop Feshen',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Thời trang đẳng cấp',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.5),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 36),

            _sectionTitle('Về chúng tôi'),
            const SizedBox(height: 12),
            _paragraph(
              'ShopFeshen là thương hiệu thời trang cao cấp hàng đầu Việt Nam, '
              'mang đến những sản phẩm chất lượng với thiết kế hiện đại, phù hợp '
              'với xu hướng thời trang quốc tế.',
            ),
            const SizedBox(height: 16),
            _paragraph(
              'Chúng tôi cam kết mang đến trải nghiệm mua sắm tuyệt vời nhất cho '
              'khách hàng thông qua sản phẩm chất lượng, dịch vụ chuyên nghiệp '
              'và giá cả hợp lý.',
            ),
            const SizedBox(height: 28),

            _sectionTitle('Tầm nhìn'),
            const SizedBox(height: 12),
            _infoCard(
              Icons.visibility_outlined,
              'Tầm nhìn',
              'Trở thành thương hiệu thời trang hàng đầu Đông Nam Á, được yêu thích bởi hàng triệu người.',
            ),
            const SizedBox(height: 12),
            _infoCard(
              Icons.rocket_launch_outlined,
              'Sứ mệnh',
              'Mang đến thời trang đẹp, chất lượng với giá cả phải chăng cho tất cả mọi người.',
            ),
            const SizedBox(height: 12),
            _infoCard(
              Icons.diamond_outlined,
              'Giá trị cốt lõi',
              'Chất lượng - Sáng tạo - Tận tâm - Bền vững',
            ),

            const SizedBox(height: 28),

            _sectionTitle('Con số ấn tượng'),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _statCard('10K+', 'Khách hàng')),
                const SizedBox(width: 12),
                Expanded(child: _statCard('5K+', 'Sản phẩm')),
                const SizedBox(width: 12),
                Expanded(child: _statCard('98%', 'Hài lòng')),
              ],
            ),

            const SizedBox(height: 32),
            Center(
              child: Text(
                'Phiên bản 1.0.0',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.3),
                  fontSize: 12,
                ),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: Color(0xFFD4AF37),
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _paragraph(String text) {
    return Text(
      text,
      style: TextStyle(
        color: Colors.white.withValues(alpha: 0.7),
        fontSize: 14,
        height: 1.6,
      ),
    );
  }

  Widget _infoCard(IconData icon, String title, String desc) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFD4AF37).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: const Color(0xFFD4AF37), size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statCard(String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20),
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFD4AF37).withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Color(0xFFD4AF37),
              fontSize: 22,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.5),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
