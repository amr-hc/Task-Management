import { Worker } from 'bullmq';
import { Notification } from '../models/Notification';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI as string);

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
  {
    connection: {
      url: process.env.REDIS_URI,
    },
  }
);

worker.on('completed', (job) => {
  console.log(`Notification job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err);
});
