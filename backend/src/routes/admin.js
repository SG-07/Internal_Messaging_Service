// backend/src/routes/admin.js
import { Router } from 'express';
import {
  listUsers,
  updateUserRole,
  assignManager,
  setUserActiveStatus,
  listTeams,
  createTeam,
  reviewTeamRequest,
  deleteTeam,
  addUserToTeam,
  updateUserTeamStatus,
  getUserConversations,
  getAnyConversation,
  getTeamById,
  getUserProfile,
  updateUserDepartment,
  adminListReportedItems,
  adminGetReportedItem,
  adminListReports,
  adminReviewReport,
  adminUpdateUserPassword
} from '../controllers/admin.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All routes here require both valid auth AND admin role
router.use(requireAuth, requireAdmin);

// User management
router.get('/users', listUsers);
router.patch('/users/:userId/role', updateUserRole);
router.patch('/users/:userId/manager', assignManager);
router.patch('/users/:userId/status', setUserActiveStatus);
router.patch('/users/:userId/team-status', updateUserTeamStatus);
router.get('/users/:userId/conversations', getUserConversations);
router.get('/users/:userId/profile', getUserProfile);
router.patch('/users/:userId/department', updateUserDepartment);
router.patch('/users/password', adminUpdateUserPassword);

// Team management
router.get('/teams', listTeams);
router.post('/teams', createTeam);
router.patch('/teams/:teamId/review', reviewTeamRequest);
router.delete('/teams/:teamId', deleteTeam);
router.post('/teams/:teamId/members', addUserToTeam);
// router.patch('/teams/:teamId/members/:userId', updateUserTeamStatus);
router.get('/teams/:teamId/edit', getTeamById);

// Conversation oversight
router.get('/conversations/:conversationId', getAnyConversation);

// Report oversight (global — all departments)
router.get('/reports/items', adminListReportedItems);
router.get('/reports/items/:reportId', adminGetReportedItem);
router.get('/reports', adminListReports);
router.patch('/reports/:reportId/review', adminReviewReport);

export default router;