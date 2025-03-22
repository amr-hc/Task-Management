import { Router } from 'express';
import { createTask } from '../controllers/taskController';
import { getUserTasks, getTaskById, updateTask, deleteTask, getTaskHistory } from '../controllers/taskController';
import { validate } from '../middlewares/validate';
import { createTaskSchema, updateTaskSchema } from '../validations/taskValidation';
import { authorizeRoles } from '../middlewares/authMiddleware';


const router = Router();

router.post('/', validate(createTaskSchema) , createTask);

router.get('/user/:userId', getUserTasks);

router.route('/:id')
  .get(getTaskById)
  .put(validate(updateTaskSchema), updateTask)
  .delete(authorizeRoles('admin'), deleteTask);

router.get('/:id/history', getTaskHistory);


export default router;
