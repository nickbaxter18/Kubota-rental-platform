import * as Sentry from '@sentry/nextjs';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Record custom metrics
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // Keep only last 100 measurements
    if (this.metrics.get(name)!.length > 100) {
      this.metrics.get(name)!.shift();
    }

    // Send to Sentry if in production
    if (process.env.NODE_ENV === 'production') {
      Sentry.setTag('metric.name', name);
      Sentry.setContext('metric', { name, value });
    }
  }

  // Get metric statistics
  getMetricStats(name: string) {
    const _values = this.metrics.get(name) || [];
    if (_values.length === 0) return null;

    const sum = _values.reduce((a, b) => a + b, 0);
    const avg = sum / _values.length;
    const min = Math.min(..._values);
    const max = Math.max(..._values);

    return { avg, min, max, count: _values.length };
  }

  // Record API call duration
  recordApiCall(endpoint: string, duration: number, method: string = 'GET') {
    this.recordMetric(`api.${method}.${endpoint}`, duration);

    // Track slow API calls (> 1000ms)
    if (duration > 1000) {
      Sentry.captureMessage(`Slow API call: ${method} ${endpoint}`, {
        level: 'warning',
        extra: { duration, endpoint, method },
      });
    }
  }

  // Record component render time
  recordRenderTime(componentName: string, duration: number) {
    this.recordMetric(`render.${componentName}`, duration);

    // Alert on slow renders (> 100ms)
    if (duration > 100) {
      Sentry.captureMessage(`Slow component render: ${componentName}`, {
        level: 'warning',
        extra: { duration, componentName },
      });
    }
  }

  // Record user interaction
  recordUserInteraction(action: string, duration?: number) {
    this.recordMetric(`interaction.${action}`, duration || 0);

    if (duration && duration > 500) {
      Sentry.captureMessage(`Slow user interaction: ${action}`, {
        level: 'info',
        extra: { duration, action },
      });
    }
  }

  // Flush all metrics to monitoring service
  async flush() {
    if (process.env.NODE_ENV === 'production') {
      // Send aggregated metrics to Sentry
      Array.from(this.metrics.entries()).forEach(([name, values]) => {
        const stats = this.getMetricStats(name);
        if (stats) {
          Sentry.setContext('metrics', { [name]: stats });
        }
      });
    }
  }
}

// Web Vitals monitoring
export function reportWebVitals(metric: any) {
  // Record Core Web Vitals
  const monitor = PerformanceMonitor.getInstance();

  switch (metric.name) {
    case 'FCP':
      monitor.recordMetric('web-vitals.fcp', metric.value);
      break;
    case 'LCP':
      monitor.recordMetric('web-vitals.lcp', metric.value);
      break;
    case 'CLS':
      monitor.recordMetric('web-vitals.cls', metric.value);
      break;
    case 'FID':
      monitor.recordMetric('web-vitals.fid', metric.value);
      break;
    case 'TTFB':
      monitor.recordMetric('web-vitals.ttfb', metric.value);
      break;
    case 'INP':
      monitor.recordMetric('web-vitals.inp', metric.value);
      break;
  }

  // Send to Sentry
  if (process.env.NODE_ENV === 'production') {
    Sentry.setTag(`web-vitals.${metric.name}`, metric.value);
    Sentry.setContext('web-vitals', { [metric.name]: metric.value });
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', metric);
  }
}

// Error boundary monitoring
export function captureErrorBoundary(error: Error, errorInfo: any) {
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  });
}

// API error monitoring
export function captureApiError(error: any, endpoint: string, method: string) {
  Sentry.captureException(error, {
    tags: {
      type: 'api_error',
      endpoint,
      method,
    },
    extra: {
      endpoint,
      method,
      statusCode: error.statusCode,
      message: error.message,
    },
  });
}

// Performance observer for detailed metrics
export function setupPerformanceObserver() {
  if (typeof window === 'undefined') return;

  // Observe Long Tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const perfEntry = entry as PerformanceEntry & { duration?: number };
          if (perfEntry.duration && perfEntry.duration > 50) { // Only track tasks > 50ms
            Sentry.setTag('performance.long-task', perfEntry.duration);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      // Long task API not supported
    }
  }

  // Observe Layout Shifts
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutEntry = entry as PerformanceEntry & { value?: number };
          if (layoutEntry.value && layoutEntry.value > 0.1) { // Only track significant layout shifts
            Sentry.setTag('performance.layout-shift', layoutEntry.value);
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      // Layout shift API not supported
    }
  }
}

// Database query monitoring
export function recordDatabaseQuery(query: string, duration: number, success: boolean = true) {
  const monitor = PerformanceMonitor.getInstance();

  monitor.recordMetric(`db.query.duration`, duration);

  if (!success) {
    monitor.recordMetric(`db.query.errors`, 1);
    Sentry.captureMessage('Database query failed', {
      level: 'error',
      extra: { query, duration },
    });
  }

  // Alert on slow queries
  if (duration > 1000) {
    Sentry.captureMessage('Slow database query', {
      level: 'warning',
      extra: { query, duration },
    });
  }
}

// Queue job monitoring
export function recordQueueJob(queueName: string, jobName: string, duration: number, success: boolean = true) {
  const monitor = PerformanceMonitor.getInstance();

  monitor.recordMetric(`queue.${queueName}.${jobName}`, duration);

  if (!success) {
    monitor.recordMetric(`queue.${queueName}.errors`, 1);
    Sentry.captureMessage(`Queue job failed: ${queueName}.${jobName}`, {
      level: 'error',
      extra: { queueName, jobName, duration },
    });
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
