import { Router } from 'express';
import { getEvents, getEventById, deleteEvent, createManualEvent } from '../controllers/events';
import { authenticateToken } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', authenticateToken, getEvents);
router.get('/:id', authenticateToken, getEventById);
router.delete('/:id', authenticateToken, deleteEvent);
router.post('/upload', authenticateToken, uploadLimiter, createManualEvent);

export default router;
