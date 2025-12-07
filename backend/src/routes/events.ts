import { Router } from 'express';
import { getEvents, getEventById, deleteEvent, createManualEvent } from '../controllers/events';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getEvents);
router.get('/:id', authenticateToken, getEventById);
router.delete('/:id', authenticateToken, deleteEvent);
router.post('/upload', authenticateToken, createManualEvent);

export default router;
