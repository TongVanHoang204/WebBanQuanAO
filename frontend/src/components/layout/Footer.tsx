import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  Phone,
  Mail,
  MapPin,
  Send
} from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    alert('Cảm ơn bạn đã đăng ký nhận tin!');
    setEmail('');
  };

  return (
    <footer className="bg-secondary-900 text-white print:hidden">
      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4">
              Fashion<span className="text-primary-400">Store</span>
            </h3>
            <p className="text-secondary-300 mb-4">
              Cửa hàng thời trang trực tuyến hàng đầu Việt Nam. Mang đến cho bạn những sản phẩm chất lượng với giá cả hợp lý.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-secondary-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/shop" className="text-secondary-300 hover:text-primary-400 transition-colors">
                  Cửa hàng
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-secondary-300 hover:text-primary-400 transition-colors">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-secondary-300 hover:text-primary-400 transition-colors">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-secondary-300 hover:text-primary-400 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-secondary-300 hover:text-primary-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-secondary-300 hover:text-primary-400 transition-colors">
                  Chính sách vận chuyển
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-secondary-300 hover:text-primary-400 transition-colors">
                  Đổi trả hàng
                </Link>
              </li>
              <li>
                <Link to="/order-tracking" className="text-secondary-300 hover:text-primary-400 transition-colors">
                  Theo dõi đơn hàng
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-secondary-300 hover:text-primary-400 transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Đăng ký nhận tin</h4>
            <p className="text-secondary-300 mb-4">
              Nhận thông tin khuyến mãi và sản phẩm mới nhất
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                placeholder="Email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2 rounded-full bg-secondary-800 border border-secondary-700 focus:outline-none focus:border-primary-500 text-white placeholder:text-secondary-400"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 btn btn-primary flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-secondary-300">
                <Phone className="w-5 h-5 text-primary-400" />
                <span>1900-xxxx</span>
              </div>
              <div className="flex items-center gap-3 text-secondary-300">
                <Mail className="w-5 h-5 text-primary-400" />
                <span>support@fashionstore.vn</span>
              </div>
              <div className="flex items-center gap-3 text-secondary-300">
                <MapPin className="w-5 h-5 text-primary-400" />
                <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-secondary-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-secondary-400 text-sm">
              © 2024 Fashion Store. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" className="h-6 object-contain opacity-70" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg" alt="Mastercard" className="h-6 object-contain opacity-70" />
              <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo" className="h-6 object-contain opacity-70" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
