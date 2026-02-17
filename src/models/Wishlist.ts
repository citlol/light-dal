import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface for Item (embedded in Wishlist)
 */
export interface IItem {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number | null;
  url: string;
  isPurchased: boolean;
  addedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

/**
 * Interface for Wishlist document
 */
export interface IWishlist extends Document {
  name: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  type: 'private' | 'collaborative';
  items: IItem[];
  collaborators: mongoose.Types.ObjectId[];
  pendingInvites: string[]; // emails of people invited
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Item Schema (embedded inside Wishlist)
 */
const itemSchema = new Schema<IItem>(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Item name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: null,
    },
    url: {
      type: String,
      trim: true,
      default: '',
    },
    isPurchased: {
      type: Boolean,
      default: false,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Wishlist Schema
 */
const wishlistSchema = new Schema<IWishlist>(
  {
    name: {
      type: String,
      required: [true, 'Wishlist name is required'],
      trim: true,
      maxlength: [100, 'Wishlist name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['private', 'collaborative'],
      default: 'private',
    },
    items: [itemSchema], // Embedded items array
    collaborators: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    pendingInvites: [
      {
        type: String, // Email addresses
        lowercase: true,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Wishlist Model
 */
const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema);

export default Wishlist;