// backend/src/routes/manager.js
import { Router } from 'express';
import {
  // Team Management (existing)
  managerGetTeams,
  managerGetTeam,
  managerListTeamMembers,
  managerAddTeamMember,
  managerRemoveTeamMember,
  managerGetDepartmentUsers,
  managerGetDepartmentUser,
  // Reporting Oversight 
  managerListReportedItems,
  managerGetReportedItem,
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

// ===== REPORTING OVERSIGHT (Department-scoped) =====
router.get('/reported-items', requireAuth, requireManager, managerListReportedItems);
router.get('/reported-items/:reportId', requireAuth, requireManager, managerGetReportedItem);
router.get('/reports', requireAuth, requireManager, managerListReports);
router.patch('/reports/:reportId', requireAuth, requireManager, managerReviewReport);

export default router;