// Import Express
const express = require('express');
const app = express();

// Middleware to parse JSON request bodies
// This MUST come before your routes!
app.use(express.json());

// In-memory storage (temporary - we'll use a database later)
let users = [];
let nextUserId = 1;

// ==========================================
// ROUTES
// ==========================================

// Homepage - show available endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Wishlist API!',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      echo: 'POST /api/echo',
      users: {
        getAll: 'GET /api/users',
        getOne: 'GET /api/users/:id',
        create: 'POST /api/users'
      }
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    usersCount: users.length
  });
});

// Echo endpoint - test POST requests
app.post('/api/echo', (req, res) => {
  console.log('Received:', req.body);
  
  res.json({
    message: 'Echo! I received your data',
    youSent: req.body,
    timestamp: new Date().toISOString()
  });
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    count: users.length,
    users: users
  });
});

// Get single user by ID
app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User with ID ${userId} not found`
    });
  }
  
  res.json({
    success: true,
    user: user
  });
});

// Create new user
app.post('/api/users', (req, res) => {
  // Extract data from request body
  const { username, email, age } = req.body;
  
  // Validation: Check required fields
  if (!username || !email) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      required: ['username', 'email']
    });

    // Update user
app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const { username, email, age } = req.body;
  
  // Find the user
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `User with ID ${userId} not found`
    });
  }
  
  // Validation: If updating username, check it's not taken by someone else
  if (username && username !== users[userIndex].username) {
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }
  }
  
  // Validation: Check username length if provided
  if (username && username.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Username must be at least 3 characters long'
    });
  }
  
  // Validation: Check email format if provided
  if (email && !email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }
  
  // Update the user (only update fields that were provided)
  if (username) users[userIndex].username = username;
  if (email) users[userIndex].email = email;
  if (age !== undefined) users[userIndex].age = age;
  users[userIndex].updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'User updated successfully!',
    user: users[userIndex]
  });
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Find the user
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `User with ID ${userId} not found`
    });
  }
  
  // Get user info before deleting (to return in response)
  const deletedUser = users[userIndex];
  
  // Remove user from array
  users.splice(userIndex, 1);
  
  res.json({
    success: true,
    message: 'User deleted successfully!',
    user: deletedUser
  });
});
  }
  
  // Validation: Check username length
  if (username.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Username must be at least 3 characters long'
    });
  }
  
  // Validation: Check email format (basic)
  if (!email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }
  
  // Validation: Check if username already exists
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Username already taken'
    });
  }
  
  // Create new user object
  const newUser = {
    id: nextUserId++,
    username: username,
    email: email,
    age: age || null,
    createdAt: new Date().toISOString()
  };
  
  // Add to our "database" (array)
  users.push(newUser);
  
  // Send success response
  res.status(201).json({
    success: true,
    message: 'User created successfully!',
    user: newUser
  });
});

// 404 handler - must come LAST
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Try these endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   GET  http://localhost:${PORT}/api/users`);
  console.log(`   POST http://localhost:${PORT}/api/users`);
});