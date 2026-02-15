import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { 
  ArrowRight,
  Search,
  Timer
} from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import HeroSection from '../components/home/HeroSection';
import CategoryGrid from '../components/home/CategoryGrid';
import LoadingScreen from '../components/common/LoadingScreen';
import { Product, Category, Banner } from '../types';
import { productsAPI, bannersAPI, toMediaUrl } from '../services/api';

export default function HomePage() {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [flashSale, setFlashSale] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const results = await Promise.allSettled([
          productsAPI.getNewArrivals(8),
          productsAPI.getAll({ sort: 'price_desc', limit: 8 }), // Best Sellers
          productsAPI.getAll({ sort: 'discount_desc', limit: 8, on_sale: true }),  // Flash Sale
          bannersAPI.getAll({ position: 'home_hero' })
        ]);

        const [
          newArrivalsRes, 
          bestSellersRes, 
          flashSaleRes, 
          bannersRes
        ] = results;

        if (newArrivalsRes.status === 'fulfilled') setNewArrivals(newArrivalsRes.value.data.data);
        if (bestSellersRes.status === 'fulfilled') setBestSellers(bestSellersRes.value.data.data.products);
        if (flashSaleRes.status === 'fulfilled') setFlashSale(flashSaleRes.value.data.data.products);
        if (bannersRes.status === 'fulfilled' && bannersRes.value.data.success) setBanners(bannersRes.value.data.data);

      } catch (error) {
        console.error('Failed to load homepage data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

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

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <SEO 
        title="ShopEase - Effortless Sophistication" 
        description="Discover curated fashion collections for the modern minimalist."
        image="/logo_wordmark_serif.png"
      />

      <div className="bg-white dark:bg-black min-h-screen transition-colors duration-300">
        
        <HeroSection banner={featuredBanner} />

        <CategoryGrid />

        {/* FLASH EVENT */}
        <section className="bg-secondary-100 dark:bg-secondary-900 py-20 transition-colors duration-300"> 
            <div className="container-custom">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h2 className="text-4xl font-bold text-secondary-900 dark:text-white mb-2">Sự Kiện Flash Sale</h2>
                        <div className="flex items-center gap-4 text-secondary-600 dark:text-gray-300 font-mono text-sm">
                             <span>Kết thúc trong:</span>
                             <div className="flex gap-2">
                                <span className="bg-white dark:bg-secondary-800 dark:text-white px-2 py-1 rounded min-w-[2.5rem] text-center shadow-sm">
                                    {String(timeLeft.hours).padStart(2, '0')}
                                </span> :
                                <span className="bg-white dark:bg-secondary-800 dark:text-white px-2 py-1 rounded min-w-[2.5rem] text-center shadow-sm">
                                    {String(timeLeft.minutes).padStart(2, '0')}
                                </span> :
                                <span className="bg-white dark:bg-secondary-800 dark:text-white px-2 py-1 rounded min-w-[2.5rem] text-center shadow-sm">
                                    {String(timeLeft.seconds).padStart(2, '0')}
                                </span>
                             </div>
                        </div>
                    </div>
                    <Link to="/shop?sort=discount" className="text-xs uppercase tracking-widest border-b border-black dark:border-white pb-1 hover:text-secondary-600 dark:hover:text-gray-300 dark:text-white transition-colors">
                        Xem Ưu Đãi
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                     {flashSale.slice(0, 4).map((product) => (
                         <Link to={`/products/${product.slug}`} key={product.id} className="group">
                             <div className="relative aspect-square bg-white dark:bg-secondary-800 mb-4 overflow-hidden rounded-lg">
                                 <span className="absolute top-2 left-2 bg-black text-white text-[10px] uppercase font-bold px-2 py-1 z-10">
                                     -{Math.round(((Number(product.compare_at_price) - Number(product.base_price)) / Number(product.compare_at_price)) * 100)}%
                                 </span>
                                 <img 
                                    src={toMediaUrl(product.product_images?.[0]?.url || 'https://placehold.co/600x600/e2e8f0/1e293b?text=No+Image')} 
                                    alt={product.name}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/e2e8f0/1e293b?text=No+Image';
                                    }}
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                 />
                                 {/* Hover Action */}
                                 <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                     <span className="w-full bg-white text-black py-3 text-xs uppercase font-bold hover:bg-black hover:text-white transition-colors block text-center shadow-lg rounded-full mx-4 mb-2">
                                         Xem Chi Tiết
                                     </span>
                                 </div>
                             </div>
                             <div className="text-center">
                                 <p className="text-xs text-secondary-500 dark:text-gray-400 uppercase mb-1">{product.category?.name || 'Bộ sưu tập'}</p>
                                 <h3 className="font-bold text-lg text-secondary-900 dark:text-white mb-1">{product.name}</h3>
                                 <div className="flex justify-center gap-3 text-sm">
                                     <span className="font-bold dark:text-white">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(product.base_price))}</span>
                                     <span className="text-secondary-400 line-through">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(product.compare_at_price))}</span>
                                 </div>
                             </div>
                         </Link>
                     ))}
                </div>
            </div>
        </section>

        {/* BESTSELLERS */}
        <section className="container-custom py-20 dark:bg-black transition-colors duration-300">
             <div className="flex justify-between items-center mb-12">
                 <div>
                    <span className="text-secondary-500 dark:text-gray-400 text-xs uppercase tracking-widest mb-1 block">Phải Có (Must Have)</span>
                    <h2 className="text-4xl font-bold text-secondary-900 dark:text-white">Sản Phẩm Bán Chạy</h2>
                 </div>
                 <div className="flex gap-2">
                     <button className="w-10 h-10 border border-secondary-300 dark:border-secondary-700 flex items-center justify-center hover:bg-black dark:hover:bg-white dark:hover:text-black hover:text-white transition-colors hover:border-black dark:hover:border-white dark:text-white rounded-full">
                         <ArrowRight className="w-4 h-4 rotate-180" />
                     </button>
                     <button className="w-10 h-10 border border-secondary-300 dark:border-secondary-700 flex items-center justify-center hover:bg-black dark:hover:bg-white dark:hover:text-black hover:text-white transition-colors hover:border-black dark:hover:border-white dark:text-white rounded-full">
                         <ArrowRight className="w-4 h-4" />
                     </button>
                 </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {bestSellers.slice(0, 4).map((product) => (
                    <Link to={`/products/${product.slug}`} key={product.id} className="group cursor-pointer">
                        <div className="bg-secondary-50 dark:bg-secondary-800 aspect-[4/5] mb-4 relative overflow-hidden rounded-lg">
                             <img 
                                src={toMediaUrl(product.product_images?.[0]?.url || 'https://placehold.co/400x500/e2e8f0/1e293b?text=No+Image')} 
                                alt={product.name}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x500/e2e8f0/1e293b?text=No+Image';
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                             />
                        </div>
                        <div className="flex justify-between items-start">
                             <div>
                                <h3 className="font-bold text-lg text-secondary-900 dark:text-white">{product.name}</h3>
                                <p className="text-xs text-secondary-500 dark:text-gray-400 uppercase mt-1">Cao Cấp</p>
                             </div>
                             <span className="font-medium text-sm dark:text-white">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(product.base_price))}
                             </span>
                        </div>
                    </Link>
                ))}
             </div>
        </section>

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
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border border-transparent focus:bg-white dark:focus:bg-secondary-900 py-4 pl-6 pr-32 rounded-full focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors placeholder-gray-400 dark:placeholder-gray-500 dark:text-white"
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
