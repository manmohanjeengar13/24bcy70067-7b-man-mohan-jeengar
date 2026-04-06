import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in environment variables');

  await mongoose.connect(uri);
  console.log('✅ MongoDB connected successfully');
}

export async function testConnection(): Promise<void> {
  try {
    await connectDB();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}
