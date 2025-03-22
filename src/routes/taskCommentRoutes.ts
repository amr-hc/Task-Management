import { Router } from 'express';
import { addComment, getComments } from '../controllers/taskCommentController';
import { validate } from '../middlewares/validate';
import { commentSchema } from '../validations/taskValidation';

const router = Router();

router
  .route('/:taskId')
  .post(validate(commentSchema), addComment)
  .get(getComments);

export default router;
