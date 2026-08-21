// backend/src/routes/group.js
import { Router } from 'express';
import {
  createGroup
} from '../controllers/group.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

router.use(requireAuth); // All routes here require valid auth

const router = Router();

router.post('/create', createGroup);

export default router;