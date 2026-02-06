import { Helmet } from 'react-helmet-async';

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>Về chúng tôi - Fashion Store</title>
      </Helmet>
      
      <div className="container-custom py-12">
        <h1 className="text-3xl font-bold text-secondary-900 mb-8 text-center">Về Fashion Store</h1>
        
        <div className="prose prose-lg mx-auto text-secondary-600">
          <p>
            Chào mừng bạn đến với <strong>Fashion Store</strong>, điểm đến thời trang phong cách và hiện đại. 
            Chúng tôi tin rằng thời trang không chỉ là trang phục mà còn là cách bạn thể hiện cá tính riêng.
          </p>
          
          <h2 className="text-secondary-800">Sứ mệnh của chúng tôi</h2>
          <p>
            Mang đến những sản phẩm thời trang chất lượng cao với mức giá hợp lý, giúp mọi người tự tin tỏa sáng mỗi ngày.
            Chúng tôi cam kết về chất lượng vải, đường may và thiết kế luôn cập nhật xu hướng mới nhất.
          </p>

          <h2 className="text-secondary-800">Tại sao chọn chúng tôi?</h2>
          <ul>
            <li><strong>Chất lượng đảm bảo:</strong> Kiểm tra nghiêm ngặt từng sản phẩm.</li>
            <li><strong>Giao hàng nhanh chóng:</strong> Đội ngũ vận chuyển chuyên nghiệp.</li>
            <li><strong>Hỗ trợ tận tâm:</strong> Luôn lắng nghe và giải quyết mọi thắc mắc của khách hàng.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
