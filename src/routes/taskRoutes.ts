import { Router } from 'express';
import { createTask } from '../controllers/taskController';
import { authenticate } from '../middlewares/authMiddleware';
import { getUserTasks, getTaskById, updateTask, deleteTask, getTaskHistory } from '../controllers/taskController';
import { validate } from '../middlewares/validate';
import { createTaskSchema } from '../validations/taskValidation';


const router = Router();

router.post('/', authenticate,validate(createTaskSchema) , createTask);

router.get('/user/:userId', authenticate, getUserTasks);

router.get('/:id', authenticate, getTaskById);

router.put('/:id', authenticate, updateTask);

router.delete('/:id', authenticate, deleteTask);

router.get('/:id/history', authenticate, getTaskHistory);


export default router;
