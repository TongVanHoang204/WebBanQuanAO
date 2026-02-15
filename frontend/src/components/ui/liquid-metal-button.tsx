import React from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';

interface LiquidMetalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  viewMode?: 'default' | 'icon';
  isOpen?: boolean;
}

export const LiquidMetalButton: React.FC<LiquidMetalButtonProps> = ({
  label = 'Get Started',
  viewMode = 'default',
  isOpen = false,
  className = '',
  ...props
}) => {
  // Using a unique ID for the filter to avoid conflicts
  const filterId = `liquid-metal-filter-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`relative inline-block ${className}`}>
      {/* SVG Filter Definition - using inline style for 0 size to ensure it's in DOM but invisible, avoiding 'hidden' (display:none) issues */}
      <svg className="absolute w-0 h-0" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <button
        className={`
          relative z-10 flex items-center justify-center 
          bg-stone-950 text-white 
          transition-all duration-300
          group
          shadow-xl
          ${viewMode === 'icon' 
            ? 'w-14 h-14 rounded-full' 
            : 'px-8 py-4 rounded-full font-bold text-lg tracking-wider uppercase'}
        `}
        style={{
          filter: `url(#${filterId})`,
          WebkitFilter: `url(#${filterId})`, // Safari support
        }}
        {...props}
      >
        {/* Liquid Blobs Background - Animated via CSS */}
        <div className="absolute inset-0 overflow-hidden rounded-full bg-stone-950">
            <div className={`
                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                w-[180%] h-[180%]
                bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600
                opacity-60 group-hover:opacity-100 transition-opacity duration-500
                animate-spin-slow blur-md
            `} />
             <div className="absolute top-0 left-0 w-full h-full bg-black/40 backdrop-blur-[2px] z-0" />
        </div>

        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {viewMode === 'icon' ? (
            isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />
          ) : (
            <>
              {label}
              <Sparkles className="w-4 h-4" />
            </>
          )}
        </span>
        
        {/* Shine Effect */}
        <div className="absolute inset-0 rounded-full ring-1 ring-white/10 group-hover:ring-white/30 transition-all z-20 pointer-events-none" />
      </button>

      {/* Global CSS for spin animation if not present */}
      <style>{`
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  );
};
