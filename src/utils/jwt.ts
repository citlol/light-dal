import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
// Secret key for signing tokens
// In production, this should be in environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-only-for-development';

// Token expires in 7 days
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 */
export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId }, // Payload (data stored in token)
    JWT_SECRET, // Secret key
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']} // Options
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
};