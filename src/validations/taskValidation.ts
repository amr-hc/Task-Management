import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  assignedTo: z.array(z.string().min(24, 'Invalid user ID')).optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  status: z.enum(['todo', 'in_progress', 'done']),
  dueDate: z.string().datetime(),
  assignedTo: z.string().min(24).optional(),
});

export const commentSchema = z.object({
  comment: z.string().min(1),
});
  