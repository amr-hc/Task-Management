import { Request, Response } from 'express';
import { createTaskSchema, updateTaskSchema } from '../validations/taskValidation';
import { Task, TaskStatus } from '../models/Task';
import { AuthRequest } from '../middlewares/authMiddleware';
import { TaskHistory } from '../models/TaskHistory';
import { notificationQueue } from '../config/redis';


export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors });
      return;
    }
  
    const { title, description, assignedTo, dueDate } = parsed.data;
  
    try {
      const task = await Task.create({
        title,
        description,
        assignedTo,
        dueDate,
        createdBy: req.user?.userId,
      });
  
      res.status(201).json(task);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create task', details: err });
    }
  };
  

export const getUserTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { status, dueBefore, dueAfter, page = '1', limit = '10' } = req.query;

  const filters: any = {
    assignedTo: userId,
  };

  if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
    filters.status = status;
  }

  if (dueBefore) {
    filters.dueDate = { ...filters.dueDate, $lte: new Date(dueBefore as string) };
  }

  if (dueAfter) {
    filters.dueDate = { ...filters.dueDate, $gte: new Date(dueAfter as string) };
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const tasks = await Task.find(filters)
    .sort({ dueDate: 1 })
    .skip(skip)
    .limit(parseInt(limit as string));

  res.status(200).json(tasks);
};

export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
  
    try {
      const task = await Task.findById(id)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');
  
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
  
      res.status(200).json(task);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching task' });
    }
  };

  export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const parsed = updateTaskSchema.safeParse(req.body);
  
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors });
      return;
    }
  
    try {
      const existingTask = await Task.findById(id);
      if (!existingTask) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
  
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
      
          // ✨ إرسال إشعار للمستخدم المكلّف
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
  
      res.status(200).json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update task', details: err });
    }
  };
  

  export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
  
    try {
      const deleted = await Task.findByIdAndDelete(id);
  
      if (!deleted) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
  
      res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete task', details: err });
    }
  };


export const getTaskHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const history = await TaskHistory.find({ taskId: id })
      .sort({ createdAt: -1 })
      .populate('changedBy', 'name email');

    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history', details: err });
  }
};
