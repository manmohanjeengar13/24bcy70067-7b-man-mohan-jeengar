import { Router } from 'express';
import { getAllUsers, getUserById, changeUserRole, deleteUser } from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.get('/', authenticate, requireRole('admin'), getAllUsers);
router.get('/:id', authenticate, requireRole('admin'), getUserById);
router.patch('/:id/role', authenticate, requireRole('admin'), changeUserRole);
router.delete('/:id', authenticate, requireRole('admin'), deleteUser);

export default router;
