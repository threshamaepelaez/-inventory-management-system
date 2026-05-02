import { Response } from 'express';
import { Op } from 'sequelize';
import Product from '../models/Product';
import InventoryLog from '../models/InventoryLog';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

interface DashboardStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  categoryCount: number;
}

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get total products count
    const totalProducts = await Product.count();

    // Get total stock value (sum of quantity * price)
    const products = await Product.findAll({
      attributes: ['quantity', 'price'],
    });
    
    const totalStockValue = products.reduce((sum, product) => {
      const quantity = Number(product.quantity) || 0;
      const price = Number(product.price) || 0;
      return sum + (quantity * price);
    }, 0);

    // Get low stock count (quantity < 10)
    const lowStockCount = await Product.count({
      where: {
        quantity: {
          [Op.lt]: 10,
        },
      },
    });

    // Get unique category count
    const categories = await Product.findAll({
      attributes: ['category'],
      where: {
        category: {
          [Op.ne]: null,
        },
      },
      group: ['category'],
    });
    
    const categoryCount = categories.length;

    const stats: DashboardStats = {
      totalProducts,
      totalStockValue: Math.round(totalStockValue * 100) / 100, // Round to 2 decimal places
      lowStockCount,
      categoryCount,
    };

    console.log('=== DASHBOARD STATS ===');
    console.log('Stats:', stats);
    console.log('========================');

    res.status(200).json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await InventoryLog.findAll({
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'quantity', 'price'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    console.log('=== INVENTORY LOGS ===');
    console.log('Total logs:', logs.length);
    console.log('======================');

    res.status(200).json({
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Get inventory logs error:', error);
    // For now, return empty array since inventory_logs table may not exist
    console.log('Returning empty array for inventory logs');
    res.status(200).json({
      logs: [],
      count: 0,
    });
  }
};