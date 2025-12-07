import { Router } from 'express';
import { getDetections, getDetectionStats } from '../controllers/detections';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getDetections);
router.get('/stats', authenticateToken, getDetectionStats);

export default router;
