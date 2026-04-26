import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';

export const getAllProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: { [key: string]: any } = {};

    if (search) {
      where[Op.or as any] = [
        { name: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } },
      ];
    }

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
    const { name, description, category, quantity, price } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !price) {
      res.status(400).json({ message: 'Name and price are required.' });
      return;
    }

    const product = await Product.create({
      name,
      description,
      category,
      quantity: quantity || 0,
      price,
      imageUrl,
    });

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
    const { name, description, category, quantity, price } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const product = await Product.findByPk(typeof id === 'string' ? id : Array.isArray(id) ? id[0] : undefined);

    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    const updateData: { [key: string]: any } = {
      name,
      description,
      category,
      quantity,
      price,
    };

    // Only update imageUrl if a new file was uploaded
    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    await product.update(updateData);

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
    const { id } = req.params;
    const product = await Product.findByPk(typeof id === 'string' ? id : Array.isArray(id) ? id[0] : undefined);

    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
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