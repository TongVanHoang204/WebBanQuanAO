import { useEffect, useState, useRef } from 'react';

interface NumberCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  separator?: string;
}

export function NumberCounter({
  value,
  duration = 1.5,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  separator = ',',
}: NumberCounterProps) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>();
  const startValueRef = useRef(0);
  
  // Format helper
  const formatNumber = (num: number) => {
    // Round to decimals
    const fixed = num.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    
    // Add separator to integer part
    // Using regex for thousands separator
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    
    return decPart ? `${intFormatted}.${decPart}` : intFormatted;
  };

  useEffect(() => {
    startValueRef.current = count;
    startTimeRef.current = null;
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      const progressSeconds = progress / 1000;
      
      if (progressSeconds < duration) {
        // Ease out quart: 1 - (1 - t) ^ 4
        const t = progressSeconds / duration;
        const ease = 1 - Math.pow(1 - t, 4);
        
        const currentCount = startValueRef.current + (value - startValueRef.current) * ease;
        setCount(currentCount);
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
}
