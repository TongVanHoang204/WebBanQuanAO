import { useState, useCallback, useRef, useEffect } from 'react';
import { Product, Category, ProductsResponse } from '../types';
import { productsAPI, categoriesAPI, brandsAPI } from '../services/api';

interface UseShopReturn {
  products: Product[];
  categories: Category[];
  brands: any[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  fetchProducts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    sort?: string;
    min_price?: number;
    max_price?: number;
    on_sale?: boolean;
    min_discount?: number;
  }) => Promise<void>;
  fetchProductBySlug: (slug: string) => Promise<Product | null>;
  fetchCategories: () => Promise<void>;
  fetchBrands: () => Promise<void>;
  searchProducts: (query: string) => Promise<Product[]>;
  resetError: () => void;
}

export function useShop(): UseShopReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (searchAbortControllerRef.current) searchAbortControllerRef.current.abort();
    };
  }, []);

  const fetchProducts = useCallback(async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    sort?: string;
    min_price?: number;
    max_price?: number;
    on_sale?: boolean;
    min_discount?: number;
  }) => {
    // Cancel previous request
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    try {
      const response = await productsAPI.getAll(params, controller.signal);
      const data = response.data.data as ProductsResponse;
      setProducts(data.products || []);
      setPagination(data.pagination || null);
    } catch (err: any) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(err.response?.data?.error?.message || 'Failed to fetch products');
        console.error('Fetch products error:', err);
      }
    } finally {
      // Only set loading false if this is the active request
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchProductBySlug = useCallback(async (slug: string): Promise<Product | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productsAPI.getBySlug(slug);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Product not found');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const response = await brandsAPI.getPublic();
      setBrands(response.data.data.brands || []);
    } catch (err: any) {
      console.error('Failed to fetch brands:', err);
    }
  }, []);

  const searchProducts = useCallback(async (query: string): Promise<Product[]> => {
    if (query.length < 2) return [];

    // Cancel previous search
    if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortControllerRef.current = controller;

    setIsSearching(true);
    try {
      const response = await productsAPI.search(query, controller.signal);
      return response.data.data || [];
    } catch (err: any) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          console.error('Search failed:', err);
      }
      return [];
    } finally {
        if (searchAbortControllerRef.current === controller) {
             setIsSearching(false);
        }
    }
  }, []);

  const resetError = useCallback(() => setError(null), []);

  return {
    products,
    categories,
    brands,
    isLoading,
    isSearching,
    error,
    pagination,
    fetchProducts,
    fetchProductBySlug,
    fetchCategories,
    fetchBrands,
    searchProducts,
    resetError
  };
}

// Helper function to find variant ID based on selected options
export function findVariantId(
  variants: Product['product_variants'],
  selectedOptions: Record<string, string>
): string | null {
  if (!variants || variants.length === 0) return null;

  const matchingVariant = variants.find(variant => {
    if (!variant.variant_option_values) return false;
    
    return Object.entries(selectedOptions).every(([optionCode, selectedValue]) => {
      return variant.variant_option_values!.some(vov => {
        const optionCodeMatch = vov.option_value.option?.code === optionCode;
        const valueMatch = vov.option_value.value === selectedValue;
        return optionCodeMatch && valueMatch;
      });
    });
  });

  return matchingVariant?.id || null;
}

// Get unique options from variants
export function getVariantOptions(variants: Product['product_variants']): Record<string, string[]> {
  if (!variants) return {};
  
  const options: Record<string, Set<string>> = {};
  
  variants.forEach(variant => {
    if (!variant.variant_option_values) return;
    
    variant.variant_option_values.forEach(vov => {
      const code = vov.option_value.option?.code;
      const value = vov.option_value.value;
      
      if (code) {
        if (!options[code]) {
          options[code] = new Set();
        }
        options[code].add(value);
      }
    });
  });

  const result: Record<string, string[]> = {};
  Object.entries(options).forEach(([code, values]) => {
    result[code] = Array.from(values);
  });

  return result;
}

// Format price in VND
export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return '0 ₫';
  const numPrice = Number(price);
  if (isNaN(numPrice)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numPrice);
}

// Calculate discount percentage
export function getDiscountPercent(price: number, compareAtPrice: number | null): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
