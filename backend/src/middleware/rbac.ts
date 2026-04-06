import { Request, Response, NextFunction } from 'express';
import { Role } from '../types';
import { sendError } from '../utils/response';

const ROLE_HIERARCHY: Record<Role, number> = {
  user: 1,
  manager: 2,
  admin: 3,
};

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'Forbidden: insufficient permissions', 403);
      return;
    }

    next();
  };
}

export function hasMinRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    if (ROLE_HIERARCHY[req.user.role] < ROLE_HIERARCHY[minRole]) {
      sendError(res, `Forbidden: requires ${minRole} role or higher`, 403);
      return;
    }

    next();
  };
}
