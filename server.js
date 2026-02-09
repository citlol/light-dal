// Import Express - the web framework we're using
const express = require('express');

// Create an Express application
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Route 1: Homepage
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Wishlist API!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Route 2: Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Route 3: Greet someone
app.get('/greet/:name', (req, res) => {
  const name = req.params.name;
  res.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString()
  });
});

// Start the server on port 5000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});
