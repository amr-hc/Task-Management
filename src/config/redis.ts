import { Queue } from 'bullmq';
import { createClient } from 'redis';

export const redis = createClient({
  url: 'redis://127.0.0.1:6379',
});

redis.connect();

export const notificationQueue = new Queue('notifications', {
  connection: {
    host: '127.0.0.1',
    port: 6379,
  },
});
