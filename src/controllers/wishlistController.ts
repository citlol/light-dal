import { Response } from 'express';
import Wishlist from '../models/Wishlist';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

// ==========================================
// WISHLIST CRUD
// ==========================================

/**
 * Create new wishlist
 * POST /api/wishlists
 */
export const createWishlist = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description, type } = req.body;

    // Validation
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Wishlist name is required',
      });
      return;
    }

    // Validate type
    if (type && !['private', 'collaborative'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Type must be either private or collaborative',
      });
      return;
    }

    // Create wishlist
    const wishlist = await Wishlist.create({
      name,
      description: description || '',
      owner: req.user?._id,
      type: type || 'private',
      items: [],
      collaborators: [],
      pendingInvites: [],
    });

    res.status(201).json({
      success: true,
      message: 'Wishlist created successfully!',
      wishlist,
    });
  } catch (error: any) {
    console.error('Error creating wishlist:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating wishlist',
    });
  }
};

/**
 * Get all wishlists for current user
 * GET /api/wishlists
 */
export const getMyWishlists = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;

    // Get wishlists where user is owner OR collaborator
    const wishlists = await Wishlist.find({
      $or: [
        { owner: userId },
        { collaborators: userId }
      ],
    })
      .populate('owner', 'username email')
      .populate('collaborators', 'username email')
      .sort({ createdAt: -1 }); // Newest first

    res.json({
      success: true,
      count: wishlists.length,
      wishlists,
    });
  } catch (error: any) {
    console.error('Error fetching wishlists:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching wishlists',
    });
  }
};

/**
 * Get single wishlist
 * GET /api/wishlists/:id
 */
export const getWishlist = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const wishlist = await Wishlist.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('collaborators', 'username email')
      .populate('items.addedBy', 'username');

    // Check if wishlist exists
    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
      return;
    }

    // Check if user has access
    const userId = req.user?._id;
    const isOwner = wishlist.owner._id.toString() === userId;
    const isCollaborator = wishlist.collaborators.some(
      (c: any) => c._id.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
      res.status(403).json({
        success: false,
        message: 'You do not have access to this wishlist',
      });
      return;
    }

    res.json({
      success: true,
      wishlist,
    });
  } catch (error: any) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching wishlist',
    });
  }
};

/**
 * Update wishlist
 * PUT /api/wishlists/:id
 */
export const updateWishlist = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const wishlist = await Wishlist.findById(req.params.id);

    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
      return;
    }

    // Only owner can update wishlist settings
    if (wishlist.owner.toString() !== req.user?._id) {
      res.status(403).json({
        success: false,
        message: 'Only the owner can update this wishlist',
      });
      return;
    }

    const { name, description, type } = req.body;

    if (name) wishlist.name = name;
    if (description !== undefined) wishlist.description = description;
    if (type && ['private', 'collaborative'].includes(type)) {
      wishlist.type = type;
    }

    await wishlist.save();

    res.json({
      success: true,
      message: 'Wishlist updated successfully!',
      wishlist,
    });
  } catch (error: any) {
    console.error('Error updating wishlist:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating wishlist',
    });
  }
};

/**
 * Delete wishlist
 * DELETE /api/wishlists/:id
 */
export const deleteWishlist = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const wishlist = await Wishlist.findById(req.params.id);

    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
      return;
    }

    // Only owner can delete
    if (wishlist.owner.toString() !== req.user?._id) {
      res.status(403).json({
        success: false,
        message: 'Only the owner can delete this wishlist',
      });
      return;
    }

    await Wishlist.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Wishlist deleted successfully!',
      wishlist,
    });
  } catch (error: any) {
    console.error('Error deleting wishlist:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting wishlist',
    });
  }
};

// ==========================================
// ITEMS
// ==========================================

/**
 * Add item to wishlist
 * POST /api/wishlists/:id/items
 */
export const addItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const wishlist = await Wishlist.findById(req.params.id);

    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
      return;
    }

    // Check access (owner or collaborator)
    const userId = req.user?._id;
    const isOwner = wishlist.owner.toString() === userId;
    const isCollaborator = wishlist.collaborators
      .map((c) => c.toString())
      .includes(userId || '');

    if (!isOwner && !isCollaborator) {
      res.status(403).json({
        success: false,
        message: 'You do not have access to this wishlist',
      });
      return;
    }

    const { name, description, price, url } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Item name is required',
      });
      return;
    }

    // Add item to wishlist
    wishlist.items.push({
      name,
      description: description || '',
      price: price || null,
      url: url || '',
      isPurchased: false,
      addedBy: new mongoose.Types.ObjectId(userId),
      createdAt: new Date(),
    });

    await wishlist.save();

    res.status(201).json({
      success: true,
      message: 'Item added successfully!',
      item: wishlist.items[wishlist.items.length - 1],
      wishlist,
    });
  } catch (error: any) {
    console.error('Error adding item:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding item',
    });
  }
};

