import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { verifyToken } from '../utils/jwt';

/**
 * Extended Request interface with user property
 */
export interface AuthRequest extends Request {
  user?: {
    _id: string;
    username: string;
    email: string;
  };
}

/**
 * Middleware to protect routes (require authentication)
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Not authorized. Please login.',
      });
      return;
    }

    // Extract token (format: "Bearer TOKEN")
    const token = authHeader.split(' ')[1];

    // 2. Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.',
      });
      return;
    }

    // 3. Get user from database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found.',
      });
      return;
    }

    // 4. Attach user to request
    req.user = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    next(); // Continue to route handler
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized.',
    });
  }
};