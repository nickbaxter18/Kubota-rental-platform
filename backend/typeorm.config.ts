import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { envConfig } from './src/config/env.config';
import { Booking } from './src/entities/booking.entity';
import { Contract } from './src/entities/contract.entity';
import { Equipment } from './src/entities/equipment.entity';
import { InsuranceDocument } from './src/entities/insurance-document.entity';
import { Payment } from './src/entities/payment.entity';
import { User } from './src/entities/user.entity';

export const AppDataSource = new DataSource({
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
  migrations: ['src/migrations/*.ts'],
  synchronize: envConfig.app.nodeEnv === 'development',
  logging: envConfig.debug.enabled,
  ssl: envConfig.app.nodeEnv === 'development' ? false : { rejectUnauthorized: false },
});
