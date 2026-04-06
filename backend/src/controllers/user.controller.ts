import { Request, Response } from 'express';
import { UserModel } from '../config/schema';
import { sendSuccess, sendError } from '../utils/response';
import { Role, UserPublic } from '../types';
import mongoose from 'mongoose';

const VALID_ROLES: Role[] = ['admin', 'manager', 'user'];

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

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      sendError(res, 'Invalid user id', 400);
      return;
    }

    const doc = await UserModel.findById(id);

    if (!doc) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, { user: toUserPublic(doc) }, 'User retrieved');
  } catch (error) {
    console.error('getUserById error:', error);
    sendError(res, 'Failed to fetch user', 500);
  }
}


export async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    const docs = await UserModel.find().sort({ createdAt: -1 });

    sendSuccess(
      res,
      { users: docs.map(toUserPublic) },
      'Users retrieved'
    );
  } catch (error) {
    console.error('getAllUsers error:', error);
    sendError(res, 'Failed to fetch users', 500);
  }
}



export async function changeUserRole(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !VALID_ROLES.includes(role)) {
      sendError(res, `role must be one of: ${VALID_ROLES.join(', ')}`, 400);
      return;
    }
    if (id === req.user!.userId && role !== 'admin') {
      sendError(res, 'Cannot change your own role', 403);
      return;
    }

    const doc = await UserModel.findByIdAndUpdate(id, { role }, { new: true });
    if (!doc) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, { user: toUserPublic(doc) }, 'User role updated');
  } catch (error) {
    console.error('changeUserRole error:', error);
    sendError(res, 'Failed to change user role', 500);
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (id === req.user!.userId) {
      sendError(res, 'Cannot delete your own account', 403);
      return;
    }

    const doc = await UserModel.findByIdAndDelete(id);
    if (!doc) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, { id }, 'User deleted');
  } catch (error) {
    console.error('deleteUser error:', error);
    sendError(res, 'Failed to delete user', 500);
  }
}
