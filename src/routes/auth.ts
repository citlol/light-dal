import express from 'express';
import { register, login, getMe } from '../controllers/authControllers';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', register);
router.post('/login', login);

// Protected route (authentication required)
router.get('/me', protect, getMe);

export default router;