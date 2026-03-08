import { Link } from 'react-router-dom';

export default function CategoryGrid() {
  const bentoCategories = [
    {
      title: 'THỜI TRANG NỮ',
      link: '/shop?category=thoi-trang-nu',
      image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&q=80&w=800',
      className: 'md:col-span-1 md:row-span-2',
      textAlign: 'center'
    },
    {
      title: 'TÚI',
      link: '/shop?category=phu-kien-tui',
      image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=800',
      className: 'md:col-span-2 md:row-span-1',
      textAlign: 'left'
    },
    {
      title: 'MŨ',
      link: '/shop?category=phu-kien-mu',
      image: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?auto=format&fit=crop&q=80&w=400',
      className: 'md:col-span-1 md:row-span-1',
      textAlign: 'center'
    },
    {
      title: 'THỜI TRANG NAM',
      link: '/shop?category=thoi-trang-nam',
      image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800',
      className: 'md:col-span-2 md:row-span-1',
      textAlign: 'left'
    },
    {
      title: 'PHỤ KIỆN KHÁC',
      link: '/shop?category=phu-kien-khac',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=400',
      className: 'md:col-span-1 md:row-span-1',
      textAlign: 'center'
    }
  ];

  return (
    <section className="py-20 px-4 container-custom bg-white dark:bg-black">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px] md:auto-rows-[300px]">
        {bentoCategories.map((cat, idx) => (
          <Link
            key={idx}
            to={cat.link}
            className={`group relative overflow-hidden rounded-xl bg-gray-100 ${cat.className}`}
          >
            <img 
              src={cat.image} 
              alt={cat.title} 
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark overlay for contrast */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
            
            <div className={`absolute inset-0 p-8 flex flex-col justify-center ${cat.textAlign === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
              <h3 className="text-2xl md:text-3xl font-serif text-white tracking-wider" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}>
                {cat.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
