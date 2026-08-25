// backend/src/routes/group.js
import { Router } from 'express';
import { 
  createGroup, 
  listGroups, 
  joinGroup,
  getGroup,
  leaveGroup,
  updateGroup,
  deleteGroup,
  listGroupMembers,
  addMember,
  removeMember,
  listJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  listPotentialMembers
} from '../controllers/group.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/createGroup', requireAuth, createGroup);
router.get('/listGroups', requireAuth, listGroups);
router.post('/:groupId/join', requireAuth, joinGroup);
router.get('/:groupId', requireAuth, getGroup);
router.post('/:groupId/leave', requireAuth, leaveGroup);
router.patch('/:groupId', requireAuth, updateGroup);
router.delete('/:groupId', requireAuth, deleteGroup);
router.get('/:groupId/members', requireAuth, listGroupMembers);
router.post('/:groupId/members', requireAuth, addMember);
router.delete('/:groupId/members/:userId', requireAuth, removeMember);
router.get('/:groupId/requests', requireAuth, listJoinRequests);
router.patch('/:groupId/requests/:requestId/approve', requireAuth, approveJoinRequest);  
router.patch('/:groupId/requests/:requestId/reject', requireAuth, rejectJoinRequest);   
router.get('/:groupId/potential-members', requireAuth, listPotentialMembers);  

export default router;