import Redis from 'ioredis';
import { logger } from './logger';

export class RateLimiter {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Check if user has exceeded rate limit
   * @param userId User identifier
   * @param action Action identifier
   * @param maxRequests Maximum requests allowed
   * @param windowMs Time window in milliseconds
   */
  async checkLimit(userId: string, action: string, maxRequests: number, windowMs: number): Promise<void> {
    const key = `rate_limit:${action}:${userId}`;
    const windowSeconds = Math.ceil(windowMs / 1000);

    try {
      const current = await this.redis.incr(key);
      
      if (current === 1) {
        // First request, set expiration
        await this.redis.expire(key, windowSeconds);
      }

      if (current > maxRequests) {
        const ttl = await this.redis.ttl(key);
        logger.warn('Rate limit exceeded', {
          userId,
          action,
          current,
          maxRequests,
          ttl,
        });

        throw new Error(`Rate limit exceeded. Try again in ${ttl} seconds.`);
      }

      logger.debug('Rate limit check passed', {
        userId,
        action,
        current,
        maxRequests,
      });

    } catch (error) {
      if (error.message.includes('Rate limit exceeded')) {
        throw error;
      }
      
      logger.error('Rate limiter error', { userId, action, error });
      // Continue on Redis errors to not block the service
    }
  }

  /**
   * Get current rate limit status
   */
  async getStatus(userId: string, action: string): Promise<{
    current: number;
    max: number;
    remaining: number;
    resetTime: number;
  }> {
    const key = `rate_limit:${action}:${userId}`;
    
    try {
      const current = await this.redis.get(key);
      const ttl = await this.redis.ttl(key);
      
      return {
        current: parseInt(current || '0'),
        max: 100, // Default max
        remaining: Math.max(0, 100 - parseInt(current || '0')),
        resetTime: ttl > 0 ? Date.now() + (ttl * 1000) : 0,
      };
    } catch (error) {
      logger.error('Rate limiter status error', { userId, action, error });
      return {
        current: 0,
        max: 100,
        remaining: 100,
        resetTime: 0,
      };
    }
  }

  /**
   * Reset rate limit for user
   */
  async reset(userId: string, action: string): Promise<void> {
    const key = `rate_limit:${action}:${userId}`;
    
    try {
      await this.redis.del(key);
      logger.info('Rate limit reset', { userId, action });
    } catch (error) {
      logger.error('Rate limiter reset error', { userId, action, error });
    }
  }
}