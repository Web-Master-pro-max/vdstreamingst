const Redis = require('ioredis');
const fs = require('fs');

let lastRedisErrorTime = 0;
const defaultRedisUrl = fs.existsSync('/.dockerenv') ? 'redis://redis:6379' : 'redis://127.0.0.1:6379';
const redisUrl = process.env.REDIS_URL || defaultRedisUrl;

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
  lazyConnect: false,
  retryStrategy(times) {
    // Retry periodically without blocking node event loop
    return Math.min(times * 2000, 30000);
  }
});

redis.on('error', (err) => {
  const now = Date.now();
  if (now - lastRedisErrorTime > 60000) {
    console.warn(`[Redis Notice] Redis is not reachable at ${redisUrl} (${err.message}). Native sequential transcode manager is actively running.`);
    lastRedisErrorTime = now;
  }
});

module.exports = redis;
