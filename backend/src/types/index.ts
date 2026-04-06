export type Role = 'admin' | 'manager' | 'user';

export type Category = 'electronics' | 'clothing' | 'books' | 'sports';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  stock: number;
  description: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CartItem {
  product_id: string;
  quantity: number;
  price: number;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  total_items: number;
  total_price: number;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
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

// Augment Express
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
