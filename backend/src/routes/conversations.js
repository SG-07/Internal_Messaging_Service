// backend/src/routes/conversations.js
import { Router } from 'express';
import { createConversation, getConversations } from '../controllers/conversations.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createConversation);
router.get('/', requireAuth, getConversations);

export default router;