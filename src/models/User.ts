import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Interface for User document
 */
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  age: number | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User Schema
 */
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save middleware to hash password
 * Runs automatically before saving user to database
 */
userSchema.pre('save', async function (next) {
  // Only hash password if it's new or modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt (random string added to password)
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * Method to compare password for login
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    // Compare plain text password with hashed password
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

/**
 * User Model
 */
const User = mongoose.model<IUser>('User', userSchema);

export default User;