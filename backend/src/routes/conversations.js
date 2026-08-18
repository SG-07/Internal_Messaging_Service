// backend/src/routes/conversations.js
import { Router } from 'express';
import {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  addMessage,
  getConversationsWithUser,
} from '../controllers/conversations.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createConversation);
router.get('/', requireAuth, getConversations);
router.get('/:conversationId', requireAuth, getConversation);
router.patch('/:conversationId', requireAuth, updateConversation);
router.delete('/:conversationId', requireAuth, deleteConversation);
router.post('/:conversationId/messages', requireAuth, addMessage);
router.post('/with-user', requireAuth, getConversationsWithUser);

export default router;