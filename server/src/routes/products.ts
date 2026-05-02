import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getInventoryLogs,
} from '../controllers/productController';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage
});

// Public routes (authenticated)
router.get('/', authenticate, getAllProducts);
router.get('/low-stock', authenticate, isAdmin, getLowStockProducts);
router.get('/stats', authenticate, getDashboardStats);
router.get('/inventory/logs', authenticate, getInventoryLogs);
router.get('/:id', authenticate, getProductById);

// Admin only routes
router.post('/', authenticate, isAdmin, upload.any(), createProduct);
router.put('/:id', authenticate, isAdmin, upload.any(), updateProduct);
router.delete('/:id', authenticate, isAdmin, deleteProduct);

export default router;