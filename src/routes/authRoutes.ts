import { Router, Request, Response } from 'express';
import { register, login, handleRefreshToken } from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { loginSchema, refreshTokenSchema, registerSchema } from '../validations/authValidation';

const router: Router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', validate(refreshTokenSchema), handleRefreshToken);

export default router;
