import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import {
  getUserNotifications,
  markNotificationAsRead,
} from '../controllers/notificationController';

const router = Router();

router.get('/', authenticate, getUserNotifications);
router.patch('/:id/read', authenticate, markNotificationAsRead);

export default router;