/**
 * Update item in wishlist
 * PUT /api/wishlists/:id/items/:itemId
 */
export const updateItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const wishlist = await Wishlist.findById(req.params.id);

    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
      return;
    }

    // Check access
    const userId = req.user?._id;
    const isOwner = wishlist.owner.toString() === userId;
    const isCollaborator = wishlist.collaborators
      .map((c) => c.toString())
      .includes(userId || '');

    if (!isOwner && !isCollaborator) {
      res.status(403).json({
        success: false,
        message: 'You do not have access to this wishlist',
      });
      return;
    }

    // Find the item
    const item = wishlist.items.find(
  (i) => i._id?.toString() === req.params.itemId
);

    if (!item) {
      res.status(404).json({
        success: false,
        message: 'Item not found',
      });
      return;
    }

    // Update fields
    const { name, description, price, url, isPurchased } = req.body;

    if (name) item.name = name;
    if (description !== undefined) item.description = description;
    if (price !== undefined) item.price = price;
    if (url !== undefined) item.url = url;
    if (isPurchased !== undefined) item.isPurchased = isPurchased;

    await wishlist.save();

    res.json({
      success: true,
      message: 'Item updated successfully!',
      item,
    });
  } catch (error: any) {
    console.error('Error updating item:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating item',
    });
  }
};

/**
 * Delete item from wishlist
 * DELETE /api/wishlists/:id/items/:itemId
 */
export const deleteItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const wishlist = await Wishlist.findById(req.params.id);

    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
      return;
    }

    // Check access
    const userId = req.user?._id;
    const isOwner = wishlist.owner.toString() === userId;
    const isCollaborator = wishlist.collaborators
      .map((c) => c.toString())
      .includes(userId || '');

    if (!isOwner && !isCollaborator) {
      res.status(403).json({
        success: false,
        message: 'You do not have access to this wishlist',
      });
      return;
    }

    // Remove item
    const item = wishlist.items.find(
  (i) => i._id?.toString() === req.params.itemId);
    await wishlist.save();

    res.json({
      success: true,
      message: 'Item deleted successfully!',
    });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting item',
    });
  }
};

// ==========================================
// COLLABORATION
// ==========================================

/**
 * Invite friend to collaborative wishlist
 * POST /api/wishlists/:id/invite
 */
export const inviteCollaborator = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const wishlist = await Wishlist.findById(req.params.id);

    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
      return;
    }

    // Only owner can invite
    if (wishlist.owner.toString() !== req.user?._id) {
      res.status(403).json({
        success: false,
        message: 'Only the owner can invite collaborators',
      });
      return;
    }

    // Must be collaborative type
    if (wishlist.type !== 'collaborative') {
      res.status(400).json({
        success: false,
        message: 'This wishlist is private. Change it to collaborative first.',
      });
      return;
    }

    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    // Check if already a collaborator
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // User exists - add directly as collaborator
      const isAlreadyCollaborator = wishlist.collaborators
        .map((c) => c.toString())
        .includes(existingUser._id.toString());

      if (isAlreadyCollaborator) {
        res.status(400).json({
          success: false,
          message: 'User is already a collaborator',
        });
        return;
      }

      // Don't add owner as collaborator
      if (existingUser._id.toString() === req.user?._id) {
        res.status(400).json({
          success: false,
          message: 'You are already the owner',
        });
        return;
      }

      wishlist.collaborators.push(existingUser._id);

      await wishlist.save();

      res.json({
        success: true,
        message: `${existingUser.username} added as collaborator!`,
        wishlist,
      });
    } else {
      // User doesn't exist yet - add to pending invites
      if (wishlist.pendingInvites.includes(email)) {
        res.status(400).json({
          success: false,
          message: 'Invite already sent to this email',
        });
        return;
      }

      wishlist.pendingInvites.push(email);
      await wishlist.save();

      res.json({
        success: true,
        message: `Invite sent to ${email}! They'll be added when they register.`,
        wishlist,
      });
    }
  } catch (error: any) {
    console.error('Error inviting collaborator:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error inviting collaborator',
    });
  }
};

/**
 * Remove collaborator from wishlist
 * DELETE /api/wishlists/:id/collaborators/:userId
 */
export const removeCollaborator = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const wishlist = await Wishlist.findById(req.params.id);

    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
      return;
    }

    // Only owner can remove collaborators
    if (wishlist.owner.toString() !== req.user?._id) {
      res.status(403).json({
        success: false,
        message: 'Only the owner can remove collaborators',
      });
      return;
    }

    // Remove collaborator
    wishlist.collaborators = wishlist.collaborators.filter(
      (c) => c.toString() !== req.params.userId
    );

    await wishlist.save();

    res.json({
      success: true,
      message: 'Collaborator removed successfully!',
      wishlist,
    });
  } catch (error: any) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error removing collaborator',
    });
  }
};

// Need to import mongoose for ObjectId
import mongoose from 'mongoose';