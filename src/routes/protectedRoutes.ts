import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

router.get('/admin-only', authenticate, authorizeRoles('admin'), (req, res) => {
  res.json({ msg: 'Welcome admin!' });
});

router.get('/manager-or-admin', authenticate, authorizeRoles('admin', 'manager'), (req, res) => {
  res.json({ msg: 'Welcome manager or admin!' });
});

export default router;
