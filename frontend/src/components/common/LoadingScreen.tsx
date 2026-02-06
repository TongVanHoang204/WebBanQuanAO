import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../../assets/loading-animation.json';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Đang tải...', 
  fullScreen = true 
}) => {
  const containerClass = fullScreen 
    ? 'fixed inset-0 z-50 bg-white dark:bg-secondary-900' 
    : 'w-full py-20';

  return (
    <div className={`${containerClass} flex flex-col items-center justify-center`}>
      {/* Animated Lottie Sticker */}
      <div className="relative">
        {/* Glow effect behind animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 via-pink-400/20 to-purple-400/20 rounded-full blur-2xl scale-150 animate-pulse"></div>
        
        {/* Lottie Animation */}
        <div className="relative w-32 h-32">
          <Lottie 
            animationData={loadingAnimation}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* Loading text */}
      <p className="mt-6 text-secondary-600 dark:text-secondary-400 text-sm font-medium animate-pulse">
        {message}
      </p>

      {/* Animated gradient bar */}
      <div className="mt-4 w-48 h-1 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary-500 via-pink-500 to-purple-500 rounded-full"
          style={{
            animation: 'shimmer 1.5s ease-in-out infinite',
            width: '50%'
          }}
        />
      </div>
      
      {/* Custom CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};

// Skeleton loading for cards
export const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-secondary-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
    <div className="aspect-square bg-secondary-200 dark:bg-secondary-700"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
      <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2"></div>
      <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-1/3"></div>
    </div>
  </div>
);

// Skeleton loading for lists
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-secondary-800 rounded-lg animate-pulse">
        <div className="w-12 h-12 bg-secondary-200 dark:bg-secondary-700 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
          <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2"></div>
        </div>
        <div className="w-20 h-8 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
      </div>
    ))}
  </div>
);

// Inline spinner for buttons
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  return (
    <div className={`${sizeClasses[size]} border-primary-200 border-t-primary-600 rounded-full animate-spin ${className}`}></div>
  );
};

export default LoadingScreen;
