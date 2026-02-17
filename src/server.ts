import express, { Request, Response, NextFunction } from 'express';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UsersResponse,
  UserResponse,
  ErrorResponse
} from './types';

const app = express();

// Middleware
app.use(express.json());

// In-memory storage
let users: User[] = [];
let nextUserId = 1;

// ==========================================
// ROUTES
// ==========================================

// Homepage
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Wishlist API!',
    version: '2.0.0',
    language: 'TypeScript',
    endpoints: {
      health: 'GET /health',
      echo: 'POST /api/echo',
      users: {
        getAll: 'GET /api/users',
        getOne: 'GET /api/users/:id',
        create: 'POST /api/users',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id'
      }
    }
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    usersCount: users.length
  });
});

// Echo endpoint
app.post('/api/echo', (req: Request, res: Response) => {
  console.log('Received:', req.body);
  
  res.json({
    message: 'Echo! I received your data',
    youSent: req.body,
    timestamp: new Date().toISOString()
  });
});

// Get all users
app.get('/api/users', (req: Request, res: Response) => {
  const response: UsersResponse = {
    success: true,
    count: users.length,
    users: users
  };
  res.json(response);
});

// Get single user
app.get('/api/users/:id', (req: Request<{id: string}>, res: Response) => {
  const userId = parseInt(req.params.id as string);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: `User with ID ${userId} not found`
    };
    return res.status(404).json(errorResponse);
  }
  
  const response: UserResponse = {
    success: true,
    user: user
  };
  res.json(response);
});

// Create user
app.post('/api/users', (req: Request<{}, {}, CreateUserRequest>, res: Response) => {
  const { username, email, age } = req.body;
  
  // Validation: Required fields
  if (!username || !email) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Missing required fields',
      required: ['username', 'email']
    };
    return res.status(400).json(errorResponse);
  }
  
  // Validation: Username length
  if (username.length < 3) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Username must be at least 3 characters long'
    };
    return res.status(400).json(errorResponse);
  }
  
  // Validation: Email format
  if (!email.includes('@')) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Invalid email format'
    };
    return res.status(400).json(errorResponse);
  }
  
  // Validation: Duplicate username
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Username already taken'
    };
    return res.status(400).json(errorResponse);
  }
  
  // Create new user
  const newUser: User = {
    id: nextUserId++,
    username,
    email,
    age: age || null,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  
  const response: UserResponse = {
    success: true,
    user: newUser
  };
  res.status(201).json(response);
});

// Update user
app.put('/api/users/:id', (req: Request<{ id: string }, {}, UpdateUserRequest>, res: Response) => {
  const userId = parseInt(req.params.id);
  const { username, email, age } = req.body;
  
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: `User with ID ${userId} not found`
    };
    return res.status(404).json(errorResponse);
  }
  
  // Validation: Duplicate username
  if (username && username !== users[userIndex].username) {
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Username already taken'
      };
      return res.status(400).json(errorResponse);
    }
  }
  
  // Validation: Username length
  if (username && username.length < 3) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Username must be at least 3 characters long'
    };
    return res.status(400).json(errorResponse);
  }
  
  // Validation: Email format
  if (email && !email.includes('@')) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Invalid email format'
    };
    return res.status(400).json(errorResponse);
  }
  
  // Update user
  if (username) users[userIndex].username = username;
  if (email) users[userIndex].email = email;
  if (age !== undefined) users[userIndex].age = age;
  users[userIndex].updatedAt = new Date().toISOString();
  
  const response: UserResponse = {
    success: true,
    user: users[userIndex]
  };
  res.json(response);
});

// Delete user
app.delete('/api/users/:id', (req: Request<{id: string}>, res: Response) => {
  const userId = parseInt(req.params.id as string);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: `User with ID ${userId} not found`
    };
    return res.status(404).json(errorResponse);
  }
  
  const deletedUser = users[userIndex];
  users.splice(userIndex, 1);
  
  const response: UserResponse = {
    success: true,
    user: deletedUser
  };
  res.json(response);
});

// 404 handler
app.use((req: Request, res: Response) => {
  const errorResponse: ErrorResponse = {
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  };
  res.status(404).json(errorResponse);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Running with TypeScript!`);
  console.log(`Try these endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/api/users`);
  console.log(`   POST http://localhost:${PORT}/api/users`);
});