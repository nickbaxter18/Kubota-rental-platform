import * as Sentry from '@sentry/nextjs';

export interface ErrorContext {
  correlationId?: string;
  userId?: string;
  component?: string;
  action?: string;
  state?: any;
  timestamp: string;
}

export class ErrorMonitor {
  static setup() {
    if (process.env.NODE_ENV === 'production') {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 1.0,
        environment: process.env.NODE_ENV,
        attachStacktrace: true,
        beforeSend: (event, hint) => {
          // Sanitize sensitive data
          if (event.extra) {
            delete event.extra.password;
            delete event.extra.token;
            delete event.extra.creditCard;
          }
          return event;
        },
      });
    }

    // Global error handlers
    this.setupGlobalErrorHandlers();
  }

  private static setupGlobalErrorHandlers() {
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        component: 'GlobalErrorHandler',
        action: 'window.error',
        timestamp: new Date().toISOString(),
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        component: 'GlobalErrorHandler',
        action: 'unhandledrejection',
        timestamp: new Date().toISOString(),
      });
    });
  }

  static captureError(error: Error, context: Partial<ErrorContext> = {}) {
    const fullContext: ErrorContext = {
      correlationId: this.getCurrentCorrelationId(),
      userId: this.getCurrentUserId(),
      timestamp: new Date().toISOString(),
      ...context,
    };

    console.error('Error captured:', error, fullContext);

    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope((scope) => {
        scope.setTag('component', context.component || 'Unknown');
        scope.setTag('action', context.action || 'Unknown');
        if (context.correlationId) {
          scope.setTag('correlationId', context.correlationId);
        }
        if (context.userId) {
          scope.setUser({ id: context.userId });
        }
        if (context.state) {
          scope.setContext('state', this.sanitizeState(context.state));
        }
        Sentry.captureException(error);
      });
    }
  }

  static captureStateSnapshot(state: any, component: string) {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      console.log(`State snapshot for ${component}:`, this.sanitizeState(state));
    }

    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope((scope) => {
        scope.setTag('component', component);
        scope.setContext('stateSnapshot', this.sanitizeState(state));
        scope.addBreadcrumb({
          category: 'state',
          message: `State snapshot captured for ${component}`,
          level: 'info',
        });
      });
    }
  }

  private static sanitizeState(state: any): any {
    if (!state) return state;

    const sensitiveKeys = ['password', 'token', 'creditCard', 'ssn', 'secret'];
    const sanitized = { ...state };

    const sanitizeObject = (obj: any) => {
      for (const key in obj) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  private static getCurrentCorrelationId(): string | undefined {
    // Try to get correlation ID from current request context
    return (window as any).__CORRELATION_ID__;
  }

  private static getCurrentUserId(): string | undefined {
    // Try to get user ID from current user context
    return (window as any).__USER_ID__;
  }
}
