import { Request, Response, NextFunction } from 'express';
import { createTaskSchema, updateTaskSchema } from '../validations/taskValidation';
import { Task, TaskStatus } from '../models/Task';
import { AuthRequest } from '../middlewares/authMiddleware';
import { TaskHistory } from '../models/TaskHistory';
import { notificationQueue, redis } from '../config/redis';
import { invalidateUserTaskCache } from '../utils/cache';
import ApiError from '../utils/ApiError';
import { User } from '../models/User';

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {

    const { title, description, assignedTo, dueDate } = req.body;

    if (assignedTo) {
      const user = await User.exists({ _id: assignedTo });
      if (!user) {
        throw new ApiError(404, 'Assigned user not found');
      }
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      dueDate,
      createdBy: req.user?.userId,
    });

    await invalidateUserTaskCache(assignedTo);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

export const getUserTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status, dueBefore, dueAfter, page = '1', limit = '10' } = req.query;

    const cacheKey = `tasks:${userId}:page=${page}&limit=${limit}&status=${status}&dueBefore=${dueBefore}&dueAfter=${dueAfter}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      res.status(200).json(JSON.parse(cached));
      return;
    }

    const filters: any = { assignedTo: userId };

    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      filters.status = status;
    }

    if (dueBefore) filters.dueDate = { ...filters.dueDate, $lte: new Date(dueBefore as string) };
    if (dueAfter) filters.dueDate = { ...filters.dueDate, $gte: new Date(dueAfter as string) };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const tasks = await Task.find(filters)
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    await redis.set(cacheKey, JSON.stringify(tasks), { EX: 600 });
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};

export const getTaskById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) throw new ApiError(404, 'Task not found');

    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = updateTaskSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError(400, 'Validation failed', parsed.error.errors);
    }

    const existingTask = await Task.findById(id);
    if (!existingTask) throw new ApiError(404, 'Task not found');

    const updates = parsed.data;
    const updated = await Task.findByIdAndUpdate(id, updates, { new: true });

    const changedFields = Object.keys(updates);
    for (const field of changedFields) {
      const oldValue = (existingTask as any)[field];
      const newValue = (updates as any)[field];
      if (oldValue !== newValue) {
        await TaskHistory.create({
          taskId: id,
          action: 'update',
          field,
          oldValue,
          newValue,
          changedBy: req.user?.userId,
        });

        if (field === 'status' || field === 'assignedTo') {
          const targetUserId = field === 'assignedTo' ? updates.assignedTo : existingTask.assignedTo;
          if (targetUserId) {
            await notificationQueue.add('status_changed', {
              userId: targetUserId.toString(),
              taskId: id,
              message: `Task ${field} has been updated.`,
              type: 'status_changed',
            });
          }
        }
      }
    }

    if (updated?.assignedTo) {
      await invalidateUserTaskCache(updated.assignedTo.toString());
    }

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, 'Task not found');

    if (deleted.assignedTo) {
      await invalidateUserTaskCache(deleted.assignedTo.toString());
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const getTaskHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const history = await TaskHistory.find({ taskId: id })
      .sort({ createdAt: -1 })
      .populate('changedBy', 'name email');

    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
};
