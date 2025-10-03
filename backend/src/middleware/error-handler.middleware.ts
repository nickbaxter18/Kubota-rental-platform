import * as Sentry from '@sentry/node';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    correlationId: string;
    timestamp: string;
    path: string;
    method: string;
    statusCode?: number;
  };
}

export class ErrorHandlerMiddleware {
  static handle(error: any, req: Request, res: Response, next: NextFunction) {
    const correlationId = (req as any).correlationId || req.headers['x-correlation-id'] as string || uuidv4();

    // Enhanced error logging
    const errorContext = {
      correlationId,
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      userId: (req as any).user?.id,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      body: req.method !== 'GET' ? req.body : undefined,
      params: req.params,
      query: req.query,
      timestamp: new Date().toISOString(),
    };

    console.error('Error occurred:', errorContext);

    // Send to Sentry if configured
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setTag('correlationId', correlationId);
        scope.setTag('method', req.method);
        scope.setTag('path', req.originalUrl);
        scope.setUser({ id: (req as any).user?.id });
        scope.setContext('request', {
          method: req.method,
          url: req.originalUrl,
          body: req.method !== 'GET' ? req.body : undefined,
        });
        Sentry.captureException(error);
      });
    }

    // Determine error type and response
    const errorResponse = this.buildErrorResponse(error, correlationId, req);

    res.status(errorResponse.error.statusCode || 500).json(errorResponse);
  }

  private static buildErrorResponse(error: any, correlationId: string, req: Request): ErrorResponse {
    const timestamp = new Date().toISOString();

    // Handle known error types
    if (error.name === 'ValidationError') {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details,
          correlationId,
          timestamp,
          path: req.originalUrl,
          method: req.method,
          statusCode: 400,
        },
      };
    }

    if (error.name === 'UnauthorizedError') {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          correlationId,
          timestamp,
          path: req.originalUrl,
          method: req.method,
          statusCode: 401,
        },
      };
    }

    // Default server error
    return {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        correlationId,
        timestamp,
        path: req.originalUrl,
        method: req.method,
        statusCode: 500,
      },
    };
  }
}
