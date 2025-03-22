import { Router } from 'express';
import { addComment, getComments } from '../controllers/taskCommentController';
import { authenticate } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { commentSchema } from '../validations/taskValidation';

const router = Router();

router.post('/:taskId', authenticate, validate(commentSchema), addComment);
router.get('/:taskId', authenticate, getComments);

export default router;
