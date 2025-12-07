import { Router } from 'express';
import { register, login, getMe, updateProfile } from '../controllers/auth';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validate, registerSchema, loginSchema, updateProfileSchema } from '../middleware/validation';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, validate(updateProfileSchema), updateProfile);

export default router;
