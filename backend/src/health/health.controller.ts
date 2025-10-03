import { Controller, Get } from '@nestjs/common';
import { healthCheck } from '../monitoring/sentry.config';

@Controller('health')
export class HealthController {
  @Get()
  async check() {
    const checks: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {},
      memory: {}
    };

    // Database health check
    try {
      const dbHealthy = await healthCheck.database(global.dataSource);
      checks.services.database = {
        status: dbHealthy ? 'up' : 'down',
        details: dbHealthy ? 'Database connection successful' : 'Database connection failed'
      };

      if (!dbHealthy) {
        checks.status = 'error';
      }
    } catch (error) {
      checks.services.database = {
        status: 'down',
        details: error.message
      };
      checks.status = 'error';
    }

    // Redis health check
    try {
      const redisHealthy = await healthCheck.redis(global.redisClient);
      checks.services.redis = {
        status: redisHealthy ? 'up' : 'down',
        details: redisHealthy ? 'Redis connection successful' : 'Redis connection failed'
      };

      if (!redisHealthy) {
        checks.status = 'error';
      }
    } catch (error) {
      checks.services.redis = {
        status: 'down',
        details: error.message
      };
      checks.status = 'error';
    }

    // External services health check
    try {
      const services = await healthCheck.externalServices();
      const allServicesUp = services.every(service => service.status);

      checks.services.external_services = {
        status: allServicesUp ? 'up' : 'down',
        details: services,
        message: allServicesUp ? 'All external services operational' : 'Some external services unavailable'
      };

      if (!allServicesUp) {
        checks.status = 'warning';
      }
    } catch (error) {
      checks.services.external_services = {
        status: 'down',
        details: error.message
      };
      checks.status = 'error';
    }

    // Memory usage check
    const memUsage = process.memoryUsage();
    checks.memory = {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heap_used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heap_total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024) // MB
    };

    // Set HTTP status based on overall health
    const httpStatus = checks.status === 'ok' ? 200 : checks.status === 'warning' ? 200 : 503;

    return {
      statusCode: httpStatus,
      ...checks
    };
  }

  @Get('readiness')
  async readiness() {
    try {
      const dbHealthy = await healthCheck.database(global.dataSource);
      return {
        status: dbHealthy ? 'ok' : 'error',
        database: dbHealthy ? 'ready' : 'not ready'
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'not ready',
        error: error.message
      };
    }
  }

  @Get('liveness')
  async liveness() {
    const memUsage = process.memoryUsage();

    // Consider service dead if heap usage is too high
    if (memUsage.heapUsed > 300 * 1024 * 1024) { // 300MB
      return {
        status: 'error',
        message: 'Memory usage too high',
        memory_usage_mb: Math.round(memUsage.heapUsed / 1024 / 1024)
      };
    }

    return {
      status: 'ok',
      message: 'Service is alive',
      memory_usage_mb: Math.round(memUsage.heapUsed / 1024 / 1024)
    };
  }
}
