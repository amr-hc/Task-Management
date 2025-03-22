import { Router } from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
} from '../controllers/notificationController';

const router = Router();

router.get('/', getUserNotifications);
router.patch('/:id/read', markNotificationAsRead);

export default router;
