// Product Types
export interface Product {
  id: string;
  category_id: string | null;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  stock_qty: number;
  is_active: boolean;
  rating_avg?: number;
  rating_count?: number;
  sold_count?: number;
  created_at: string;
  updated_at: string | null;
  category?: Category;
  brand?: { id: string; name: string; slug: string };
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
  product_attributes?: ProductAttribute[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_sku: string;
  price: number;
  compare_at_price: number | null;
  cost: number | null;
  stock_qty: number;
  is_active: boolean;
  variant_option_values?: VariantOptionValue[];
}

export interface VariantOptionValue {
  variant_id: string;
  option_value_id: string;
  option_value: OptionValue;
}

export interface ProductAttribute {
  product_id: string;
  option_id: string;
  option_value_id: string;
  option: Option;
  option_value: OptionValue;
}

// Category Types
export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  image_url?: string;
  children?: Category[];
  _count?: { products: number };
}

// Option Types
export interface Option {
  id: string;
  name: string;
  code: string;
}

export interface OptionValue {
  id: string;
  option_id: string;
  value: string;
  sort_order: number;
  option?: Option;
}

// Cart Types
export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
}

export interface CartItem {
  id: string;
  variant_id: string;
  qty: number;
  price: number;
  stock_qty: number;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  };
  options: { name: string; value: string }[];
  line_total: number;
}

// Order Types
export interface Order {
  id: string;
  order_code: string;
  user_id: string | null;
  status: OrderStatus;
  subtotal: number;
  discount_total: number;
  shipping_fee: number;
  grand_total: number;
  customer_name: string;
  customer_phone: string;
  ship_address_line1: string;
  ship_address_line2: string | null;
  ship_city: string;
  ship_province: string;
  ship_postal_code: string | null;
  ship_country: string;
  note: string | null;
  created_at: string;
  updated_at: string | null;
  order_items?: OrderItem[];
  payments?: Payment[];
  shipments?: Shipment[];
}

export type OrderStatus = 
  | 'pending' 
  | 'paid' 
  | 'processing' 
  | 'shipped' 
  | 'completed' 
  | 'cancelled' 
  | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  sku: string;
  name: string;
  options_text: string | null;
  unit_price: number;
  qty: number;
  line_total: number;
  product?: Product;
}

export interface Payment {
  id: string;
  order_id: string;
  method: string;
  status: string;
  amount: number;
  transaction_ref: string | null;
  paid_at: string | null;
}

export interface Shipment {
  id: string;
  order_id: string;
  carrier: string | null;
  tracking_code: string | null;
  status: string;
  shipped_at: string | null;
  delivered_at: string | null;
}

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  province: string | null;
  avatar_url: string | null;
  role: 'customer' | 'admin';
  status: 'active' | 'blocked';
  two_factor_enabled?: boolean;
  created_at: string;
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { message: string };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: ChatProduct[];
  orders?: ChatOrder[];
  quickReplies?: string[];
  isTyping?: boolean;
  timestamp: Date;
}

export interface ChatProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  stock_qty: number;
  category?: string;
  is_new?: boolean;
}

export interface ChatOrder {
  code: string;
  status: string;
  total: string; // Formatted price
  date: string;
  items: string;
  timeline?: { step: string; completed: boolean; current: boolean }[];
}

// Banner Types
export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  button_text: string | null;
  position: string;
  sort_order: number;
  banner_images?: { image_url: string; sort_order: number }[];
}
