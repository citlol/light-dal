import express from 'express';
import {
  createWishlist,
  getMyWishlists,
  getWishlist,
  updateWishlist,
  deleteWishlist,
  addItem,
  updateItem,
  deleteItem,
  inviteCollaborator,
  removeCollaborator,
} from '../controllers/wishlistController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes are protected (require login)
router.use(protect);

// Wishlist CRUD
router.post('/', createWishlist);
router.get('/', getMyWishlists);
router.get('/:id', getWishlist);
router.put('/:id', updateWishlist);
router.delete('/:id', deleteWishlist);

// Items
router.post('/:id/items', addItem);
router.put('/:id/items/:itemId', updateItem);
router.delete('/:id/items/:itemId', deleteItem);

// Collaboration
router.post('/:id/invite', inviteCollaborator);
router.delete('/:id/collaborators/:userId', removeCollaborator);

export default router;