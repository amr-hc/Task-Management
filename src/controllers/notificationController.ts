import { Response } from 'express';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getUserNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.find({ userId: req.user?.userId })
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get notifications', details: err });
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user?.userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.status(200).json(notification);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification', details: err });
  }
};
