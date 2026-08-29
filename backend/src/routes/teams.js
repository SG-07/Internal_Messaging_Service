// backend/src/routes/teams.js
import { Router } from 'express';
import {
  createTeam,
  listUserTeams,
  addTeamMember,
  getTeam,
  getTeamConversation,    
  listTeamMembers,
  removeTeamMember,
  leaveTeam,
  requestTeam,
  getMyTeamRequests,
  getMyTeamMembers,
  getTeamMemberConversations,
  getTeamMemberConversation,    
} from '../controllers/teams.js';
import { requireAuth, requireManagerOrAdmin } from '../middleware/auth.js';

const router = Router();

// ===== MANAGER OVERSIGHT (OLD - Existing) =====
router.post('/request', requireAuth, requireManagerOrAdmin, requestTeam);
router.get('/my-requests', requireAuth, requireManagerOrAdmin, getMyTeamRequests);
router.get('/my-team', requireAuth, requireManagerOrAdmin, getMyTeamMembers);
router.get('/my-team/members/:userId/conversations', requireAuth, requireManagerOrAdmin, getTeamMemberConversations);
router.get('/conversations/:conversationId', requireAuth, requireManagerOrAdmin, getTeamMemberConversation);

// ===== Admin TEAM MANAGEMENT (NEW - Steps 2-5) =====
router.post('/create', requireAuth, requireManagerOrAdmin, createTeam);
router.get('/me/teams', requireAuth, listUserTeams);
router.get('/:teamId', requireAuth, getTeam);
router.post('/:teamId/members', requireAuth, requireManagerOrAdmin, addTeamMember);

// ===== TEAM CONVERSATIONS & MEMBERS (NEW - Steps 6-9) =====
router.get('/:teamId/conversation', requireAuth, getTeamConversation);
router.get('/:teamId/members', requireAuth, listTeamMembers);
router.delete('/:teamId/members/:userId', requireAuth, requireManagerOrAdmin, removeTeamMember);
router.post('/:teamId/leave', requireAuth, leaveTeam);



export default router;