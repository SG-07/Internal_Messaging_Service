// backend/src/routes/reporting.js
import { Router } from 'express';
import {
  createReport,
  getUserReports,
  getReportDetails,
} from '../controllers/reporting.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ===== USER REPORTING (Anyone can report) =====
router.post('/', requireAuth, createReport);
router.get('/my-reports', requireAuth, getUserReports);
router.get('/:reportId', requireAuth, getReportDetails);

export default router;