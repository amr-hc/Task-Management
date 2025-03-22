import { Response, NextFunction } from 'express';
import { TaskComment } from '../models/TaskComment';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Task } from '../models/Task';
import { notificationQueue } from '../config/redis';
import ApiError from '../utils/ApiError';
import { UserTask } from '../models/UserTask';

export const addComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { taskId } = req.params;
    const exists = await Task.exists({ _id: taskId });
    if (!exists) {
      throw new ApiError(404, 'Task not found');
    }
    const comment = await TaskComment.create({
      taskId,
      userId: req.user?.userId,
      comment: req.body.comment,
    });

    const assignees = await UserTask.find({ taskId }, 'userId');

    for (const assignee of assignees) {
      await notificationQueue.add('new_comment', {
        userId: assignee.userId.toString(),
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const skip = (page - 1) * limit;

    const comments = await TaskComment.find({ taskId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email');
    const total = await TaskComment.countDocuments({ taskId });

    res.status(200).json({
      data: comments,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

