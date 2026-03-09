import { Helmet } from 'react-helmet-async';
import { ShieldCheck, Truck, Clock, Award, Users, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>Về chúng tôi - Fashion Store</title>
      </Helmet>
      
      {/* Hero Banner */}
      <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" 
          alt="Fashion Store Hero" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase italic tracking-tighter mb-4 drop-shadow-lg">
            Hành Trình Thời Trang
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl font-medium drop-shadow-md">
            Biểu tượng của sự thanh lịch vượt thời gian, giúp bạn định hình phong cách cá nhân từ năm 2018.
          </p>
        </div>
      </div>

      <div className="bg-secondary-50 dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100 py-16 md:py-24 transition-colors duration-300">
        
        {/* Stats Section */}
        <div className="container-custom max-w-7xl mb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center divide-x divide-secondary-200 dark:divide-secondary-800">
            <div className="flex flex-col items-center justify-center p-4">
              <span className="text-4xl md:text-5xl font-black text-primary-600 dark:text-primary-500 mb-2">5+</span>
              <span className="text-sm font-bold uppercase tracking-widest text-secondary-500">Năm kinh nghiệm</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <span className="text-4xl md:text-5xl font-black text-primary-600 dark:text-primary-500 mb-2">1M+</span>
              <span className="text-sm font-bold uppercase tracking-widest text-secondary-500">Sản phẩm bán ra</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <span className="text-4xl md:text-5xl font-black text-primary-600 dark:text-primary-500 mb-2">500k</span>
              <span className="text-sm font-bold uppercase tracking-widest text-secondary-500">Khách hàng</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <span className="text-4xl md:text-5xl font-black text-primary-600 dark:text-primary-500 mb-2">120</span>
              <span className="text-sm font-bold uppercase tracking-widest text-secondary-500">Cửa hàng toàn quốc</span>
            </div>
          </div>
        </div>

        {/* Brand Story (50/50 Split) */}
        <div className="container-custom max-w-7xl mb-24">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="order-2 md:order-1 space-y-6">
              <div className="inline-block px-3 py-1 bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200 text-xs font-bold uppercase tracking-widest rounded-full mb-2">
                Câu chuyện của chúng tôi
              </div>
              <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-tight">
                Không chỉ là quần áo, <br className="hidden md:block"/>
                <span className="text-primary-600 dark:text-primary-500">đó là một phong cách sống.</span>
              </h2>
              <div className="prose prose-lg dark:prose-invert text-secondary-600 dark:text-secondary-400">
                <p>
                  Khởi nguồn từ một xưởng may nhỏ vào năm 2018, <strong>Fashion Store</strong> mang theo hoài bão đem đến vẻ đẹp hoàn mỹ cho phụ nữ và nam giới hiện đại. Chúng tôi tin rằng thời trang không dừng lại ở việc khoác lên mình một bộ trang phục đẹp.
                </p>
                <p>
                  Tại <strong>Fashion Store</strong>, mỗi bộ sưu tập là một câu chuyện, một cảm hứng được đúc kết từ nhịp sống hối hả nhưng đầy kiêu hãnh của thành thị. Tỉ mỉ từ khâu chọn chất liệu, khắt khe trong từng đường kim mũi chỉ, chúng tôi hướng đến chất lượng bền vững và kiểu dáng vượt thời gian.
                </p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl bg-secondary-200 dark:bg-secondary-800">
                <img 
                  src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop" 
                  alt="Brand Story" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="bg-white dark:bg-secondary-950 py-24 mb-24">
          <div className="container-custom max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter mb-4">Giá trị cốt lõi</h2>
              <p className="text-secondary-500 max-w-2xl mx-auto">
                Những nguyên tắc định hình mọi quyết định và sản phẩm tại Fashion Store.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <div className="text-center group p-8 rounded-3xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all shadow-sm hover:shadow-xl">
                <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                  <Award className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 uppercase tracking-tight">Chất lượng thượng hạng</h3>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Nguồn vải được tinh tuyển khắt khe. Mỗi sản phẩm phải vượt qua 3 vòng kiểm duyệt độc lập trước khi đến tay bạn.
                </p>
              </div>
              
              <div className="text-center group p-8 rounded-3xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all shadow-sm hover:shadow-xl">
                <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                  <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 uppercase tracking-tight">Lấy khách hàng làm trung tâm</h3>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Triết lý kinh doanh luôn đặt trải nghiệm và sự hài lòng của khách hàng lên vị trí độc tôn.
                </p>
              </div>

              <div className="text-center group p-8 rounded-3xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all shadow-sm hover:shadow-xl">
                <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                  <ShieldCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 uppercase tracking-tight">Phát triển bền vững</h3>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Giảm thiểu tác động môi trường thông qua bao bì tái chế và quy trình sản xuất dệt may sinh thái.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="container-custom max-w-4xl text-center">
          <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter mb-6 leading-tight">
            Bạn đã sẵn sàng để nâng tầm <br className="hidden md:block"/> phong cách của chính mình?
          </h2>
          <p className="text-secondary-500 mb-10 max-w-xl mx-auto">
            Gia nhập cộng đồng người yêu thời trang thực thụ. Khám phá những bộ sưu tập mới nhất ngay hôm nay.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/shop" className="btn btn-primary rounded-full px-10 py-4 text-base shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Khám phá Cửa hàng
            </Link>
            <Link to="/contact" className="btn bg-white dark:bg-secondary-800 border-2 border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-white rounded-full px-10 py-4 text-base hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors">
              Liên hệ chúng tôi
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}
