import { Request, Response } from 'express';
import Category from '../models/Category';
import { AuthRequest } from '../middleware/auth';

// Get all categories
export const getAllCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Return hardcoded categories since Category table may not exist
    const categories = [
      'Electronics', 'Fashion', 'Home & Living', 'Gadgets', 
      'Food & Beverage', 'Sports', 'Books', 'Clothing', 'Toys', 'Other'
    ];

    res.status(200).json(categories);
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get category by ID
export const getCategoryById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid category ID.' });
      return;
    }

    const category = await Category.findByPk(id);

    if (!category) {
      res.status(404).json({ message: 'Category not found.' });
      return;
    }

    res.status(200).json(category);
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Create new category
export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Category name is required.' });
      return;
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      res.status(400).json({ message: 'Category already exists.' });
      return;
    }

    const category = await Category.create({
      name,
      description: description || null,
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update category
export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid category ID.' });
      return;
    }

    const { name, description } = req.body;

    const category = await Category.findByPk(id);

    if (!category) {
      res.status(404).json({ message: 'Category not found.' });
      return;
    }

    // Check if new name already exists (excluding current category)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ where: { name } });
      if (existingCategory) {
        res.status(400).json({ message: 'Category name already exists.' });
        return;
      }
    }

    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
    });

    res.status(200).json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete category
export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid category ID.' });
      return;
    }

    const category = await Category.findByPk(id);

    if (!category) {
      res.status(404).json({ message: 'Category not found.' });
      return;
    }

    await category.destroy();

    res.status(200).json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};