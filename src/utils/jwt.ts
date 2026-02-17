import jwt from 'jsonwebtoken';

// Secret key for signing tokens
// In production, this should be in environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';

// Token expires in 7 days
const JWT_EXPIRES_IN = '7d';

/**
 * Generate JWT token for user
 */
export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId }, // Payload (data stored in token)
    JWT_SECRET, // Secret key
    { expiresIn: JWT_EXPIRES_IN } // Options
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