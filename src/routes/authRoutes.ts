import { Router, Request, Response } from 'express';
import { register, login, handleRefreshToken } from '../controllers/authController';

const router: Router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', handleRefreshToken);

export default router;
