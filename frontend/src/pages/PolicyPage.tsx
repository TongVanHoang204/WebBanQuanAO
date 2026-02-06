import { Helmet } from 'react-helmet-async';

export default function PolicyPage() {
  return (
    <>
      <Helmet>
        <title>Chính sách - Fashion Store</title>
      </Helmet>
      
      <div className="container-custom py-12">
        <h1 className="text-3xl font-bold text-secondary-900 mb-8 text-center">Chính sách cửa hàng</h1>
        
        <div className="prose prose-lg mx-auto text-secondary-600">
          <h2 className="text-secondary-800">1. Chính sách đổi trả</h2>
          <p>
            Chúng tôi hỗ trợ đổi trả sản phẩm trong vòng <strong>30 ngày</strong> kể từ ngày nhận hàng với điều kiện:
          </p>
          <ul>
            <li>Sản phẩm còn nguyên tem mác, chưa qua sử dụng.</li>
            <li>Có hóa đơn mua hàng.</li>
            <li>Sản phẩm bị lỗi do nhà sản xuất hoặc giao sai mẫu.</li>
          </ul>

          <h2 className="text-secondary-800">2. Chính sách bảo mật</h2>
          <p>
            Fashion Store cam kết bảo mật thông tin cá nhân của khách hàng. Chúng tôi chỉ sử dụng thông tin để:
          </p>
          <ul>
            <li>Xử lý đơn hàng và giao nhận.</li>
            <li>Gửi thông tin khuyến mãi (nếu khách hàng đăng ký).</li>
            <li>Nâng cao chất lượng dịch vụ.</li>
          </ul>

          <h2 className="text-secondary-800">3. Chính sách vận chuyển</h2>
          <p>
            - Phí nội thành TP.HCM: 25.000đ<br/>
            - Phí ngoại thành và các tỉnh khác: 35.000đ<br/>
            - <strong>Miễn phí vận chuyển</strong> cho đơn hàng từ 500.000đ.
          </p>
        </div>
      </div>
    </>
  );
}
