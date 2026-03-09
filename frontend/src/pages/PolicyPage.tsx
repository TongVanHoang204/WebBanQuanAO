import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, ShieldCheck, RefreshCw, Truck, Lock } from 'lucide-react';

const policies = [
  {
    id: 'returns',
    title: 'Chính sách đổi trả',
    icon: <RefreshCw className="w-6 h-6" />,
    content: (
      <div className="space-y-4 text-secondary-600 dark:text-secondary-400 leading-relaxed">
        <p>Chúng tôi hỗ trợ đổi trả sản phẩm trong vòng <strong>30 ngày</strong> kể từ ngày nhận hàng với các điều kiện sau:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Sản phẩm còn nguyên tem mác, chưa qua sử dụng, không bị dơ bẩn hay có mùi lạ.</li>
          <li>Có hóa đơn mua hàng gốc hoặc biên nhận điện tử.</li>
          <li>Sản phẩm bị lỗi do nhà sản xuất (đứt chỉ, loang màu, hỏng khóa kéo) hoặc giao sai mẫu/sai size.</li>
        </ul>
        <p className="mt-4"><strong>Quy trình xử lý:</strong> Sau khi nhận được sản phẩm hoàn trả, chúng tôi sẽ kiểm tra và thực hiện hoàn tiền hoặc gửi sản phẩm thay thế trong vòng 3-5 ngày làm việc.</p>
      </div>
    )
  },
  {
    id: 'privacy',
    title: 'Chính sách bảo mật',
    icon: <ShieldCheck className="w-6 h-6" />,
    content: (
      <div className="space-y-4 text-secondary-600 dark:text-secondary-400 leading-relaxed">
        <p>Fashion Store cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng. Chúng tôi chỉ thu thập và sử dụng thông tin cho các mục đích thiết yếu:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Xử lý và theo dõi tiến trình đơn hàng, giao nhận.</li>
          <li>Cung cấp hỗ trợ kỹ thuật và giải quyết khiếu nại.</li>
          <li>Gửi thông tin khuyến mãi, tin tức thời trang (chỉ khi khách hàng tự nguyện đăng ký nhận tin).</li>
          <li>Nâng cao chất lượng dịch vụ thông qua phân tích trải nghiệm người dùng.</li>
        </ul>
        <p className="mt-4 text-sm bg-secondary-50 dark:bg-secondary-900 p-4 rounded-xl">Chúng tôi đảm bảo không bao giờ bán, chia sẻ hay trao đổi thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại.</p>
      </div>
    )
  },
  {
    id: 'shipping',
    title: 'Chính sách vận chuyển',
    icon: <Truck className="w-6 h-6" />,
    content: (
      <div className="space-y-4 text-secondary-600 dark:text-secondary-400 leading-relaxed">
        <p>Để mang lại trải nghiệm mua sắm tốt nhất, chúng tôi hợp tác với các đơn vị vận chuyển hàng đầu, đảm bảo tốc độ và sự an toàn cho gói hàng của bạn.</p>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-xl border border-secondary-100 dark:border-secondary-800">
            <h4 className="font-bold text-secondary-900 dark:text-white mb-2">Nội thành TP.HCM</h4>
            <p className="text-sm">Phí đồng giá: <strong>25.000đ</strong></p>
            <p className="text-sm">Thời gian: 1 - 2 ngày làm việc</p>
          </div>
          <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-xl border border-secondary-100 dark:border-secondary-800">
            <h4 className="font-bold text-secondary-900 dark:text-white mb-2">Ngoại thành & Tỉnh khác</h4>
            <p className="text-sm">Phí đồng giá: <strong>35.000đ</strong></p>
            <p className="text-sm">Thời gian: 3 - 5 ngày làm việc</p>
          </div>
        </div>
        <p className="mt-4 font-medium text-primary-600 dark:text-primary-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-500"></span>
          Đặc biệt: Miễn phí vận chuyển toàn quốc cho đơn hàng từ 500.000đ.
        </p>
      </div>
    )
  },
  {
    id: 'payment',
    title: 'Phương thức thanh toán',
    icon: <Lock className="w-6 h-6" />,
    content: (
      <div className="space-y-4 text-secondary-600 dark:text-secondary-400 leading-relaxed">
        <p>Fashion Store chấp nhận đa dạng các phương thức thanh toán nhằm mang lại sự tiện lợi tối đa cho khách hàng:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Thanh toán khi nhận hàng (COD):</strong> Khách hàng thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng sau khi kiểm tra.</li>
          <li><strong>Thanh toán trực tuyến VNPay:</strong> Nhanh chóng, an toàn tuyệt đối qua cổng VNPay với thẻ ATM nội địa, Credit Card (Visa, Mastercard, JCB) hoặc QR Code ứng dụng ngân hàng.</li>
        </ul>
        <p className="mt-4 text-sm">Giao dịch thanh toán trực tuyến được mã hóa SSL 256-bit, đảm bảo tính bảo mật và toàn vẹn của dữ liệu thẻ thanh toán.</p>
      </div>
    )
  }
];

export default function PolicyPage() {
  const [openPolicy, setOpenPolicy] = useState<string | null>('returns');

  return (
    <>
      <Helmet>
        <title>Chính sách - Fashion Store</title>
      </Helmet>
      
      {/* Elegant Header */}
      <div className="bg-secondary-900 dark:bg-black text-white py-16 md:py-24 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary-700 via-secondary-900 to-black mix-blend-overlay flex justify-center items-center">
            <ShieldCheck className="w-96 h-96 text-white/5" />
        </div>
        
        <div className="container-custom text-center relative z-10">
          <div className="inline-block px-3 py-1 bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-full mb-4 backdrop-blur-sm">
            Thông tin hỗ trợ
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 drop-shadow-lg">
            Chính Sách Cửa Hàng
          </h1>
          <p className="max-w-2xl mx-auto text-secondary-200 text-lg md:text-xl font-medium">
            Minh bạch, rõ ràng và luôn đặt quyền lợi của khách hàng lên hàng đầu.
          </p>
        </div>
      </div>

      <div className="container-custom py-16 md:py-24 max-w-4xl min-h-[50vh]">
        <div className="space-y-4">
          {policies.map((policy) => {
            const isOpen = openPolicy === policy.id;
            return (
              <div 
                key={policy.id} 
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen 
                    ? 'border-primary-500 bg-white dark:bg-secondary-900 shadow-xl dark:shadow-none' 
                    : 'border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-950 hover:border-secondary-300 dark:hover:border-secondary-700'
                }`}
              >
                <button
                  onClick={() => setOpenPolicy(isOpen ? null : policy.id)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${isOpen ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' : 'bg-secondary-200 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-400'}`}>
                      {policy.icon}
                    </div>
                    <h2 className={`text-xl font-bold uppercase tracking-tight transition-colors ${isOpen ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-900 dark:text-white'}`}>
                      {policy.title}
                    </h2>
                  </div>
                  <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary-600 dark:text-primary-400' : 'text-secondary-400'}`} />
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-6 pt-0 border-t border-secondary-100 dark:border-secondary-800 mt-2">
                    {policy.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
