import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Shirt, 
  Tag, 
  Gem, 
  Gift, 
  Star, 
  Zap,
  Watch,
  ShoppingBag,
  Footprints,
  Glasses,
  Baby,
  Crown
} from 'lucide-react';
import { Category } from '../../types';
import { categoriesAPI } from '../../services/api';

// Custom Dress Icon since Lucide doesn't have one
const Dress = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 2C9 2 7 3.5 7 5.5V8.5L4 22H20L17 8.5V5.5C17 3.5 15 2 12 2Z" />
    <path d="M12 2V8.5" />
    <path d="M7 8.5H17" />
  </svg>
);

// Mapping slugs to icons and animations
const getCategoryIcon = (slug: string) => {
  if (slug.includes('mu') || slug.includes('non') || slug.includes('hat')) return { Icon: Crown, animation: 'group-hover:animate-bounce' };
  if (slug.includes('kinh') || slug.includes('glasses')) return { Icon: Glasses, animation: 'group-hover:animate-wiggle' };
  if (slug.includes('giay') || slug.includes('shoes') || slug.includes('dep')) return { Icon: Footprints, animation: 'group-hover:animate-tada' };
  if (slug.includes('nu') || slug.includes('women') || slug.includes('dam') || slug.includes('vay')) return { Icon: Dress, animation: 'group-hover:animate-wiggle' };
  if (slug.includes('nam') || slug.includes('men') || slug.includes('ao')) return { Icon: Shirt, animation: 'group-hover:animate-float' };
  if (slug.includes('tui') || slug.includes('bag')) return { Icon: ShoppingBag, animation: 'group-hover:animate-rubberBand' };
  if (slug.includes('phu-kien') || slug.includes('accessories')) return { Icon: Watch, animation: 'group-hover:animate-swing' };
  if (slug.includes('tre-em') || slug.includes('kids')) return { Icon: Baby, animation: 'group-hover:animate-bounce' };
  if (slug.includes('sale')) return { Icon: Tag, animation: 'group-hover:animate-swing' };
  if (slug.includes('qua') || slug.includes('gift')) return { Icon: Gift, animation: 'group-hover:animate-tada' };
  if (slug.includes('moi') || slug.includes('new')) return { Icon: Star, animation: 'group-hover:animate-spin' }; 
  if (slug.includes('cao-cap') || slug.includes('premium')) return { Icon: Gem, animation: 'group-hover:animate-pulse' };
  return { Icon: Tag, animation: 'group-hover:animate-swing' };
};

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesAPI.getAll();
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Optional: Mix in static "special" categories if they aren't in DB
  const staticCategories = [
    { id: 'sale', name: 'Sale', slug: 'sale', link: '/shop?category=sale', icon: Tag },
    { id: 'new', name: 'Mới Về', slug: 'new-arrivals', link: '/shop?sort=newest', icon: Star },
  ];

  if (loading) {
      return <div className="py-20 text-center">Đang tải danh mục...</div>;
  }

  // Combine DB categories with static ones (optional, or just use DB)
  // Let's us DB categories primarily as requested.
  
  return (
    <section className="py-16 px-4 container-custom">
      <div className="text-center mb-12">
        <span className="text-primary-600 text-sm font-medium tracking-wider uppercase">Danh Mục</span>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary-900 dark:text-white mt-2">
          Khám Phá Phong Cách
        </h2>
      </div>

      <div className="flex flex-wrap justify-center gap-8 md:gap-12">
        {categories.map((cat) => {
          const { Icon, animation } = getCategoryIcon(cat.slug);
          return (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group flex flex-col items-center gap-4"
            >
              {/* Outer Dashed Circle */}
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border border-dashed border-secondary-300 p-2 group-hover:border-primary-500 transition-colors duration-300">
                {/* Inner Circle */}
                <div className="w-full h-full rounded-full bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors duration-300">
                  {/* Icon with Dynamic Animation */}
                  <Icon 
                    strokeWidth={1.5}
                    className={`w-8 h-8 md:w-10 md:h-10 text-secondary-600 dark:text-secondary-300 group-hover:text-primary-600 transition-all duration-300 ${animation}`} 
                    // Note: animation classes in getCategoryIcon include group-hover, but here inside the group we might just want the animation to run on hover of the parent Link (group). 
                    // Tailwind 'animate-wiggle' defined in CSS has :hover built in?
                    // Let's check the CSS I wrote. ".animate-wiggle:hover". 
                    // This means the icon itself needs to be hovered.
                    // But we want it to animate when the *Link* (parent) is hovered.
                    // So we should use `group-hover:animate-something`? 
                    // No, my CSS definitions were `.animate-wiggle:hover`. This is restrictive.
                    // Better to define `.animate-wiggle` class that just has the animation, and apply it conditionally or use `group-hover` utility if configured.
                    // However, standard tailwind doesn't have `group-hover` for custom animations usually unless configured? 
                    // Actually, if I define the class `.wiggle { animation: ... }`, then I can do `group-hover:wiggle` ONLY if `wiggle` returns a property that Tailwind handles? Use arbitrary values?
                    // Simpler approach: Define `.group:hover .custom-animate-wiggle { animation: ... }` in CSS?
                    // OR: Just let the user hover the circle.
                    // Let's rely on the CSS I added. I defined `.animate-wiggle:hover`. This will only work if the ICON is hovered. 
                    // The user hovers the whole circle usually.
                    // I will update the CSS in the previous step (it's already done though). 
                    // Wait, I can't undo the previous step easily.
                    // I'll update the CSS in the NEXT step to remove the `:hover` pseudo-class from the definitions, so they are just utility classes. 
                    // Then I will use `group-hover:animate-[name]`? 
                    // Tailwind JIT handles arbitrary animations well? 
                    // Let's just update CSS to be:
                    // .hover-wiggle:hover { ... } 
                    // .group:hover .group-hover-wiggle { animation: ... }
                  />
                </div>
              </div>
              
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-200 uppercase tracking-wide group-hover:text-primary-600 transition-colors">
                {cat.name}
              </span>
            </Link>
          );
        })}

        {/* Static Additions */}
        {staticCategories.map((cat) => {
             const { Icon, animation } = getCategoryIcon(cat.slug);
             return (
             <Link
             key={cat.id}
             to={cat.link}
             className="group flex flex-col items-center gap-4"
           >
             <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border border-dashed border-secondary-300 p-2 group-hover:border-primary-500 transition-colors duration-300">
               <div className="w-full h-full rounded-full bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors duration-300">
                 <Icon
                   strokeWidth={1.5}
                   className={`w-8 h-8 md:w-10 md:h-10 text-secondary-600 dark:text-secondary-300 group-hover:text-primary-600 transition-all duration-300 ${animation}`}
                 />
               </div>
             </div>
             <span className="text-sm font-medium text-secondary-900 dark:text-secondary-200 uppercase tracking-wide group-hover:text-primary-600 transition-colors">
               {cat.name}
             </span>
           </Link>
        )})}
      </div>
    </section>
  );
}
