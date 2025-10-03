import { NextFunction, Request, Response } from 'express';

export interface RequestWithTiming extends Request {
  startTime: number;
}

export class PerformanceMiddleware {
  static handle(req: RequestWithTiming, res: Response, next: NextFunction) {
    (req as any).startTime = Date.now();

    // Log response time when request completes
    res.on('finish', () => {
      const duration = Date.now() - (req as any).startTime;

      console.log(`Performance: ${req.method} ${req.originalUrl} - ${duration}ms`);

      // Log slow requests
      if (duration > 500) {
        console.warn(`Slow request detected: ${req.method} ${req.originalUrl} - ${duration}ms`, {
          correlationId: (req as any).correlationId,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });
      }
    });

    next();
  }
}
