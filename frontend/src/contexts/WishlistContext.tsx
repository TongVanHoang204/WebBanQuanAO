import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { wishlistAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

// Matches the exact backend response shape from wishlist.controller.ts
export interface WishlistItem {
  id: string; // product_id from backend
  wishlist_item_id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  product_images: { id: string; product_id: string; url: string; alt_text: string | null; is_primary: boolean; sort_order: number }[];
  product_variants: { id: string; price: number; compare_at_price: number | null; stock_qty: number }[];
  added_at: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
        setLoading(true);
        const res = await wishlistAPI.get();
        if (res.data.success) {
            setWishlist(res.data.data);
        }
    } catch (error) {
        console.error('Failed to fetch wishlist', error);
    } finally {
        setLoading(false);
    }
  };

  const addToWishlist = async (productId: string) => {
    if (!isAuthenticated) {
        toast.error('Vui lòng đăng nhập để sử dụng tính năng này');
        return;
    }
    try {
        const res = await wishlistAPI.add(productId);
        if (res.data.success) {
            toast.success('Đã thêm vào yêu thích');
            fetchWishlist();
        }
    } catch (error) {
        toast.error('Không thể thêm vào yêu thích');
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
        const res = await wishlistAPI.remove(productId);
        if (res.data.success) {
            toast.success('Đã xóa khỏi yêu thích');
            setWishlist(prev => prev.filter(item => item.id !== productId));
        }
    } catch (error) {
        toast.error('Không thể xóa khỏi yêu thích');
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
