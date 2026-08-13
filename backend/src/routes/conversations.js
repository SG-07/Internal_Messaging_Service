// backend/src/routes/conversations.js
import { Router } from 'express';
import {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,
} from '../controllers/conversations.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createConversation);
router.get('/', requireAuth, getConversations);
router.get('/:conversationId', requireAuth, getConversation);
router.patch('/:conversationId', requireAuth, updateConversation);
router.delete('/:conversationId', requireAuth, deleteConversation);

export default router;