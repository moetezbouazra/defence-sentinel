import { Router } from 'express';
import { getDevices, createDevice, getDevice } from '../controllers/devices';
import { authenticateToken } from '../middleware/auth';
import { validate, createDeviceSchema } from '../middleware/validation';

const router = Router();

router.use(authenticateToken);

router.get('/', getDevices);
router.post('/', validate(createDeviceSchema), createDevice);
router.get('/:id', getDevice);

export default router;
