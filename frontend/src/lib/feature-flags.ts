// Feature flag system for gradual rollouts and A/B testing
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  percentage?: number; // For percentage-based rollouts
  userIds?: string[]; // For specific user targeting
  conditions?: Record<string, any>; // Custom conditions
}

export interface FeatureFlagContext {
  userId?: string;
  userRole?: string;
  userEmail?: string;
  environment?: string;
  version?: string;
  customAttributes?: Record<string, any>;
}

// Default feature flags (can be overridden by environment)
const DEFAULT_FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Booking enhancements
  'enhanced-booking-flow': {
    key: 'enhanced-booking-flow',
    enabled: true,
    percentage: 100,
  },

  // Payment features
  'new-payment-methods': {
    key: 'new-payment-methods',
    enabled: false,
    percentage: 0,
  },

  // UI improvements
  'dark-mode': {
    key: 'dark-mode',
    enabled: false,
    percentage: 10, // 10% rollout
  },

  // Performance optimizations
  'lazy-loading-images': {
    key: 'lazy-loading-images',
    enabled: true,
    percentage: 100,
  },

  // Admin features
  'advanced-analytics': {
    key: 'advanced-analytics',
    enabled: false,
    conditions: {
      userRole: 'admin',
    },
  },

  // Beta features
  'equipment-availability-heatmap': {
    key: 'equipment-availability-heatmap',
    enabled: false,
    percentage: 25, // 25% of users
  },

  // Experimental features
  'ai-powered-pricing': {
    key: 'ai-powered-pricing',
    enabled: false,
    percentage: 5, // 5% experimental rollout
  },
};

// Feature flag storage (in production, use a proper feature flag service)
class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: Map<string, FeatureFlag> = new Map();
  private context: FeatureFlagContext = {};

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  // Initialize feature flags
  initialize(customFlags?: Record<string, FeatureFlag>, context?: FeatureFlagContext) {
    // Start with default flags
    Object.entries(DEFAULT_FEATURE_FLAGS).forEach(([key, flag]) => {
      this.flags.set(key, { ...flag });
    });

    // Override with custom flags if provided
    if (customFlags) {
      Object.entries(customFlags).forEach(([key, flag]) => {
        this.flags.set(key, { ...flag });
      });
    }

    // Set context
    if (context) {
      this.context = { ...context };
    }

    // Load flags from environment or external service in production
    this.loadExternalFlags();
  }

  private async loadExternalFlags() {
    if (process.env.NODE_ENV === 'production') {
      try {
        // TODO: Load from feature flag service (LaunchDarkly, Flagsmith, etc.)
        // const response = await fetch('/api/feature-flags');
        // const externalFlags = await response.json();
        // this.updateFlags(externalFlags);
      } catch (error) {
        console.warn('Failed to load external feature flags:', error);
      }
    }
  }

  // Update flags dynamically
  updateFlags(newFlags: Record<string, FeatureFlag>) {
    Object.entries(newFlags).forEach(([key, flag]) => {
      this.flags.set(key, { ...flag });
    });
  }

  // Check if a feature is enabled
  isEnabled(flagKey: string): boolean {
    const flag = this.flags.get(flagKey);
    if (!flag || !flag.enabled) {
      return false;
    }

    // Check percentage-based rollout
    if (flag.percentage !== undefined && flag.percentage < 100) {
      const userId = this.context.userId || 'anonymous';
      const hash = this.simpleHash(userId + flagKey);
      const percentage = (hash % 100) + 1; // 1-100

      if (percentage > flag.percentage) {
        return false;
      }
    }

    // Check specific user targeting
    if (flag.userIds && flag.userIds.length > 0) {
      const userId = this.context.userId;
      if (!userId || !flag.userIds.includes(userId)) {
        return false;
      }
    }

    // Check custom conditions
    if (flag.conditions) {
      for (const [conditionKey, conditionValue] of Object.entries(flag.conditions)) {
        const contextValue = (this.context as any)[conditionKey];

        if (Array.isArray(conditionValue)) {
          if (!conditionValue.includes(contextValue)) {
            return false;
          }
        } else if (contextValue !== conditionValue) {
          return false;
        }
      }
    }

    return true;
  }

  // Get all enabled features for current user
  getEnabledFeatures(): string[] {
    return Array.from(this.flags.entries())
      .filter(([key, flag]) => this.isEnabled(key))
      .map(([key]) => key);
  }

  // Get feature flag value with fallback
  getVariant<T>(flagKey: string, defaultValue: T): T {
    if (this.isEnabled(flagKey)) {
      return defaultValue;
    }
    return defaultValue;
  }

  // A/B testing helper
  getABVariant(flagKey: string, variants: string[]): string | null {
    if (!this.isEnabled(flagKey)) {
      return null;
    }

    const userId = this.context.userId || 'anonymous';
    const hash = this.simpleHash(userId + flagKey);
    const variantIndex = hash % variants.length;

    return variants[variantIndex];
  }

  // Simple hash function for consistent user bucketing
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Track feature usage for analytics
  trackFeatureUsage(flagKey: string, metadata?: Record<string, any>) {
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics service
      console.log(`Feature used: ${flagKey}`, metadata);
    }
  }

  // Get all feature flags (for debugging)
  getAllFlags(): Record<string, FeatureFlag> {
    const result: Record<string, FeatureFlag> = {};
    this.flags.forEach((flag, key) => {
      result[key] = { ...flag };
    });
    return result;
  }

  // Reset flags (useful for testing)
  reset() {
    this.flags.clear();
    this.context = {};
  }
}

// React hook for using feature flags
export function useFeatureFlag(flagKey: string): boolean {
  const manager = FeatureFlagManager.getInstance();
  return manager.isEnabled(flagKey);
}

// React hook for A/B testing
export function useABTest(flagKey: string, variants: string[]): string | null {
  const manager = FeatureFlagManager.getInstance();
  return manager.getABVariant(flagKey, variants);
}

// Initialize feature flags
export function initializeFeatureFlags(context?: FeatureFlagContext) {
  const manager = FeatureFlagManager.getInstance();

  // Set context from various sources
  const featureContext: FeatureFlagContext = {
    environment: process.env.NODE_ENV,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    ...context,
  };

  // Add user context if available
  if (typeof window !== 'undefined') {
    // In a real app, get from auth context or localStorage
    featureContext.userId = localStorage.getItem('userId') || undefined;
    featureContext.userRole = localStorage.getItem('userRole') || undefined;
  }

  manager.initialize(undefined, featureContext);
}

// Export singleton instance
export const featureFlagManager = FeatureFlagManager.getInstance();
