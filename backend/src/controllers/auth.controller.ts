import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel, RefreshTokenModel } from '../config/schema';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { Role, UserPublic } from '../types';

function toUserPublic(doc: InstanceType<typeof UserModel>): UserPublic {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role as Role,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      sendError(res, 'Name, email, and password are required', 400);
      return;
    }
    if (password.length < 6) {
      sendError(res, 'Password must be at least 6 characters', 400);
      return;
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      sendError(res, 'Email already registered', 409);
      return;
    }

    const role: Role = 'user';

    const password_hash = await bcrypt.hash(password, 12);
    const userDoc = await UserModel.create({ name, email, password_hash, role });
    const user = toUserPublic(userDoc);
    const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });

    await RefreshTokenModel.create({
      user_id: user.id,
      token: tokens.refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    sendSuccess(res, { user, tokens }, 'Account created successfully', 201);
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, 'Registration failed', 500);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      sendError(res, 'Email and password are required', 400);
      return;
    }

    const userDoc = await UserModel.findOne({ email: email.toLowerCase() });
    if (!userDoc) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const passwordValid = await bcrypt.compare(password, userDoc.password_hash);
    if (!passwordValid) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const user = toUserPublic(userDoc);
    const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });

    await RefreshTokenModel.create({
      user_id: user.id,
      token: tokens.refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    sendSuccess(res, { user, tokens }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Login failed', 500);
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      sendError(res, 'Refresh token is required', 400);
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      sendError(res, 'Invalid or expired refresh token', 401);
      return;
    }

    const tokenDoc = await RefreshTokenModel.findOne({
      token: refreshToken,
      expires_at: { $gt: new Date() },
    });
    if (!tokenDoc) {
      sendError(res, 'Refresh token not found or expired', 401);
      return;
    }

    const userDoc = await UserModel.findById(payload.userId);
    if (!userDoc) {
      sendError(res, 'User not found', 401);
      return;
    }

    const newTokens = generateTokens({ userId: String(userDoc._id), email: userDoc.email, role: userDoc.role as Role });

    await RefreshTokenModel.deleteOne({ token: refreshToken });
    await RefreshTokenModel.create({
      user_id: String(userDoc._id),
      token: newTokens.refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Return BOTH tokens so the client can persist the rotated refresh token
    sendSuccess(res, { tokens: { accessToken: newTokens.accessToken, refreshToken: newTokens.refreshToken } }, 'Token refreshed');
  } catch (error) {
    console.error('Refresh error:', error);
    sendError(res, 'Token refresh failed', 500);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshTokenModel.deleteOne({ token: refreshToken });
    }
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, 'Logout failed', 500);
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const userDoc = await UserModel.findById(req.user!.userId);
    if (!userDoc) {
      sendError(res, 'User not found', 404);
      return;
    }
    sendSuccess(res, { user: toUserPublic(userDoc) }, 'Profile retrieved');
  } catch (error) {
    console.error('Me error:', error);
    sendError(res, 'Failed to get profile', 500);
  }
}