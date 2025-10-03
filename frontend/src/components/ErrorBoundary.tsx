import { Component, ReactNode } from 'react';
import { ErrorMonitor } from '../lib/error-monitor';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Capture state snapshot if available
    const stateSnapshot = this.captureStateSnapshot();

    ErrorMonitor.captureError(error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      state: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        stateSnapshot,
      },
    });

    this.props.onError?.(error, errorInfo);
  }

  private captureStateSnapshot() {
    try {
      // Capture Zustand store state if available
      const stores = ['bookingStore', 'authStore', 'uiStore'];
      const snapshot: any = {};

      stores.forEach(storeName => {
        try {
          const store = (window as any)[storeName];
          if (store && typeof store.getState === 'function') {
            snapshot[storeName] = store.getState();
          }
        } catch (e) {
          // Ignore errors when capturing state
        }
      });

      return snapshot;
    } catch (e) {
      return { error: 'Failed to capture state snapshot' };
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-800">
                  Something went wrong
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  An error occurred while rendering this page. The error has been logged and our team has been notified.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
