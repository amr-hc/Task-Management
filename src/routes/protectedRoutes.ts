import { Router } from 'express';
import { authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

router.get('/admin-only', authorizeRoles('admin'), (req, res) => {
  res.json({ msg: 'Welcome admin!' });
});

router.get('/manager-or-admin', authorizeRoles('admin', 'manager'), (req, res) => {
  res.json({ msg: 'Welcome manager or admin!' });
});

export default router;
