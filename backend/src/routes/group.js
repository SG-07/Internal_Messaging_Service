// backend/src/routes/group.js
import { Router } from 'express';
import {
   createGroup, 
   listGroups, 
   getGroup, 
   updateGroup, 
   deleteGroup 
} from '../controllers/group.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';



const router = Router();

router.post('/create', requireAuth, createGroup);
router.get('/listGroups', requireAuth, listGroups);

export default router;