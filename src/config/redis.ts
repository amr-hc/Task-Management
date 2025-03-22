import { Queue } from 'bullmq';
import { createClient } from 'redis';
const REDIS_URI = process.env.REDIS_URI!;

export const redis = createClient({
  url: REDIS_URI,
});

export const notificationQueue = new Queue('notifications', {
  connection: {
    url: REDIS_URI,
  },
});

