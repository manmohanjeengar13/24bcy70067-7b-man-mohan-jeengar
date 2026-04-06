import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';
import { authenticate } from '../middleware/authenticate';
import { hasMinRole, requireRole } from '../middleware/rbac';

const router = Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', authenticate, hasMinRole('manager'), createProduct);
router.put('/:id', authenticate, hasMinRole('manager'), updateProduct);
router.delete('/:id', authenticate, requireRole('admin'), deleteProduct);

export default router;
