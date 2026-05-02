import swaggerUi from 'swagger-ui-express';
import { Request, Response } from 'express';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Inventory Management System API',
    version: '1.0.0',
    description: 'Full-stack inventory management API with JWT authentication, product CRUD, and dashboard statistics',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'Login and registration endpoints' },
    { name: 'Products', description: 'Product CRUD and inventory operations' },
    { name: 'Dashboard', description: 'Dashboard statistics and summaries' },
  ],
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserRegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
                example: {
                  message: 'User registered successfully.',
                  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  user: { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user' },
                },
              },
            },
          },
          '400': { description: 'Missing or invalid required fields' },
          '409': { description: 'User already exists' },
          '500': { description: 'Internal server error' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserLoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
                example: {
                  message: 'Login successful.',
                  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  user: { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user' },
                },
              },
            },
          },
          '400': { description: 'Missing email or password' },
          '401': { description: 'Invalid credentials' },
          '500': { description: 'Internal server error' },
        },
      },
    },
    '/api/dashboard/stats': {
      get: {
        summary: 'Get dashboard statistics',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Dashboard statistics returned successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DashboardStats' },
                example: {
                  totalProducts: 42,
                  totalStockValue: 1450.75,
                  lowStockCount: 5,
                  categoryCount: 8,
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Internal server error' },
        },
      },
    },
    '/api/products': {
      get: {
        summary: 'Get all products with pagination',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10 },
            description: 'Items per page',
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search products by name, description, or category',
          },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter products by category',
          },
        ],
        responses: {
          '200': {
            description: 'List of products returned successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    products: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ProductResponse' },
                    },
                    total: { type: 'integer', example: 1 },
                    page: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 10 },
                    totalPages: { type: 'integer', example: 1 },
                  },
                },
                example: {
                  products: [
                    {
                      id: 1,
                      name: 'Inventory Widget',
                      description: 'A compact inventory item.',
                      category: 'Gadgets',
                      quantity: 15,
                      price: 19.99,
                      imageUrl: 'http://localhost:5000/uploads/widget.jpg',
                      createdAt: '2026-05-01T12:00:00Z',
                      updatedAt: '2026-05-01T12:00:00Z',
                    },
                  ],
                  total: 1,
                  page: 1,
                  limit: 10,
                  totalPages: 1,
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Internal server error' },
        },
      },
      post: {
        summary: 'Create product (Admin only)',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['name', 'price'],
                properties: {
                  name: { type: 'string', example: 'Inventory Widget' },
                  description: { type: 'string', example: 'A compact inventory item.' },
                  category: { type: 'string', example: 'Gadgets' },
                  quantity: { type: 'integer', example: 15 },
                  price: { type: 'number', format: 'float', example: 19.99 },
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Product created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductResponse' },
                example: {
                  id: 1,
                  name: 'Inventory Widget',
                  description: 'A compact inventory item.',
                  category: 'Gadgets',
                  quantity: 15,
                  price: 19.99,
                  imageUrl: 'http://localhost:5000/uploads/widget.jpg',
                  createdAt: '2026-05-01T12:00:00Z',
                  updatedAt: '2026-05-01T12:00:00Z',
                },
              },
            },
          },
          '400': { description: 'Invalid product data' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Admin privileges required' },
          '500': { description: 'Internal server error' },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        summary: 'Get single product',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Product ID',
          },
        ],
        responses: {
          '200': {
            description: 'Product returned successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductResponse' },
                example: {
                  id: 1,
                  name: 'Inventory Widget',
                  description: 'A compact inventory item.',
                  category: 'Gadgets',
                  quantity: 15,
                  price: 19.99,
                  imageUrl: 'http://localhost:5000/uploads/widget.jpg',
                  createdAt: '2026-05-01T12:00:00Z',
                  updatedAt: '2026-05-01T12:00:00Z',
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Product not found' },
          '500': { description: 'Internal server error' },
        },
      },
      put: {
        summary: 'Update product (Admin only)',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Product ID',
          },
        ],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Updated Inventory Widget' },
                  description: { type: 'string', example: 'Updated description.' },
                  category: { type: 'string', example: 'Gadgets' },
                  quantity: { type: 'integer', example: 20 },
                  price: { type: 'number', format: 'float', example: 24.99 },
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Product updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductResponse' },
                example: {
                  id: 1,
                  name: 'Updated Inventory Widget',
                  description: 'Updated description.',
                  category: 'Gadgets',
                  quantity: 20,
                  price: 24.99,
                  imageUrl: 'http://localhost:5000/uploads/widget-updated.jpg',
                  createdAt: '2026-05-01T12:00:00Z',
                  updatedAt: '2026-05-02T09:00:00Z',
                },
              },
            },
          },
          '400': { description: 'Invalid update data' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Admin privileges required' },
          '404': { description: 'Product not found' },
          '500': { description: 'Internal server error' },
        },
      },
      delete: {
        summary: 'Delete product (Admin only)',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Product ID',
          },
        ],
        responses: {
          '200': {
            description: 'Product deleted successfully',
            content: {
              'application/json': {
                schema: { type: 'object' },
                example: { message: 'Product deleted successfully.' },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Admin privileges required' },
          '404': { description: 'Product not found' },
          '500': { description: 'Internal server error' },
        },
      },
    },
    '/api/products/low-stock': {
      get: {
        summary: 'Get low stock products',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Low stock products returned successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ProductResponse' },
                },
                example: [
                  {
                    id: 3,
                    name: 'Low Stock Item',
                    description: 'Only a few items left in stock.',
                    category: 'Accessories',
                    quantity: 5,
                    price: 12.99,
                    imageUrl: 'http://localhost:5000/uploads/low-stock.jpg',
                    createdAt: '2026-05-01T12:00:00Z',
                    updatedAt: '2026-05-01T12:00:00Z',
                  },
                ],
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Admin privileges required' },
          '500': { description: 'Internal server error' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      UserRegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'john@example.com' },
          password: { type: 'string', format: 'password', example: 'password123' },
          role: { type: 'string', enum: ['admin', 'user'], default: 'user', example: 'user' },
        },
      },
      UserLoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'john@example.com' },
          password: { type: 'string', format: 'password', example: 'password123' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Login successful.' },
          token: { type: 'string', example: 'eyJhbGciOi...' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'John Doe' },
              email: { type: 'string', example: 'john@example.com' },
              role: { type: 'string', example: 'user' },
            },
          },
        },
      },
      ProductResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Inventory Widget' },
          description: { type: 'string', example: 'A compact inventory item.' },
          category: { type: 'string', example: 'Gadgets' },
          quantity: { type: 'integer', example: 15 },
          price: { type: 'number', format: 'float', example: 19.99 },
          imageUrl: { type: 'string', example: 'http://localhost:5000/uploads/widget.jpg' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-05-01T12:00:00Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-05-01T12:00:00Z' },
        },
      },
      DashboardStats: {
        type: 'object',
        properties: {
          totalProducts: { type: 'integer', example: 42 },
          totalStockValue: { type: 'number', format: 'float', example: 1450.75 },
          lowStockCount: { type: 'integer', example: 5 },
          categoryCount: { type: 'integer', example: 8 },
        },
      },
    },
  },
};

const swaggerUiOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
};

export const swaggerDocs = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
};

export { swaggerUi, swaggerSpec, swaggerUiOptions };