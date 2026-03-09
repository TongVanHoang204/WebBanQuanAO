import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Phone, MapPin, Send, Clock, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong 24h tới.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <>
      <Helmet>
        <title>Liên hệ - Fashion Store</title>
      </Helmet>
      
      {/* Elegant Header */}
      <div className="bg-secondary-50 dark:bg-secondary-950 py-16 md:py-24 border-b border-secondary-200 dark:border-secondary-800">
        <div className="container-custom text-center">
          <div className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 text-xs font-bold uppercase tracking-widest rounded-full mb-4">
            Liên hệ với chúng tôi
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-secondary-900 dark:text-white mb-6">
            Chúng tôi luôn lắng nghe
          </h1>
          <p className="max-w-2xl mx-auto text-secondary-600 dark:text-secondary-400 text-lg">
            Dù là câu hỏi về sản phẩm, đơn hàng hay hợp tác biểu diễn, đội ngũ Fashion Store luôn sẵn sàng hỗ trợ bạn một cách tốt nhất.
          </p>
        </div>
      </div>

      <div className="container-custom py-16 md:py-24">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-20">
          
          {/* Contact Information */}
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-secondary-900 dark:text-white mb-8">
                Thông tin liên lạc
              </h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center flex-shrink-0 text-primary-600 dark:text-primary-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-1">Cửa hàng chính</h3>
                    <p className="text-secondary-600 dark:text-secondary-400 leading-relaxed">
                      123 Đường Fashion, Phường Bến Nghé,<br/> Quận 1, TP. Hồ Chí Minh
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center flex-shrink-0 text-primary-600 dark:text-primary-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-1">Đường dây nóng</h3>
                    <p className="text-secondary-600 dark:text-secondary-400">1900 xxxx</p>
                    <p className="text-sm text-secondary-500 mt-1">Hỗ trợ 24/7 đối với thẻ VIP</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center flex-shrink-0 text-primary-600 dark:text-primary-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-1">Email hỗ trợ</h3>
                    <p className="text-secondary-600 dark:text-secondary-400">support@fashionstore.com</p>
                    <p className="text-secondary-600 dark:text-secondary-400">press@fashionstore.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Hours */}
            <div className="bg-secondary-50 dark:bg-secondary-900 p-8 rounded-3xl border border-secondary-200 dark:border-secondary-800">
              <h3 className="text-xl font-bold uppercase tracking-tight text-secondary-900 dark:text-white mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" /> Giờ mở cửa
              </h3>
              <ul className="space-y-3 text-secondary-600 dark:text-secondary-400">
                <li className="flex justify-between items-center pb-3 border-b border-secondary-200 dark:border-secondary-700">
                  <span>Thứ Hai - Thứ Sáu</span>
                  <span className="font-medium text-secondary-900 dark:text-white">09:00 - 22:00</span>
                </li>
                <li className="flex justify-between items-center pb-3 border-b border-secondary-200 dark:border-secondary-700">
                  <span>Thứ Bảy</span>
                  <span className="font-medium text-secondary-900 dark:text-white">09:00 - 23:00</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Chủ Nhật</span>
                  <span className="font-medium text-secondary-900 dark:text-white">10:00 - 22:00</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-secondary-900 rounded-3xl p-8 md:p-12 shadow-xl border border-secondary-100 dark:border-secondary-800">
              <h2 className="text-2xl font-bold uppercase tracking-tight text-secondary-900 dark:text-white mb-8">
                Gửi tin nhắn cho chúng tôi
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-2 uppercase tracking-wider">Họ và tên</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Nguyễn Văn A"
                      className="w-full px-5 py-3 rounded-xl border border-secondary-300 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-950 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-2 uppercase tracking-wider">Email</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="email@example.com"
                      className="w-full px-5 py-3 rounded-xl border border-secondary-300 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-950 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-2 uppercase tracking-wider">Chủ đề</label>
                  <input 
                    type="text" 
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Vấn đề bạn cần hỗ trợ là gì?"
                    className="w-full px-5 py-3 rounded-xl border border-secondary-300 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-950 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-2 uppercase tracking-wider">Nội dung tin nhắn</label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6} 
                    placeholder="Viết chi tiết nội dung bạn muốn gửi..."
                    className="w-full px-5 py-3 rounded-2xl border border-secondary-300 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-950 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-none" 
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-full transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Gửi tin nhắn
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
