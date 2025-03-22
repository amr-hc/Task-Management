import { Response, NextFunction } from 'express';
import { commentSchema } from '../validations/taskValidation';
import { TaskComment } from '../models/TaskComment';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Task } from '../models/Task';
import { notificationQueue } from '../config/redis';
import ApiError from '../utils/ApiError';

export const addComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { taskId } = req.params;
    const comment = await TaskComment.create({
      taskId,
      userId: req.user?.userId,
      comment: req.body.comment,
    });

    const task = await Task.findById(taskId);
    if (task?.assignedTo) {
      await notificationQueue.add('new_comment', {
        userId: task.assignedTo.toString(),
        taskId,
        message: 'New comment added to your task',
        type: 'new_comment',
      });
    }

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { taskId } = req.params;

    const comments = await TaskComment.find({ taskId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
};
