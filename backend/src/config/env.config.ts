import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from both .env files
const mainEnvPath = path.resolve(__dirname, '../../.env');
const codexEnvPath = path.resolve(__dirname, '../../codex-meta-data/.env');

dotenv.config({ path: mainEnvPath });
dotenv.config({ path: codexEnvPath });

export interface EnvironmentConfig {
  // Payment Integration
  stripe: {
    secretKey: string;
    webhookSecret: string;
    publishableKey: string;
    enabled: boolean;
  };

  // Contract Integration
  docusign: {
    clientId: string;
    clientSecret: string;
    accountId: string;
    baseUrl: string;
    authServer: string;
    enabled: boolean;
  };
  hellosign: {
    apiKey: string;
    clientId: string;
    enabled: boolean;
  };

  // Notifications
  twilio: {
    accountSid: string;
    authToken: string;
    from: string;
    messagingServiceSid: string;
    enabled: boolean;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    enabled: boolean;
  };

  // Analytics
  ga4: {
    measurementId: string;
    apiSecret: string;
    enabled: boolean;
  };

  // Database & Caching
  database: {
    url: string;
  };
  redis: {
    url: string;
    enabled: boolean;
  };

  // Authentication & Security
  jwt: {
    secret: string;
    refreshSecret: string;
  };
  app: {
    baseUrl: string;
    nodeEnv: string;
  };

  // Cloud Infrastructure
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3Bucket: string;
  };

  // Legal & Compliance
  legal: {
    termsVersion: string;
    riderVersion: string;
    termsHash: string;
    riderHash: string;
  };

  // Operational Settings
  rental: {
    defaultFloatFee: number;
    defaultDailyHours: number;
    defaultWeeklyHours: number;
    overageHourlyRate: number;
    serviceAreas: string[];
    securityDeposit: number;
  };

  // Development & Debugging
  debug: {
    enabled: boolean;
    logLevel: string;
  };

  // Feature Flags
  features: {
    stripe: boolean;
    docusign: boolean;
    hellosign: boolean;
    twilio: boolean;
    analytics: boolean;
  };
}

