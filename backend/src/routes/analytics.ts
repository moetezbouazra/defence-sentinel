import { Router } from 'express';
import { getDashboardStats, getTimeline, getThreatDistribution, getDevicePerformance } from '../controllers/analytics';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboardStats);
router.get('/timeline', getTimeline);
router.get('/threats', getThreatDistribution);
router.get('/devices', getDevicePerformance);

export default router;
