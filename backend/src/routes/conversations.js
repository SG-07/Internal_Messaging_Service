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
  getSentConversations,
} from '../controllers/conversations.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// static routes for conversations
router.post('/', requireAuth, createConversation);
router.get('/', requireAuth, getConversations);
router.post('/with-user', requireAuth, getConversationsWithUser);
router.get('/sent', requireAuth, getSentConversations);

// dynamic routes for specific conversationId
router.get('/:conversationId', requireAuth, getConversation);
router.patch('/:conversationId', requireAuth, updateConversation);
router.delete('/:conversationId', requireAuth, deleteConversation);
router.post('/:conversationId/messages', requireAuth, addMessage);


export default router;