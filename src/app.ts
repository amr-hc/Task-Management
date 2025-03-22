import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import protectedRoutes from './routes/protectedRoutes';
import taskRoutes from './routes/taskRoutes';
import taskCommentRoutes from './routes/taskCommentRoutes';
import notificationRoutes from './routes/notificationRoutes';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler';
import { authenticate } from './middlewares/authMiddleware';
import { apiRateLimiter } from './middlewares/rateLimiter';

dotenv.config();


const app = express();

app.use(apiRateLimiter);
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});


app.use('/api/auth', authRoutes);
app.use(authenticate);
app.use('/api/protected', protectedRoutes);
app.use('/api/tasks/comments', taskCommentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler as express.ErrorRequestHandler);

export default app;
