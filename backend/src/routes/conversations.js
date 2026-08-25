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
  getPendingWorkflows,
  getMyWorkflowRequests,
  updateActionStatus,
  updateApprovalStatus,
  reportConversation,
  listReports,
  reviewReport,
  createGroupConversation    
} from '../controllers/conversations.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// static routes for conversations
router.post('/', requireAuth, createConversation);
router.get('/', requireAuth, getConversations);
router.post('/with-user', requireAuth, getConversationsWithUser);
router.get('/sent', requireAuth, getSentConversations);
router.get('/workflow/pending', requireAuth, getPendingWorkflows);
router.get('/workflow/mine', requireAuth, getMyWorkflowRequests);


router.post('/group/:groupId', requireAuth, createGroupConversation);
// dynamic routes for specific conversationId
router.get('/:conversationId', requireAuth, getConversation);
router.patch('/:conversationId', requireAuth, updateConversation);
router.delete('/:conversationId', requireAuth, deleteConversation);
router.post('/:conversationId/messages', requireAuth, addMessage);
router.patch('/:conversationId/action', requireAuth, updateActionStatus);
router.patch('/:conversationId/approval', requireAuth, updateApprovalStatus);

router.post('/:conversationId/report', requireAuth, reportConversation);
router.get('/reports', requireAuth, listReports);
router.patch('/reports/:reportId', requireAuth, reviewReport);


export default router;