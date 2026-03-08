import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 12;

interface RecentlyViewedProduct {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  compare_at_price: number | null;
  image_url: string;
  category_name?: string;
  has_stock: boolean;
  viewed_at: number;
}

function getStoredProducts(): RecentlyViewedProduct[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveProducts(products: RecentlyViewedProduct[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Failed to save recently viewed products:', e);
  }
}

export function useRecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState<RecentlyViewedProduct[]>(getStoredProducts);

  // Re-sync from localStorage on mount
  useEffect(() => {
    setRecentProducts(getStoredProducts());
  }, []);

  const addProduct = useCallback((product: Product) => {
    const primaryImage = product.product_images?.find(img => img.is_primary)?.url
      || product.product_images?.[0]?.url
      || '/placeholder.jpg';

    const hasStock = product.product_variants?.some(v => v.stock_qty > 0) ?? true;

    const minPrice = product.product_variants?.length
      ? Math.min(...product.product_variants.map(v => Number(v.price)))
      : Number(product.base_price);

    const entry: RecentlyViewedProduct = {
      id: product.id.toString(),
      name: product.name,
      slug: product.slug,
      base_price: minPrice,
      compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
      image_url: primaryImage,
      category_name: product.category?.name,
      has_stock: hasStock,
      viewed_at: Date.now()
    };

    setRecentProducts(prev => {
      // Remove existing entry for same product, then prepend
      const filtered = prev.filter(p => p.id !== entry.id);
      const updated = [entry, ...filtered].slice(0, MAX_ITEMS);
      saveProducts(updated);
      return updated;
    });
  }, []);

  // Convert stored items to Product-like objects for ProductCard
  const getProductProps = useCallback((): Product[] => {
    return recentProducts.map(p => ({
      id: p.id,
      category_id: null,
      sku: '',
      name: p.name,
      slug: p.slug,
      description: null,
      base_price: p.base_price,
      compare_at_price: p.compare_at_price,
      is_active: true,
      created_at: new Date(p.viewed_at).toISOString(),
      updated_at: null,
      category: p.category_name ? { id: '', parent_id: null, name: p.category_name, slug: '', is_active: true, sort_order: 0 } : undefined,
      product_images: [{
        id: '',
        product_id: p.id,
        url: p.image_url,
        alt_text: p.name,
        is_primary: true,
        sort_order: 0
      }],
      product_variants: [{
        id: '',
        product_id: p.id,
        variant_sku: '',
        price: p.base_price,
        compare_at_price: p.compare_at_price,
        cost: null,
        stock_qty: p.has_stock ? 1 : 0,
        is_active: true
      }]
    }));
  }, [recentProducts]);

  return { recentProducts, addProduct, getProductProps };
}
