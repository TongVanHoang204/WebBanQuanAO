import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowRight,
  Search,
  Timer
} from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import HeroSection from '../components/home/HeroSection';
import CategoryGrid from '../components/home/CategoryGrid';
import { Product, Category, Banner } from '../types';
import { productsAPI, bannersAPI, personalizationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [flashSale, setFlashSale] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        const results = await Promise.allSettled([
          productsAPI.getNewArrivals(8),
          productsAPI.getAll({ sort: 'price_desc', limit: 8 }), // Best Sellers
          productsAPI.getAll({ sort: 'discount_desc', limit: 8, on_sale: true }),  // Flash Sale
          bannersAPI.getAll({ position: 'home_hero' }),
          isAuthenticated ? personalizationAPI.getRecommendations(8) : Promise.resolve({ data: { success: false } })
        ]);

        const [
          newArrivalsRes, 
          bestSellersRes, 
          flashSaleRes, 
          bannersRes,
          recommendationsRes
        ] = results;

        if (newArrivalsRes.status === 'fulfilled') setNewArrivals(newArrivalsRes.value.data.data);
        if (bestSellersRes.status === 'fulfilled') setBestSellers(bestSellersRes.value.data.data.products);
        if (flashSaleRes.status === 'fulfilled') setFlashSale(flashSaleRes.value.data.data.products);
        if (bannersRes.status === 'fulfilled' && bannersRes.value.data.success) setBanners(bannersRes.value.data.data);
        if (recommendationsRes.status === 'fulfilled' && recommendationsRes.value?.data?.success) {
          setRecommendations(recommendationsRes.value.data.data);
        }

      } catch (error) {
        console.error('Failed to load homepage data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [isAuthenticated]);

  // Countdown Timer Logic
  const [timeLeft, setTimeLeft] = useState({
    hours: 4,
    minutes: 23,
    seconds: 15
  });

  useEffect(() => {
    // Set target to next 4 hours for demo purposes, or midnight
    const calculateTimeLeft = () => {
        const now = new Date();
        const target = new Date(now);
        target.setHours(target.getHours() + 4); // Fake flash sale ending in 4 hours
        target.setMinutes(0);
        target.setSeconds(0);
        
        const diff = target.getTime() - now.getTime();
        // Since we want a continuous countdown for demo, let's just decrement from the initial static 04:23:15
        // Actually, let's make it a real countdown to midnight for better layout stability
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        let difference = midnight.getTime() - now.getTime();
        
        return difference;
    };

    const timer = setInterval(() => {
        setTimeLeft(prev => {
            if (prev.seconds > 0) {
                return { ...prev, seconds: prev.seconds - 1 };
            } else if (prev.minutes > 0) {
                return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
            } else if (prev.hours > 0) {
                return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
            } else {
                // Reset or stop
                return { hours: 4, minutes: 23, seconds: 15 }; // Loop for demo
            }
        });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const featuredBanner = banners.length > 0 ? banners[0] : null;

  return (
    <>
      <Helmet>
        <title>ShopEase - Effortless Sophistication</title>
        <meta name="description" content="Discover curated fashion collections for the modern minimalist." />
      </Helmet>

      <div className="bg-white dark:bg-black min-h-screen transition-colors duration-300">
        
        <HeroSection banner={featuredBanner} />

        <CategoryGrid />

        {/* FLASH EVENT */}
        <section className="bg-[#F9F8F4] dark:bg-secondary-900 py-24 transition-colors duration-300"> 
            <div className="container-custom">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-serif text-secondary-900 dark:text-white mb-6">Sự Kiện Flash Sale</h2>
                    
                    {/* Countdown */}
                    <div className="flex items-center justify-center gap-4 text-2xl md:text-4xl font-serif text-[#8c734b] dark:text-[#d4af37]">
                        <div className="flex flex-col items-center">
                            <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">GIỜ</span>
                        </div>
                        <span className="pb-4">:</span>
                        <div className="flex flex-col items-center">
                            <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">PHÚT</span>
                        </div>
                        <span className="pb-4">:</span>
                        <div className="flex flex-col items-center">
                            <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">GIÂY</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                     {flashSale.slice(0, 4).map((product) => (
                         <Link to={`/products/${product.slug}`} key={product.id} className="group bg-white dark:bg-secondary-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                             <div className="relative aspect-[4/5] overflow-hidden">
                                 <span className="absolute top-3 right-3 bg-white/90 text-black text-xs font-bold px-2 py-1 rounded shadow-sm z-10">
                                     -{Math.round(((Number(product.compare_at_price) - Number(product.base_price)) / Number(product.compare_at_price)) * 100)}%
                                 </span>
                                 <img 
                                    src={product.product_images?.[0]?.url || 'https://placehold.co/600x600/e2e8f0/1e293b?text=No+Image'} 
                                    alt={product.name}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/e2e8f0/1e293b?text=No+Image';
                                    }}
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                                 />
                             </div>
                             <div className="p-4 md:p-5">
                                 <h3 className="font-semibold text-sm md:text-base text-secondary-900 dark:text-white mb-2 line-clamp-2">{product.name}</h3>
                                 <div className="flex items-center gap-2 text-sm">
                                     <span className="font-bold text-black dark:text-white">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(product.base_price))}</span>
                                     <span className="text-secondary-400 line-through text-xs rounded border border-gray-200 px-1">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(product.compare_at_price))}</span>
                                 </div>
                             </div>
                         </Link>
                     ))}
                </div>
            </div>
        </section>

        {/* BESTSELLERS */}
        <section className="container-custom py-24 dark:bg-black transition-colors duration-300">
             <div className="flex justify-between items-end mb-12 border-b border-gray-200 dark:border-gray-800 pb-4">
                 <div>
                    <span className="text-[#8c734b] dark:text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-2 block">Premium Collection</span>
                    <h2 className="text-3xl md:text-5xl font-serif text-secondary-900 dark:text-white">Sản Phẩm Bán Chạy</h2>
                 </div>
                 <div className="flex gap-2">
                     <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-full text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white">
                         <ArrowRight className="w-5 h-5 rotate-180" />
                     </button>
                     <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-full text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white">
                         <ArrowRight className="w-5 h-5" />
                     </button>
                 </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {bestSellers.slice(0, 4).map((product) => (
                    <Link to={`/products/${product.slug}`} key={product.id} className="group cursor-pointer">
                        <div className="bg-[#f9f8f4] dark:bg-secondary-800 aspect-[4/5] mb-5 relative overflow-hidden rounded-xl">
                             <img 
                                src={product.product_images?.[0]?.url || 'https://placehold.co/400x500/e2e8f0/1e293b?text=No+Image'} 
                                alt={product.name}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x500/e2e8f0/1e293b?text=No+Image';
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                             />
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <h3 className="font-serif text-lg text-secondary-900 dark:text-white mb-2 line-clamp-1">{product.name}</h3>
                            <span className="font-bold text-sm tracking-wide text-black dark:text-white">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(product.base_price))}
                            </span>
                        </div>
                    </Link>
                ))}
             </div>
        </section>

        {/* RECOMMENDED FOR YOU */}
        {isAuthenticated && recommendations.length > 0 && (
          <section className="container-custom py-20 bg-secondary-50 dark:bg-secondary-900 transition-colors duration-300">
               <div className="flex justify-between items-center mb-12">
                   <div>
                      <span className="text-primary-600 dark:text-primary-400 font-bold tracking-widest mb-2 block uppercase text-sm flex items-center gap-2">
                         DÀNH CHO RIÊNG BẠN
                      </span>
                      <h2 className="text-4xl font-bold text-secondary-900 dark:text-white">Gợi ý từ AI của ShopEase</h2>
                   </div>
                   <Link to="/shop" className="text-sm font-bold border-b border-black dark:border-white pb-1 hover:text-primary-600 dark:hover:text-primary-400 dark:text-white transition-colors">
                       Khám phá thêm
                   </Link>
               </div>
  
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                  {recommendations.slice(0, 4).map((product) => (
                      <ProductCard key={product.id} product={product} />
                  ))}
               </div>
          </section>
        )}

        {/* NEWSLETTER - "Join the Inner Circle" */}
        <section className="container-custom py-24 border-t border-gray-100 dark:border-secondary-800 dark:bg-secondary-900">
             <div className="max-w-2xl mx-auto text-center">
                 <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Tham Gia Inner Circle</h2>
                 <p className="text-gray-500 dark:text-gray-400 mb-8 font-light">
                    Nhận thông báo tuyển chọn về bộ sưu tập mới, sự kiện độc quyền và nội dung phong cách sống từ ShopEase.
                 </p>
                 <form className="relative max-w-md mx-auto">
                     <input 
                        type="email" 
                        placeholder="Địa chỉ Email"
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border border-transparent focus:bg-white dark:focus:bg-secondary-900 py-4 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors placeholder-gray-400 dark:placeholder-gray-500 dark:text-white"
                     />
                     <button className="absolute right-0 top-1 btn btn-primary py-2 px-6 text-xs h-[calc(100%-8px)] mr-1">
                        Đăng Ký
                     </button>
                 </form>
             </div>
        </section>
      </div>
    </>
  );
}
