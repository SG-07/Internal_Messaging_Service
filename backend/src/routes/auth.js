import { Router } from 'express';
import {
  signup,
  login,
  logout,
  getCurrentUser,
} from '../controllers/auth.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// --- Public routes ---
router.post('/signup', signup);
router.post('/login', login);

// --- Protected routes (require valid session) ---
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getCurrentUser);

export default router;