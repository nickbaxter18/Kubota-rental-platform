import { envConfig } from '@/config/env.config';
import { bullConfig, cacheConfig } from '@/config/redis.config';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { ContractsModule } from './contracts/contracts.module';
import { DatabaseModule } from './database/database.module';
import { EquipmentModule } from './equipment/equipment.module';
import { HealthModule } from './health/health.module';
import { InsuranceModule } from './insurance/insurance.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'codex-meta-data/.env'],
      load: [() => envConfig],
    }),

    // Core modules
    DatabaseModule,

    // Caching with Redis
    CacheModule.register(cacheConfig),

    // Background job processing with BullMQ
    BullModule.forRoot(bullConfig),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Task scheduling (cron jobs)
    ScheduleModule.forRoot(),

    // Authentication module
    AuthModule,

    // Feature modules
    HealthModule,
    BookingsModule,
    PaymentsModule,
    ContractsModule,
    InsuranceModule,
    EquipmentModule,

    // TODO: Add more feature modules as they are implemented
    // AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
