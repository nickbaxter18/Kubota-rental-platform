import { envConfig } from '@/config/env.config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import all entities
import { Booking } from '../entities/booking.entity';
import { Contract } from '../entities/contract.entity';
import { Equipment } from '../entities/equipment.entity';
import { InsuranceDocument } from '../entities/insurance-document.entity';
import { Payment } from '../entities/payment.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: envConfig.database.url,
      entities: [
        User,
        Equipment,
        Booking,
        Payment,
        InsuranceDocument,
        Contract,
      ],
      synchronize: envConfig.app.nodeEnv === 'development', // Only in development
      migrations: ['dist/migrations/*.js'],
      migrationsTableName: 'migrations',
      logging: envConfig.debug.enabled,
      ssl: envConfig.app.nodeEnv === 'development' ? false : { rejectUnauthorized: false },
    }),
    TypeOrmModule.forFeature([
      User,
      Equipment,
      Booking,
      Payment,
      InsuranceDocument,
      Contract,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
