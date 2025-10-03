import { BullRootModuleOptions } from '@nestjs/bullmq';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import { RedisOptions } from 'ioredis';

export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: 'udigit:',
  enableReadyCheck: true,
  maxRetriesPerRequest: null,
  lazyConnect: true,
};

export const redisOptions: RedisOptions = {
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  db: redisConfig.db,
  keyPrefix: redisConfig.keyPrefix,
  enableReadyCheck: redisConfig.enableReadyCheck,
  maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
  lazyConnect: redisConfig.lazyConnect,
  // Connection options
  connectTimeout: 10000,
  commandTimeout: 5000,
  // TLS options (for production)
  ...(process.env.REDIS_TLS === 'true' && {
    tls: {
      rejectUnauthorized: false,
    },
  }),
};

// Cache configuration using Redis
export const cacheConfig: CacheModuleOptions = {
  store: 'redis',
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  ttl: 300, // 5 minutes default TTL
  max: 1000, // Maximum number of items in memory
};

// BullMQ configuration for job queues
export const bullConfig: BullRootModuleOptions = {
  connection: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 1000, // Start with 1 second delay
    },
  },
};

// Queue names
export const QUEUES = {
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
  BOOKING_PROCESSING: 'booking-processing',
  PDF_GENERATION: 'pdf-generation',
  CLEANUP: 'cleanup',
} as const;

// Job priorities
export const JOB_PRIORITIES = {
  HIGH: 1,
  NORMAL: 5,
  LOW: 10,
} as const;
