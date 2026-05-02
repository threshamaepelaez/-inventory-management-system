import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import dashboardRoutes from './routes/dashboard';
import categoryRoutes from './routes/categories';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

dotenv.config();

const app = express();
const PORT = 5000;

// ============================================
// CORS CONFIGURATION
// ============================================
// Import cors module (already done above: import cors from 'cors')

// Use cors() middleware to allow requests from Angular frontend
// Place BEFORE routes to handle preflight OPTIONS requests correctly
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com', 'https://www.yourdomain.com']  // Restrict to specific domains in production
    : ['http://localhost:4200', 'http://127.0.0.1:4200'], // Allow Angular dev origin(s)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// ============================================
// BODY PARSING
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ============================================
// ROUTES (placed after CORS middleware)
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Inventory Management API is running!' });
});

// ============================================
// GLOBAL ERROR HANDLING MIDDLEWARE
// ============================================
// This middleware catches all unhandled errors and ensures JSON response
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('=============================');
  
  res.status(500).json({
    message: 'Internal server error.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// 404 HANDLER - Catch unmatched routes
// ============================================
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found.',
    path: req.path
  });
});

// Connect to database and start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

export default app;