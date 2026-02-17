import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import { protect } from './middleware/auth';
import User from './models/User';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UsersResponse,
  UserResponse,
  ErrorResponse
} from './types';

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// ==========================================
// ROUTES
// ==========================================

// Homepage
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Wishlist API!',
    version: '4.0.0',
    language: 'TypeScript',
    database: 'MongoDB',
    features: ['Authentication', 'JWT Tokens', 'Password Hashing'],
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me (protected)'
      },
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
app.get('/health', async (req: Request, res: Response) => {
  const userCount = await User.countDocuments();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'MongoDB',
    usersCount: userCount
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

// Auth routes
app.use('/api/auth', authRoutes);

// Get all users
app.get('/api/users', protect, async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-__v'); // Exclude __v field
    
    const response: UsersResponse = {
      success: true,
      count: users.length,
      users: users
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// Get single user
app.get('/api/users/:id', protect, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    
    if (!user) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: `User with ID ${req.params.id} not found`
      };
      return res.status(404).json(errorResponse);
    }
    
    const response: UserResponse = {
      success: true,
      user: user
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// Create user
app.post('/api/users', protect, async (req: Request<{}, {}, CreateUserRequest>, res: Response) => {
  try {
    const { username, email, age } = req.body;
    
    // Basic validation (Mongoose will do more)
    if (!username || !email) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Missing required fields',
        required: ['username', 'email']
      };
      return res.status(400).json(errorResponse);
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Username already taken'
      };
      return res.status(400).json(errorResponse);
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      age: age || null
    });
    
    await newUser.save();
    
    const response: UserResponse = {
      success: true,
      message: 'User created successfully!',
      user: newUser
    };
    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

// Update user
app.put('/api/users/:id', protect, async (req: Request<{ id: string }, {}, UpdateUserRequest>, res: Response) => {
  try {
    const { username, email, age } = req.body;
    
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: `User with ID ${req.params.id} not found`
      };
      return res.status(404).json(errorResponse);
    }
    
    // Check if new username is taken by someone else
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Username already taken'
        };
        return res.status(400).json(errorResponse);
      }
    }
    
    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (age !== undefined) user.age = age;
    
    await user.save();
    
    const response: UserResponse = {
      success: true,
      message: 'User updated successfully!',
      user: user
    };
    res.json(response);
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// Delete user
app.delete('/api/users/:id', protect, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: `User with ID ${req.params.id} not found`
      };
      return res.status(404).json(errorResponse);
    }
    
    const response: UserResponse = {
      success: true,
      message: 'User deleted successfully!',
      user: user
    };
    res.json(response);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`💎 Running with TypeScript!`);
  console.log(`🗄️  Connected to MongoDB!`);
});