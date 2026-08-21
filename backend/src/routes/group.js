// backend/src/routes/group.js
import { Router } from 'express';
import {
   createGroup, 
   listGroups, 
   joinGroup,
   getGroup, 
//    updateGroup, 
//    deleteGroup 
} from '../controllers/group.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';



const router = Router();

router.post('/create', requireAuth, createGroup);
router.get('/listGroups', requireAuth, listGroups);
router.post('/joinGroup', requireAuth, joinGroup);
router.get('/:groupId', requireAuth, getGroup);
// router.put('/:groupId', requireAuth, updateGroup);
// router.delete('/:groupId', requireAuth, deleteGroup);

export default router;