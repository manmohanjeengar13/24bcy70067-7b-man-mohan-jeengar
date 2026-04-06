import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ProductModel } from '../config/schema';
import { sendSuccess, sendError } from '../utils/response';
import { Category } from '../types';
import { broadcast } from '../utils/broadcast';

const VALID_CATEGORIES: Category[] = ['electronics', 'clothing', 'books', 'sports'];

function toProduct(doc: InstanceType<typeof ProductModel>) {
  return {
    id: String(doc._id),
    name: doc.name,
    price: doc.price,
    category: doc.category,
    stock: doc.stock,
    description: doc.description ?? null,
    created_by: doc.created_by,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  };
}

export async function getAllProducts(req: Request, res: Response): Promise<void> {
  try {
    const { category, sort } = req.query;

    const filter: Record<string, unknown> = {};
    if (category && VALID_CATEGORIES.includes(category as Category)) {
      filter.category = category;
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price_asc:    { price: 1 },
      price_desc:   { price: -1 },
      name_asc:     { name: 1 },
      name_desc:    { name: -1 },
      created_asc:  { createdAt: 1 },
      created_desc: { createdAt: -1 },
    };
    const sortOption = sortMap[sort as string] ?? { createdAt: -1 };

    const docs = await ProductModel.find(filter).sort(sortOption);
    sendSuccess(res, { products: docs.map(toProduct) }, 'Products retrieved');
  } catch (error) {
    console.error('getAllProducts error:', error);
    sendError(res, 'Failed to fetch products', 500);
  }
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      sendError(res, 'Invalid product id', 400);
      return;
    }
    const doc = await ProductModel.findById(req.params.id);
    if (!doc) {
      sendError(res, 'Product not found', 404);
      return;
    }
    sendSuccess(res, { product: toProduct(doc) }, 'Product retrieved');
  } catch (error) {
    console.error('getProductById error:', error);
    sendError(res, 'Failed to fetch product', 500);
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const { name, price, category, stock, description } = req.body;

    if (!name || price === undefined || !category || stock === undefined) {
      sendError(res, 'name, price, category, and stock are required', 400);
      return;
    }
    if (!VALID_CATEGORIES.includes(category)) {
      sendError(res, `category must be one of: ${VALID_CATEGORIES.join(', ')}`, 400);
      return;
    }
    if (isNaN(Number(price)) || Number(price) < 0) {
      sendError(res, 'price must be a non-negative number', 400);
      return;
    }
    if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
      sendError(res, 'stock must be a non-negative integer', 400);
      return;
    }

    const doc = await ProductModel.create({
      name,
      price: Number(price),
      category,
      stock: Number(stock),
      description: description ?? null,
      created_by: req.user!.userId,
    });

    const product = toProduct(doc);

    broadcast({
      type: 'PRODUCT_CREATED',
      payload: product,
      timestamp: new Date().toISOString(),
      userId: req.user!.userId,
      role: req.user!.role,
    });

    sendSuccess(res, { product }, 'Product created', 201);
  } catch (error) {
    console.error('createProduct error:', error);
    sendError(res, 'Failed to create product', 500);
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      sendError(res, 'Invalid product id', 400);
      return;
    }
    const existing = await ProductModel.findById(id);
    if (!existing) {
      sendError(res, 'Product not found', 404);
      return;
    }

    const { name, price, category, stock, description } = req.body;

    if (category && !VALID_CATEGORIES.includes(category)) {
      sendError(res, `category must be one of: ${VALID_CATEGORIES.join(', ')}`, 400);
      return;
    }

    const oldPrice = existing.price;
    const oldStock = existing.stock;

    if (name !== undefined) existing.name = name;
    if (price !== undefined) existing.price = Number(price);
    if (category !== undefined) existing.category = category;
    if (stock !== undefined) existing.stock = Number(stock);
    if (description !== undefined) existing.description = description;

    await existing.save();
    const product = toProduct(existing);

    broadcast({ type: 'PRODUCT_UPDATED', payload: product, timestamp: new Date().toISOString(), userId: req.user!.userId, role: req.user!.role });

    if (price !== undefined && Number(price) !== oldPrice) {
      broadcast({ type: 'PRICE_CHANGED', payload: { product, oldPrice, newPrice: Number(price) }, timestamp: new Date().toISOString(), userId: req.user!.userId, role: req.user!.role });
    }
    if (stock !== undefined && Number(stock) !== oldStock) {
      broadcast({ type: 'STOCK_CHANGED', payload: { product, oldStock, newStock: Number(stock) }, timestamp: new Date().toISOString(), userId: req.user!.userId, role: req.user!.role });
    }

    sendSuccess(res, { product }, 'Product updated');
  } catch (error) {
    console.error('updateProduct error:', error);
    sendError(res, 'Failed to update product', 500);
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      sendError(res, 'Invalid product id', 400);
      return;
    }
    const doc = await ProductModel.findByIdAndDelete(id);
    if (!doc) {
      sendError(res, 'Product not found', 404);
      return;
    }

    broadcast({ type: 'PRODUCT_DELETED', payload: { id, name: doc.name }, timestamp: new Date().toISOString(), userId: req.user!.userId, role: req.user!.role });

    sendSuccess(res, { id }, 'Product deleted');
  } catch (error) {
    console.error('deleteProduct error:', error);
    sendError(res, 'Failed to delete product', 500);
  }
}