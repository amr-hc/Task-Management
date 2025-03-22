import { Request, Response, NextFunction } from 'express';
import { Task, TaskStatus } from '../models/Task';
import { AuthRequest } from '../middlewares/authMiddleware';
import { notificationQueue, redis } from '../config/redis';
import { invalidateUserTaskCache } from '../utils/cache';
import ApiError from '../utils/ApiError';
import { User } from '../models/User';
import { UserTask } from '../models/UserTask';
import mongoose, { PipelineStage } from 'mongoose';
import { TaskHistory } from '../models/TaskHistory';

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { title, description, assignedTo = [], dueDate } = req.body;
    const createdBy = (req as any).user?.userId;

    const existingUsersCount = await User.countDocuments({ _id: { $in: assignedTo } }).session(session);
    if (existingUsersCount !== assignedTo.length) {
      throw new ApiError(404, 'One or more users not found');
    }

    const task = await Task.create([{ title, description, dueDate, createdBy }], { session });
    const taskId = task[0]._id;

    const userTaskDocs = assignedTo.map((userId: string) => ({ userId, taskId }));

    if (userTaskDocs.length > 0) {
      await UserTask.insertMany(userTaskDocs, { session });
    }
    
    for (const userId of assignedTo) {
      await invalidateUserTaskCache(userId);
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(task[0]);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

export const getUserTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status, dueBefore, dueAfter, page = '1', limit = '10' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const cacheKey = `tasks:${userId}:page=${page}&limit=${limit}&status=${status}&dueBefore=${dueBefore}&dueAfter=${dueAfter}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      res.status(200).json(JSON.parse(cached));
      return;
    } 

    const matchConditions = { userId: new mongoose.Types.ObjectId(userId) };

    const taskMatch: any = {};
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      taskMatch['task.status'] = status;
    }
    if (dueBefore) {
      taskMatch['task.dueDate'] = { ...taskMatch['task.dueDate'], $lte: new Date(dueBefore as string) };
    }
    if (dueAfter) {
      taskMatch['task.dueDate'] = { ...taskMatch['task.dueDate'], $gte: new Date(dueAfter as string) };
    }

    const pipeline: PipelineStage[] = [
      { $match: matchConditions },
      { $lookup: { from: 'tasks', localField: 'taskId', foreignField: '_id', as: 'task' } },
      { $unwind: '$task' },
      ...(Object.keys(taskMatch).length ? [{ $match: taskMatch }] : []),
      { $sort: { 'task.dueDate': 1 } },
      { $skip: skip },
      { $limit: limitNum },
      { $replaceRoot: { newRoot: '$task' } }
    ];

    const tasks = await UserTask.aggregate(pipeline);
    await redis.set(cacheKey, JSON.stringify(tasks), { EX: 600 });
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};

export const getTaskById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id).populate('createdBy', 'name email');
    if (!task) throw new ApiError(404, 'Task not found');

    const userTasks = await UserTask.find({ taskId: id }).populate('userId', 'name email');
    const assignees = userTasks.map(ut => ut.userId);

    res.status(200).json({
      ...task.toObject(),
      assignees
    });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { title, description, dueDate, status, assignedTo = [] } = req.body;
    const userId = (req as any).user?.userId;

    const existingUsersCount = await User.countDocuments({ _id: { $in: assignedTo } }).session(session);
    if (existingUsersCount !== assignedTo.length) {
      throw new ApiError(404, 'One or more users not found');
    }

    const oldTask = await Task.findOneAndUpdate(
      { _id: id },
      { $set: { title, description, dueDate, status } },
      { new: false, session }
    );
    if (!oldTask) throw new ApiError(404, 'Task not found');

    const changes = [];
    for (const field of ['title', 'description', 'dueDate', 'status']) {
      const oldValue = (oldTask as any)[field];
      const newValue = (req.body as any)[field];
      if (newValue && oldValue?.toString() !== newValue?.toString()) {
        changes.push({ field, oldValue, newValue });
      }
    }

    if (changes.length > 0) {
      await TaskHistory.create([{
        taskId: id,
        action: 'update',
        changes,
        changedBy: userId,
      }], { session });
    }

    const oldUserTasks = await UserTask.find({ taskId: id }).session(session);
    const oldUserIds = oldUserTasks.map(ut => ut.userId.toString());

    const removedUsers = oldUserIds.filter(uid => !assignedTo.includes(uid));
    if (removedUsers.length > 0) {
      await UserTask.deleteMany({ taskId: id, userId: { $in: removedUsers } }).session(session);
    }

    const newAssignees = assignedTo.filter((uid: string) => !oldUserIds.includes(uid));
    const newUserTasks = newAssignees.map((uid: string) => ({ userId: uid, taskId: id }));
    if (newUserTasks.length > 0) {
      await UserTask.insertMany(newUserTasks, { session });

      for (const uid of newAssignees) {
        await notificationQueue.add('status_changed', {
          userId: uid,
          taskId: id,
          message: 'Task was updated.',
          type: 'status_changed',
        });

        await invalidateUserTaskCache(uid);
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Task updated successfully' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) throw new ApiError(404, 'Task not found');

    const userTasks = await UserTask.find({ taskId: id });
    await UserTask.deleteMany({ taskId: id });

    for (const userTask of userTasks) {
      const userId = userTask.userId.toString();
      await notificationQueue.add('task_deleted', {
        userId,
        taskId: id,
        message: 'Task has been deleted.',
        type: 'task_deleted',
      });

      await invalidateUserTaskCache(userId);
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
