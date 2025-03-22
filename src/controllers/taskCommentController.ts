import { Response } from 'express';
import { commentSchema } from '../validations/taskValidation';
import { TaskComment } from '../models/TaskComment';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Task } from '../models/Task';
import { notificationQueue } from '../config/redis';

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { taskId } = req.params;
  const parsed = commentSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors });
    return;
  }

  try {
    const comment = await TaskComment.create({
      taskId,
      userId: req.user?.userId,
      comment: parsed.data.comment,
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
    res.status(500).json({ error: 'Failed to add comment', details: err });
  }
};

export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  const { taskId } = req.params;

  try {
    const comments = await TaskComment.find({ taskId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get comments', details: err });
  }
};
