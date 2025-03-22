import { redis } from '../config/redis';

export const invalidateUserTaskCache = async (userId: string) => {
  const keys = await redis.keys(`tasks:${userId}:*`);
  await Promise.all(keys.map((key) => redis.del(key)));
};
