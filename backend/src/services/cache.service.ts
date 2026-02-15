import Redis from 'ioredis';
import NodeCache from 'node-cache';

// Initialize in-memory cache as fallback
const memoryCache = new NodeCache({ stdTTL: 600 }); // 10 minutes default

let redisClient: Redis | null = null;
let isRedisConnected = false;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.log('[Cache] Redis connection failed too many times. Disabling Redis.');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      }
    });

    redisClient.on('connect', () => {
      console.log('[Cache] Redis connected successfully');
      isRedisConnected = true;
    });

    redisClient.on('error', (err) => {
      console.error('[Cache] Redis error:', err.message);
      isRedisConnected = false;
    });
  } catch (error) {
    console.error('[Cache] Failed to initialize Redis:', error);
  }
}

export const cacheService = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      if (isRedisConnected && redisClient) {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        return memoryCache.get<T>(key) || null;
      }
    } catch (error) {
      console.error('[Cache] Get error:', error);
      return null;
    }
  },

  set: async (key: string, value: any, ttlSeconds: number = 600): Promise<boolean> => {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return true;
      } else {
        return memoryCache.set(key, value, ttlSeconds);
      }
    } catch (error) {
      console.error('[Cache] Set error:', error);
      return false;
    }
  },

  del: async (key: string): Promise<void> => {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.del(key);
      } else {
        memoryCache.del(key);
      }
    } catch (error) {
      console.error('[Cache] Del error:', error);
    }
  },

  flush: async (): Promise<void> => {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.flushall();
      } else {
        memoryCache.flushAll();
      }
    } catch (error) {
      console.error('[Cache] Flush error:', error);
    }
  }
};
