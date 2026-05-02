import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();

// Public routes (authenticated) - get all categories
router.get('/', authenticate, getAllCategories);
router.get('/:id', authenticate, getCategoryById);

// Admin only routes
router.post('/', authenticate, isAdmin, createCategory);
router.put('/:id', authenticate, isAdmin, updateCategory);
router.delete('/:id', authenticate, isAdmin, deleteCategory);

export default router;