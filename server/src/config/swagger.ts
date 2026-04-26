import swaggerUi from 'swagger-ui-express';
import { Request, Response } from 'express';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Inventory Management API',
    version: '1.0.0',
    description: 'API for managing products and users in an inventory system',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
    },
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
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'password123' },
                  role: { type: 'string', enum: ['admin', 'user'], default: 'user' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { type: 'object' },
                example: {
                  message: 'User registered successfully.',
                  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  user: { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user' },
                },
              },
            },
          },
          '400': { description: 'Missing required fields' },
          '409': { description: 'User already exists' },
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
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { type: 'object' },
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
        },
      },
    },
    '/api/products': {
      get: {
        summary: 'Get all products',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name or category' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          '200': {
            description: 'List of products',
            content: {
              'application/json': {
                schema: { type: 'object' },
                example: {
                  products: [{ id: 1, name: 'Product 1', price: 99.99, quantity: 10 }],
                  pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create a new product (Admin only)',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['name', 'price'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  quantity: { type: 'integer' },
                  price: { type: 'number' },
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Product created successfully' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Admin only' },
        },
      },
    },
    '/api/products/{id}': {
      put: {
        summary: 'Update a product (Admin only)',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  quantity: { type: 'integer' },
                  price: { type: 'number' },
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Product updated successfully' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Admin only' },
          '404': { description: 'Product not found' },
        },
      },
      delete: {
        summary: 'Delete a product (Admin only)',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Product deleted successfully' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Admin only' },
          '404': { description: 'Product not found' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
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