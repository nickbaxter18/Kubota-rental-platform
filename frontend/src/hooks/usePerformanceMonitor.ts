import { useEffect, useRef } from 'react';
import { ErrorMonitor } from '../lib/error-monitor';

export const usePerformanceMonitor = (componentName: string) => {
  const mountTime = useRef<number>(Date.now());

  useEffect(() => {
    const mountDuration = Date.now() - mountTime.current;

    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      console.log(`⚡ ${componentName} mounted in ${mountDuration}ms`);
    }

    // Log slow component mounts
    if (mountDuration > 100) {
      ErrorMonitor.captureError(
        new Error(`Slow component mount: ${componentName}`),
        {
          component: componentName,
          action: 'mount',
          state: { mountDuration },
        }
      );
    }

    return () => {
      const unmountDuration = Date.now() - mountTime.current;

      if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
        console.log(`🔄 ${componentName} unmounted after ${unmountDuration}ms`);
      }
    };
  }, [componentName]);

  const markInteraction = (action: string) => {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      console.log(`🎯 ${componentName}:${action}`);
    }
  };

  return { markInteraction };
};
