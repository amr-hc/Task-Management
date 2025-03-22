import { Worker } from 'bullmq';
import { Notification } from '../models/Notification';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI as string);

const connection = {
  host: '127.0.0.1',
  port: 6379,
};

const worker = new Worker(
  'notifications',
  async (job) => {
    const { userId, taskId, message, type } = job.data;

    await Notification.create({
      userId,
      taskId,
      message,
      type,
      read: false,
    });
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Notification job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err);
});
