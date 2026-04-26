
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required.' });
      return;
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ message: 'User with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_key_here',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_key_here',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};