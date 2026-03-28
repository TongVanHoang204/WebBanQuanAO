import React from 'react';
import Lottie from 'lottie-react';
import runningCatAnimation from '../../assets/running-cat-animation.json';

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
      <div className="relative">
        <div className="absolute inset-0 scale-150 rounded-full bg-gradient-to-r from-amber-300/30 via-orange-300/25 to-rose-300/20 blur-2xl" />

        <div className="relative h-40 w-40">
          <div className="absolute inset-x-6 bottom-3 h-4 rounded-full bg-secondary-200/70 blur-md dark:bg-secondary-700/60" />
          <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-800">
            <div
              className="h-full w-20 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent"
              style={{ animation: 'track-run 1.1s linear infinite' }}
            />
          </div>

          <div className="absolute inset-0">
            <Lottie
              animationData={runningCatAnimation}
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm font-medium text-secondary-600 dark:text-secondary-400">
        {message}
      </p>

      <div className="mt-2 text-xs tracking-[0.22em] text-secondary-400 dark:text-secondary-500">
        MÈO MODE
      </div>

      <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-800">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500"
          style={{
            animation: 'shimmer 1.5s ease-in-out infinite',
            width: '50%'
          }}
        />
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }

        @keyframes track-run {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
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
