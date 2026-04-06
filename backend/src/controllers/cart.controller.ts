import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CartModel, ProductModel } from '../config/schema';
import { sendSuccess, sendError } from '../utils/response';

function toCart(doc: InstanceType<typeof CartModel>) {
  return {
    id: String(doc._id),
    user_id: doc.user_id,
    items: doc.items,
    total_items: doc.total_items,
    total_price: doc.total_price,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  };
}

export async function getCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    let cart = await CartModel.findOne({ user_id: userId });
    if (!cart) {
      cart = await CartModel.create({ user_id: userId, items: [], total_items: 0, total_price: 0 });
    }

    sendSuccess(res, { cart: toCart(cart) }, 'Cart retrieved');
  } catch (error) {
    console.error('getCart error:', error);
    sendError(res, 'Failed to fetch cart', 500);
  }
}

export async function addToCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity) {
      sendError(res, 'product_id and quantity are required', 400);
      return;
    }

    if (!mongoose.isValidObjectId(product_id)) {
      sendError(res, 'Invalid product_id', 400);
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      sendError(res, 'quantity must be a positive integer', 400);
      return;
    }

    // Check if product exists and has sufficient stock
    const product = await ProductModel.findById(product_id);
    if (!product) {
      sendError(res, 'Product not found', 404);
      return;
    }

    if (product.stock < quantity) {
      sendError(res, `Insufficient stock. Only ${product.stock} available.`, 400);
      return;
    }

    // Get or create cart
    let cart = await CartModel.findOne({ user_id: userId });
    if (!cart) {
      cart = await CartModel.create({ user_id: userId, items: [], total_items: 0, total_price: 0 });
    }

    // Check if product already in cart
    const existingItem = cart.items.find((item) => String(item.product_id) === String(product_id));
    if (existingItem) {
      // Update quantity
      existingItem.quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product_id: String(product_id),
        quantity,
        price: product.price,
      });
    }

    // Recalculate totals
    cart.total_items = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.total_price = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await cart.save();
    sendSuccess(res, { cart: toCart(cart) }, 'Item added to cart', 201);
  } catch (error) {
    console.error('addToCart error:', error);
    sendError(res, 'Failed to add item to cart', 500);
  }
}

export async function updateCartItem(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      sendError(res, 'Invalid product_id', 400);
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      sendError(res, 'quantity must be a positive integer', 400);
      return;
    }

    // Check if product exists and has sufficient stock
    const product = await ProductModel.findById(productId);
    if (!product) {
      sendError(res, 'Product not found', 404);
      return;
    }

    if (product.stock < quantity) {
      sendError(res, `Insufficient stock. Only ${product.stock} available.`, 400);
      return;
    }

    const cart = await CartModel.findOne({ user_id: userId });
    if (!cart) {
      sendError(res, 'Cart not found', 404);
      return;
    }

    const item = cart.items.find((i) => String(i.product_id) === String(productId));
    if (!item) {
      sendError(res, 'Item not found in cart', 404);
      return;
    }

    item.quantity = quantity;

    // Recalculate totals
    cart.total_items = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    cart.total_price = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    await cart.save();
    sendSuccess(res, { cart: toCart(cart) }, 'Cart item updated');
  } catch (error) {
    console.error('updateCartItem error:', error);
    sendError(res, 'Failed to update cart item', 500);
  }
}

export async function removeFromCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      sendError(res, 'Invalid product_id', 400);
      return;
    }

    const cart = await CartModel.findOne({ user_id: userId });
    if (!cart) {
      sendError(res, 'Cart not found', 404);
      return;
    }

    const itemIndex = cart.items.findIndex((i) => String(i.product_id) === String(productId));
    if (itemIndex === -1) {
      sendError(res, 'Item not found in cart', 404);
      return;
    }

    cart.items.splice(itemIndex, 1);

    // Recalculate totals
    cart.total_items = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.total_price = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await cart.save();
    sendSuccess(res, { cart: toCart(cart) }, 'Item removed from cart');
  } catch (error) {
    console.error('removeFromCart error:', error);
    sendError(res, 'Failed to remove item from cart', 500);
  }
}

export async function clearCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const cart = await CartModel.findOne({ user_id: userId });
    if (!cart) {
      sendError(res, 'Cart not found', 404);
      return;
    }

    cart.items = [];
    cart.total_items = 0;
    cart.total_price = 0;

    await cart.save();
    sendSuccess(res, { cart: toCart(cart) }, 'Cart cleared');
  } catch (error) {
    console.error('clearCart error:', error);
    sendError(res, 'Failed to clear cart', 500);
  }
}