class EnvironmentService {
  private config: EnvironmentConfig;
  private missingKeys: string[] = [];

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
    this.logConfigurationStatus();
  }

  private loadConfig(): EnvironmentConfig {
    return {
      // Payment Integration
      stripe: {
        secretKey: this.getEnv('STRIPE_SECRET_KEY', ''),
        webhookSecret: this.getEnv('STRIPE_WEBHOOK_SECRET', ''),
        publishableKey: this.getEnv('STRIPE_PUBLISHABLE_KEY', ''),
        enabled: this.getEnv('FEATURE_STRIPE_ENABLED', 'true') === 'true',
      },

      // Contract Integration
      docusign: {
        clientId: this.getEnv('DOCUSIGN_CLIENT_ID', ''),
        clientSecret: this.getEnv('DOCUSIGN_CLIENT_SECRET', ''),
        accountId: this.getEnv('DOCUSIGN_ACCOUNT_ID', ''),
        baseUrl: this.getEnv('DOCUSIGN_BASE_URL', 'https://demo.docusign.net/restapi/v2.1'),
        authServer: this.getEnv('DOCUSIGN_AUTH_SERVER', 'https://account-d.docusign.com'),
        enabled: this.getEnv('FEATURE_DOCUSIGN_ENABLED', 'true') === 'true',
      },
      hellosign: {
        apiKey: this.getEnv('HELLOSIGN_API_KEY', ''),
        clientId: this.getEnv('HELLOSIGN_CLIENT_ID', ''),
        enabled: this.getEnv('FEATURE_HELLOSIGN_ENABLED', 'true') === 'true',
      },

      // Notifications
      twilio: {
        accountSid: this.getEnv('TWILIO_ACCOUNT_SID', ''),
        authToken: this.getEnv('TWILIO_AUTH_TOKEN', ''),
        from: this.getEnv('TWILIO_FROM', ''),
        messagingServiceSid: this.getEnv('TWILIO_MESSAGING_SERVICE_SID', ''),
        enabled: this.getEnv('FEATURE_TWILIO_ENABLED', 'true') === 'true',
      },
      smtp: {
        host: this.getEnv('SMTP_HOST', 'smtp.gmail.com'),
        port: parseInt(this.getEnv('SMTP_PORT', '587')),
        user: this.getEnv('SMTP_USER', ''),
        pass: this.getEnv('SMTP_PASS', ''),
        from: this.getEnv('SMTP_FROM', 'noreply@udigit.ca'),
        enabled: this.getEnv('SMTP_ENABLED', 'true') === 'true',
      },

      // Analytics
      ga4: {
        measurementId: this.getEnv('GA4_MEASUREMENT_ID', ''),
        apiSecret: this.getEnv('GA4_API_SECRET', ''),
        enabled: this.getEnv('FEATURE_ANALYTICS_ENABLED', 'true') === 'true',
      },

      // Database & Caching
      database: {
        url: this.getEnv('DATABASE_URL', 'postgresql://localhost:5432/udigit_rentals'),
      },
      redis: {
        url: this.getEnv('REDIS_URL', 'redis://localhost:6379'),
        enabled: this.getEnv('REDIS_ENABLED', 'false') === 'true',
      },

      // Authentication & Security
      jwt: {
        secret: this.getEnv('JWT_SECRET', 'fallback-jwt-secret-change-in-production'),
        refreshSecret: this.getEnv('JWT_REFRESH_SECRET', 'fallback-refresh-secret-change-in-production'),
      },
      app: {
        baseUrl: this.getEnv('APP_BASE_URL', 'http://localhost:3000'),
        nodeEnv: this.getEnv('NODE_ENV', 'development'),
      },

      // Cloud Infrastructure
      aws: {
        accessKeyId: this.getEnv('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.getEnv('AWS_SECRET_ACCESS_KEY', ''),
        region: this.getEnv('AWS_REGION', 'us-east-1'),
        s3Bucket: this.getEnv('AWS_S3_BUCKET', 'udigit-rentals-storage'),
      },

      // Legal & Compliance
      legal: {
        termsVersion: this.getEnv('TERMS_VERSION', '1.0'),
        riderVersion: this.getEnv('RIDER_VERSION', '1.0'),
        termsHash: this.getEnv('TERMS_HASH', ''),
        riderHash: this.getEnv('RIDER_HASH', ''),
      },

      // Operational Settings
      rental: {
        defaultFloatFee: parseInt(this.getEnv('DEFAULT_FLOAT_FEE', '150')),
        defaultDailyHours: parseInt(this.getEnv('DEFAULT_DAILY_HOURS', '8')),
        defaultWeeklyHours: parseInt(this.getEnv('DEFAULT_WEEKLY_HOURS', '40')),
        overageHourlyRate: parseInt(this.getEnv('OVERAGE_HOURLY_RATE', '65')),
        serviceAreas: this.getEnv('SERVICE_AREAS', 'Saint John,Rothesay,Quispamsis,Grand Bay-Westfield,Hampton').split(','),
        securityDeposit: parseInt(this.getEnv('SECURITY_DEPOSIT', '500')),
      },

      // Development & Debugging
      debug: {
        enabled: this.getEnv('DEBUG', 'false') === 'true',
        logLevel: this.getEnv('LOG_LEVEL', 'info'),
      },

      // Feature Flags
      features: {
        stripe: this.getEnv('FEATURE_STRIPE_ENABLED', 'true') === 'true',
        docusign: this.getEnv('FEATURE_DOCUSIGN_ENABLED', 'true') === 'true',
        hellosign: this.getEnv('FEATURE_HELLOSIGN_ENABLED', 'true') === 'true',
        twilio: this.getEnv('FEATURE_TWILIO_ENABLED', 'true') === 'true',
        analytics: this.getEnv('FEATURE_ANALYTICS_ENABLED', 'true') === 'true',
      },
    };
  }

  private getEnv(key: string, defaultValue: string = ''): string {
    const value = process.env[key] || defaultValue;
    if (!value && this.isRequiredKey(key)) {
      this.missingKeys.push(key);
    }
    return value;
  }

  private isRequiredKey(key: string): boolean {
    // Define which keys are required for production
    const requiredKeys = [
      'DATABASE_URL',
      'JWT_SECRET',
      'APP_BASE_URL',
    ];
    return requiredKeys.includes(key);
  }

  private validateConfig(): void {
    // Log missing keys but don't fail - follow "If Missing → Continue + Scaffold" rule
    if (this.missingKeys.length > 0) {
      console.warn('⚠️  Missing environment keys detected:', this.missingKeys);
      console.warn('🔄 Continuing with scaffold mode for missing integrations');
    }

    // Validate critical configurations
    if (!this.config.database.url) {
      console.error('❌ Database URL is required');
      // Don't throw - continue with scaffold
    }
  }

  private logConfigurationStatus(): void {
    console.log('🚀 U-Dig It Rentals Platform Configuration Loaded');
    console.log(`📊 Environment: ${this.config.app.nodeEnv}`);
    console.log(`🔧 Debug Mode: ${this.config.debug.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`💳 Stripe: ${this.config.features.stripe ? '✅ Enabled' : '🚫 Scaffold Mode'}`);
    console.log(`📄 DocuSign: ${this.config.features.docusign ? '✅ Enabled' : '🚫 Scaffold Mode'}`);
    console.log(`📱 Twilio: ${this.config.features.twilio ? '✅ Enabled' : '🚫 Scaffold Mode'}`);
    console.log(`📈 Analytics: ${this.config.features.analytics ? '✅ Enabled' : '🚫 Scaffold Mode'}`);

    if (this.missingKeys.length > 0) {
      console.log(`⚠️  Missing Keys (${this.missingKeys.length}):`, this.missingKeys.join(', '));
    }
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.config.features[feature];
  }

  public getMissingKeys(): string[] {
    return [...this.missingKeys];
  }

  public createScaffoldNotice(feature: string): string {
    return `🚧 ${feature} is currently in scaffold mode. Please configure the required environment variables to enable full functionality.`;
  }
}

// Export singleton instance
export const envConfig = new EnvironmentService().getConfig();
export const EnvironmentServiceInstance = new EnvironmentService();
