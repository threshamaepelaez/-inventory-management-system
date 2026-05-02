import { Router } from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Dashboard stats endpoint - requires authentication
router.get('/stats', authenticate, getDashboardStats);

// Inventory logs endpoint - requires authentication
router.get('/logs', authenticate, async (req, res) => {
  try {
    const logs = await sequelize.query(
      'SELECT il.*, p.name as product_name, u.name as user_name FROM inventory_logs il LEFT JOIN products p ON il.product_id = p.id LEFT JOIN users u ON il.user_id = u.id ORDER BY il.created_at DESC LIMIT 20',
      { type: QueryTypes.SELECT }
    );

    res.json(logs);
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

export default router;