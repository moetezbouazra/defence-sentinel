import { Router } from 'express';
import { getAlerts, getUnreadCount, acknowledgeAlert } from '../controllers/alerts';
import { authenticateToken } from '../middleware/auth';
import { readLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', authenticateToken, readLimiter, getAlerts);
router.get('/unread-count', authenticateToken, readLimiter, getUnreadCount);
router.post('/:id/acknowledge', authenticateToken, acknowledgeAlert);

export default router;
