export type Role = 'admin' | 'manager' | 'user';
export type Category = 'electronics' | 'clothing' | 'books' | 'sports';

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  stock: number;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export type WsMessageType =
  | 'AUTH'
  | 'AUTH_SUCCESS'
  | 'AUTH_ERROR'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'PRICE_CHANGED'
  | 'STOCK_CHANGED'
  | 'PING'
  | 'PONG';

export interface WsMessage<T = unknown> {
  type: WsMessageType;
  payload?: T;
  timestamp: string;
  userId?: string;
  role?: Role;
}

export type SortOption =
  | 'price_asc'
  | 'price_desc'
  | 'name_asc'
  | 'name_desc'
  | 'created_asc'
  | 'created_desc';

export interface ProductFilters {
  category?: Category | '';
  sort?: SortOption;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  category: Category;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}
