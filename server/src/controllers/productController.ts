import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import Product from '../models/Product';
import InventoryLog from '../models/InventoryLog';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getAllProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // ============================================
    // READ CATEGORY FROM req.query.category
    // ============================================
    const { search, category, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: { [key: string]: any } = {};

    // Get category from query parameter
    const categoryParam = req.query.category as string;
    
    // ============================================
    // CATEGORY FILTER WITH PARAMETERIZATION
    // ============================================
    // If category exists and is not 'All', filter by exact category match
    // Uses Sequelize parameterization to prevent SQL injection
    if (categoryParam && categoryParam.trim() !== '' && categoryParam.toLowerCase() !== 'all') {
      // Use Op.eq for exact match (parameterized query)
      where.category = {
        [Op.eq]: categoryParam.trim()  // Parameterized: WHERE category = ?
      };
      console.log('=== CATEGORY FILTER APPLIED ===');
      console.log('Category param:', categoryParam);
      console.log('Using parameterized query for exact match');
      console.log('=================================');
    } else {
      console.log('=== NO CATEGORY FILTER (All products) ===');
      console.log('Category param received:', categoryParam);
      console.log('=========================================');
    }

    // Add search filter for name/description if provided
    if (search) {
      where[Op.or as any] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    console.log('=== GET ALL PRODUCTS QUERY ===');
    console.log('Where clause:', JSON.stringify(where));
    console.log('Page:', page, 'Limit:', limit);
    console.log('================================');

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      products,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getProductById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(typeof id === 'string' ? id : Array.isArray(id) ? id[0] : undefined);

    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Get product by id error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Extract fields from req.body (set by multer with upload.any())
    const name = req.body?.name;
    const description = req.body?.description;
    const category = req.body?.category;
    const quantity = req.body?.quantity;
    const price = req.body?.price;
    
    // Handle file upload - multer with upload.any() puts files in req.files
    const imageFile = req.files && Array.isArray(req.files) 
      ? req.files.find(f => f.fieldname === 'image')
      : null;
    const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : null;

    console.log('=== CREATE PRODUCT FORM DATA ===');
    console.log('name:', name);
    console.log('description:', description);
    console.log('category:', category);
    console.log('quantity:', quantity);
    console.log('price:', price);
    console.log('imageFile:', imageFile?.filename);
    console.log('=================================');

    if (!name || !price) {
      res.status(400).json({ message: 'Name and price are required.' });
      return;
    }

    const product = await Product.create({
      name,
      description: description || null,
      category: category || null,
      quantity: quantity ? Number(quantity) : 0,
      price,
      imageUrl,
    });

    try {
      await sequelize.query(
        'INSERT INTO inventory_logs (product_id, user_id, action, quantity_changed, notes, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        { replacements: [product.id, req.user!.id, 'add', product.quantity, 'Product created'] }
      );
    } catch (logError) {
      console.error('Log error:', logError);
    }

    res.status(201).json({
      message: 'Product created successfully.',
      product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // Extract fields from req.body (set by multer with upload.any())
    const name = req.body?.name;
    const description = req.body?.description;
    const category = req.body?.category;
    const quantity = req.body?.quantity;
    const price = req.body?.price;
    
    // Handle file upload - multer with upload.any() puts files in req.files
    const imageFile = req.files && Array.isArray(req.files) 
      ? req.files.find(f => f.fieldname === 'image')
      : null;
    const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : undefined;

    console.log('=== UPDATE PRODUCT FORM DATA ===');
    console.log('id:', id);
    console.log('name:', name);
    console.log('description:', description);
    console.log('category:', category);
    console.log('quantity:', quantity);
    console.log('price:', price);
    console.log('imageFile:', imageFile?.filename);
    console.log('==================================');

    const product = await Product.findByPk(typeof id === 'string' ? id : Array.isArray(id) ? id[0] : undefined);

    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    const oldQuantity = product.quantity;

    const updateData: { [key: string]: any } = {
      name,
      description: description || null,
      category: category || null,
      quantity: quantity ? Number(quantity) : product.quantity,
      price,
    };

    // Only update imageUrl if a new file was uploaded
    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    await product.update(updateData);

    const newQuantity = updateData.quantity;
    try {
      await sequelize.query(
        'INSERT INTO inventory_logs (product_id, user_id, action, quantity_changed, notes, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        { replacements: [product.id, req.user!.id, 'update', newQuantity - oldQuantity, 'Product updated'] }
      );
    } catch (logError) {
      console.error('Log error:', logError);
    }

    res.status(200).json({
      message: 'Product updated successfully.',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid product ID.' });
      return;
    }

    const product = await Product.findByPk(id);

    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    try {
      await sequelize.query(
        'INSERT INTO inventory_logs (product_id, user_id, action, quantity_changed, notes, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        { replacements: [product.id, req.user!.id, 'remove', -product.quantity, 'Product removed'] }
      );
    } catch (logError) {
      console.error('Log error:', logError);
    }

    await product.destroy();

    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getLowStockProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {

    const products = await Product.findAll({
      where: {
        quantity: {
          [Op.lt]: 10,
        },
      },
    });

    res.status(200).json({
      message: 'Low stock products retrieved successfully.',
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getInventoryLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await InventoryLog.findAll({
      limit: 20,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    res.status(200).json({
      message: 'Inventory logs retrieved successfully.',
      logs,
    });
  } catch (error) {
    console.error('Get inventory logs error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};