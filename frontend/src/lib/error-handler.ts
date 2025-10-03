import { toast } from 'react-hot-toast';

// Error types for better error handling
export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

// Error codes for different scenarios
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',

  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Business logic errors
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  EQUIPMENT_NOT_AVAILABLE: 'EQUIPMENT_NOT_AVAILABLE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',

  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Client errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection error. Please check your internet connection.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  [ERROR_CODES.UNAUTHORIZED]: 'Please log in to continue.',
  [ERROR_CODES.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ERROR_CODES.BOOKING_NOT_FOUND]: 'Booking not found.',
  [ERROR_CODES.EQUIPMENT_NOT_AVAILABLE]: 'Equipment is not available for the selected dates.',
  [ERROR_CODES.PAYMENT_FAILED]: 'Payment failed. Please try again or contact support.',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

class ErrorHandler {
  private errorLog: AppError[] = [];
  private maxLogSize = 50;

  // Convert API errors to AppError format
  normalizeError(error: any): AppError {
    const appError: AppError = {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
      statusCode: 500,
      timestamp: new Date().toISOString(),
      requestId: error.requestId,
    };

    // Handle API errors
    if (error.statusCode && error.code) {
      appError.code = error.code;
      appError.statusCode = error.statusCode;
      appError.details = error.details;
      appError.message = error.message || ERROR_MESSAGES[error.code] || appError.message;
    }
    // Handle network errors
    else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      appError.code = ERROR_CODES.NETWORK_ERROR;
      appError.message = ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR];
    }
    // Handle timeout errors
    else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      appError.code = ERROR_CODES.TIMEOUT_ERROR;
      appError.message = ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR];
    }
    // Handle axios errors
    else if (error.response) {
      appError.statusCode = error.response.status;
      appError.message = error.response.data?.message || error.message;

      // Map HTTP status codes to error codes
      switch (error.response.status) {
        case 400:
          appError.code = ERROR_CODES.VALIDATION_ERROR;
          break;
        case 401:
          appError.code = ERROR_CODES.UNAUTHORIZED;
          break;
        case 403:
          appError.code = ERROR_CODES.FORBIDDEN;
          break;
        case 404:
          appError.code = ERROR_CODES.BOOKING_NOT_FOUND;
          break;
        case 429:
          appError.code = ERROR_CODES.RATE_LIMIT_EXCEEDED;
          break;
        case 500:
          appError.code = ERROR_CODES.INTERNAL_SERVER_ERROR;
          break;
        case 503:
          appError.code = ERROR_CODES.SERVICE_UNAVAILABLE;
          break;
      }
    }

    return appError;
  }

  // Handle and display errors to users
  handleError(error: any, options?: {
    showToast?: boolean;
    toastDuration?: number;
    context?: string;
  }) {
    const appError = this.normalizeError(error);

    // Log error for debugging
    this.logError(appError);

    // Show user-friendly error message
    if (options?.showToast !== false) {
      this.showErrorToast(appError, options);
    }

    // Handle specific error scenarios
    this.handleSpecificErrors(appError);

    return appError;
  }

  private logError(error: AppError) {
    // Add to local error log
    this.errorLog.unshift(error);

    // Keep only recent errors
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', error);
    }

    // TODO: Send to error reporting service (Sentry, LogRocket, etc.)
    // this.reportError(error);
  }

  private showErrorToast(error: AppError, options?: { toastDuration?: number; context?: string }) {
    const duration = options?.toastDuration || 5000;

    // Show different toast types based on error severity
    if (error.statusCode >= 500) {
      toast.error(`${options?.context ? `${options.context}: ` : ''}${error.message}`, {
        duration,
        style: {
          background: '#fee2e2',
          color: '#dc2626',
        },
      });
    } else if (error.statusCode >= 400) {
      toast.error(`${options?.context ? `${options.context}: ` : ''}${error.message}`, {
        duration,
      });
    } else {
      toast(`${options?.context ? `${options.context}: ` : ''}${error.message}`, {
        duration,
      });
    }
  }

  private handleSpecificErrors(error: AppError) {
    switch (error.code) {
      case ERROR_CODES.UNAUTHORIZED:
      case ERROR_CODES.TOKEN_EXPIRED:
        // Clear auth token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          // Only redirect if not already on auth pages
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
        break;

      case ERROR_CODES.RATE_LIMIT_EXCEEDED:
        // Show retry button or countdown
        break;

      case ERROR_CODES.EQUIPMENT_NOT_AVAILABLE:
        // Suggest alternative dates or equipment
        break;

      default:
        // No specific handling needed
        break;
    }
  }

  // Get error log for debugging
  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  // Clear error log
  clearErrorLog() {
    this.errorLog = [];
  }

  // Check if error is retryable
  isRetryableError(error: AppError): boolean {
    const retryableCodes = [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.TIMEOUT_ERROR,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
    ];

    return retryableCodes.includes(error.code as any);
  }

  // Get user-friendly error message
  getErrorMessage(error: AppError): string {
    return ERROR_MESSAGES[error.code] || error.message || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Utility function for handling async errors
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  options?: {
    showToast?: boolean;
    context?: string;
    fallback?: T;
  }
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    errorHandler.handleError(error, {
      showToast: options?.showToast,
      context: options?.context,
    });

    return options?.fallback ?? null;
  }
}
