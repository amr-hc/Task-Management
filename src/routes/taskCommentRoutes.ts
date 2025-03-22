import { Router } from 'express';
import { addComment, getComments } from '../controllers/taskCommentController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/:taskId', authenticate, addComment);
router.get('/:taskId', authenticate, getComments);

export default router;
