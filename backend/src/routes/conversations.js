import { Router } from 'express';
import { createConversation } from '../controllers/conversations.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createConversation);

export default router;