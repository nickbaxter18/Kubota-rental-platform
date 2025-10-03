import * as Sentry from '@sentry/node';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event, hint) {
    // Filter out health check errors
    if (event.request?.url?.includes('/health')) {
      return null;
    }
    return event;
  },
});

// Performance monitoring
export const monitorPerformance = {
  setTag: (key: string, value: string) => {
    Sentry.setTag(key, value);
  },

  setUser: (user: any) => {
    Sentry.setUser(user);
  },

  captureException: (error: Error, context?: any) => {
    Sentry.captureException(error, { data: context });
  },

  captureMessage: (message: string, level: Sentry.SeverityLevel = 'info') => {
    Sentry.captureMessage(message, level);
  }
};

// Health check service integrations
export const healthCheck = {
  database: async (dataSource: any) => {
    try {
      const result = await dataSource.query('SELECT 1');
      return result.length > 0;
    } catch (error) {
      if (error instanceof Error) {
        Sentry.captureException(error);
      }
      return false;
    }
  },

  redis: async (redisClient: any) => {
    try {
      const result = await redisClient.ping();
      return result === 'PONG';
    } catch (error) {
      if (error instanceof Error) {
        Sentry.captureException(error);
      }
      return false;
    }
  },

  externalServices: async () => {
    const services = [
      { name: 'Cloudflare', url: 'https://api.cloudflare.com/client/v4/user' },
      { name: 'Stripe', url: 'https://api.stripe.com/v1/charges' }
    ];

    const results = await Promise.allSettled(
      services.map(async (service) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(service.url, {
            headers: {
              'Authorization': `Bearer ${process.env[`${service.name.toUpperCase()}_API_KEY`]}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          return { name: service.name, status: response.ok };
        } catch (error) {
          return { name: service.name, status: false };
        }
      })
    );

    return results.map(result =>
      result.status === 'fulfilled' ? result.value : { name: 'unknown', status: false }
    );
  }
};
