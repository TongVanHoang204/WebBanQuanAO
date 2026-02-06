import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Banner } from '../../types';

interface HeroSectionProps {
  banner: Banner | null;
}

export default function HeroSection({ banner }: HeroSectionProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Get all images: banner_images (sorted) or fallback to main image_url
  const images = banner?.banner_images?.length 
    ? banner.banner_images.map(bi => bi.image_url)
    : (banner?.image_url ? [banner.image_url] : []);
    
  useEffect(() => {
    if (images.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000); // 5 seconds
    
    return () => clearInterval(timer);
  }, [images.length]);

  const nextSlide = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  if (!banner && images.length === 0) {
      return <section className="relative h-[500px] md:h-[600px] lg:h-[700px] bg-secondary-100" />;
  }

  return (
    <section className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden group">
      {/* Background Images */}
      {images.map((img, index) => (
        <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
        >
            <img
            src={img}
            alt={banner?.title || "Hero Banner"}
            className="w-full h-full object-cover object-top"
            />
             <div className="absolute inset-0 bg-black/20" /> {/* Subtle Overlay */}
        </div>
      ))}

      {/* Navigation Arrows (only if multiple images) */}
      {images.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          
          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {images.map((_, idx) => (
                <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                    }`}
                />
            ))}
          </div>
        </>
      )}

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
        <div className="mt-32 md:mt-0 pointer-events-auto"> 
            {banner?.link_url && (
                 <Link 
                 to={banner.link_url}
                 className="btn btn-secondary px-8 py-3 text-xs animate-slide-up inline-block"
                 style={{ animationDelay: '0.2s' }}
              >
                 {banner.button_text || 'Khám Phá Ngay'}
              </Link>
            )}
        </div>
      </div>
    </section>
  );
}
