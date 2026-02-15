import { Helmet } from 'react-helmet-async';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Liên hệ - Fashion Store</title>
      </Helmet>
      
      <div className="container-custom py-12">
        <h1 className="text-3xl font-bold text-secondary-900 mb-8 text-center">Liên hệ với chúng tôi</h1>

        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* Info */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-secondary-800">Thông tin liên lạc</h2>
            <p className="text-secondary-600">
              Chúng tôi luôn sẵn sàng lắng nghe ý kiến đóng góp của bạn. Hãy liên hệ với chúng tôi qua các kênh sau:
            </p>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900">Địa chỉ</h3>
                <p className="text-secondary-600">123 Đường Fashion, Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900">Hotline</h3>
                <p className="text-secondary-600">1900 xxxx</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900">Email</h3>
                <p className="text-secondary-600">support@fashionstore.com</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="card p-6">
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Cảm ơn bạn đã liên hệ!'); }}>
              <div>
                <label className="block text-sm font-medium mb-2 pl-2">Họ và tên</label>
                <input type="text" className="input" placeholder="Nhập họ tên của bạn" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 pl-2">Email</label>
                <input type="email" className="input" placeholder="Nhập email của bạn" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 pl-2">Nội dung</label>
                <textarea className="input !rounded-2xl px-4 py-3" rows={4} placeholder="Nhập nội dung cần hỗ trợ" required />
              </div>
              <button type="submit" className="btn btn-primary w-full rounded-full">Gửi tin nhắn</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
