// backend/src/routes/manager.js
import { Router } from 'express';
import {
  managerGetTeams,
  managerGetTeam,
  managerListTeamMembers,
  managerAddTeamMember,
  managerRemoveTeamMember,
  managerGetDepartmentUsers,
  managerGetDepartmentUser,
  managerListReportedConversations,
  managerGetReportedConversation,
  managerListReports,
  managerReviewReport,
} from '../controllers/manager.js';
import { requireAuth, requireManager } from '../middleware/auth.js';

const router = Router();

// ===== TEAM MANAGEMENT =====
router.get('/teams', requireAuth, requireManager, managerGetTeams);
router.get('/teams/:teamId', requireAuth, requireManager, managerGetTeam);
router.get('/teams/:teamId/members', requireAuth, requireManager, managerListTeamMembers);
router.post('/teams/:teamId/members', requireAuth, requireManager, managerAddTeamMember);
router.delete('/teams/:teamId/members/:userId', requireAuth, requireManager, managerRemoveTeamMember);

// ===== DEPARTMENT USERS =====
router.get('/department/users', requireAuth, requireManager, managerGetDepartmentUsers);
router.get('/department/users/:userId', requireAuth, requireManager, managerGetDepartmentUser);

// ===== REPORTED CONVERSATIONS (Manager Oversight) =====
router.get('/reported-conversations', requireAuth, requireManager, managerListReportedConversations);
router.get('/reported-conversations/:conversationId', requireAuth, requireManager, managerGetReportedConversation);

// ===== REPORTS MANAGEMENT =====
router.get('/reports', requireAuth, requireManager, managerListReports);
router.patch('/reports/:reportId', requireAuth, requireManager, managerReviewReport);

export default router;