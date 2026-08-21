// backend/src/routes/group.js
import { Router } from 'express';
import {
  createGroup
} from '../controllers/group.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';



const router = Router();

router.post('/create', requireAuth, createGroup);

export default router;