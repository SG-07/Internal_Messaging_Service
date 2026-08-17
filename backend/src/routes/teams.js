// backend/src/routes/teams.js
import { Router } from 'express';
import {
  requestTeam,
  getMyTeamRequests,
  getMyTeamMembers,
  getTeamMemberConversations,
  getTeamConversation,
} from '../controllers/teams.js';
import { requireAuth, requireManagerOrAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/request', requireAuth, requireManagerOrAdmin, requestTeam);
router.get('/my-requests', requireAuth, requireManagerOrAdmin, getMyTeamRequests);
router.get('/my-team', requireAuth, requireManagerOrAdmin, getMyTeamMembers);
router.get('/my-team/members/:userId/conversations', requireAuth, requireManagerOrAdmin, getTeamMemberConversations);
router.get('/my-team/conversations/:conversationId', requireAuth, requireManagerOrAdmin, getTeamConversation);

export default router;