import { Router } from 'express';
import { getDevices, createDevice, getDevice } from '../controllers/devices';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getDevices);
router.post('/', createDevice);
router.get('/:id', getDevice);

export default router;
