import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Role, Category } from '../types';

// ─── User ───────────────────────────────────────────────────────────────────

export interface IUser extends Document {
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'user'], default: 'user' },
  },
  { timestamps: true }
);

export const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// ─── Refresh Token ───────────────────────────────────────────────────────────

export interface IRefreshToken extends Document {
  user_id: string;
  token: string;
  expires_at: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    user_id: { type: String, required: true, ref: 'User' },
    token: { type: String, required: true, unique: true },
    expires_at: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-delete expired tokens via MongoDB TTL index
RefreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel: Model<IRefreshToken> =
  mongoose.models.RefreshToken || mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);

// ─── Product ──────────────────────────────────────────────────────────────────

export interface IProduct extends Document {
  name: string;
  price: number;
  category: Category;
  stock: number;
  description?: string | null;
  created_by: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, maxlength: 255 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: ['electronics', 'clothing', 'books', 'sports'], required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    description: { type: String, default: null },
    created_by: { type: String, required: true, ref: 'User' },
  },
  { timestamps: true }
);

export const ProductModel: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface ICartItem {
  product_id: string;
  quantity: number;
  price: number;
}

export interface ICart extends Document {
  user_id: string;
  items: ICartItem[];
  total_items: number;
  total_price: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product_id: { type: String, required: true, ref: 'Product' },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    user_id: { type: String, required: true, unique: true, ref: 'User' },
    items: [CartItemSchema],
    total_items: { type: Number, default: 0, min: 0 },
    total_price: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const CartModel: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);

// ─── Seed ────────────────────────────────────────────────────────────────────

export async function initializeSchema(): Promise<void> {
  const count = await UserModel.countDocuments();
  if (count > 0) {
    console.log('ℹ️  Seed data already exists, skipping...');
    return;
  }

  const adminHash = await bcrypt.hash('admin123', 12);
  const managerHash = await bcrypt.hash('manager123', 12);
  const userHash = await bcrypt.hash('user123', 12);

  const admin = await UserModel.create({ name: 'Admin User', email: 'admin@example.com', password_hash: adminHash, role: 'admin' });
  const manager = await UserModel.create({ name: 'Manager User', email: 'manager@example.com', password_hash: managerHash, role: 'manager' });
  await UserModel.create({ name: 'Regular User', email: 'user@example.com', password_hash: userHash, role: 'user' });

  const products = [
    { name: 'MacBook Pro 16"', price: 2499.99, category: 'electronics', stock: 15, description: 'Apple M3 Pro chip, 18GB RAM, 512GB SSD', created_by: admin._id },
    { name: 'Sony WH-1000XM5', price: 349.99, category: 'electronics', stock: 42, description: 'Industry-leading noise canceling wireless headphones', created_by: manager._id },
    { name: 'Nike Air Max 270', price: 149.99, category: 'clothing', stock: 78, description: 'Lifestyle shoes with large Air unit for all-day comfort', created_by: manager._id },
    { name: 'The Pragmatic Programmer', price: 49.99, category: 'books', stock: 120, description: '20th Anniversary Edition — From Journeyman to Master', created_by: admin._id },
    { name: 'Yoga Mat Premium', price: 89.99, category: 'sports', stock: 55, description: 'Non-slip, eco-friendly 6mm thick yoga mat', created_by: manager._id },
    { name: 'Clean Code', price: 39.99, category: 'books', stock: 95, description: 'A Handbook of Agile Software Craftsmanship by Robert C. Martin', created_by: admin._id },
  ];

  await ProductModel.insertMany(products);
  console.log('✅ Seed data inserted successfully');
}
