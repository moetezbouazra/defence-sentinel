import { Router } from 'express';
import { getAlerts, getUnreadCount, acknowledgeAlert } from '../controllers/alerts';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getAlerts);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.post('/:id/acknowledge', authenticateToken, acknowledgeAlert);

export default router;
