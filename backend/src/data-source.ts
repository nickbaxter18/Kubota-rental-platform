import "reflect-metadata";
import { DataSource } from "typeorm";
import { envConfig } from "./config/env.config";
import { Booking } from "./entities/booking.entity";
import { Contract } from "./entities/contract.entity";
import { Equipment } from "./entities/equipment.entity";
import { InsuranceDocument } from "./entities/insurance-document.entity";
import { Payment } from "./entities/payment.entity";
import { User } from "./entities/user.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5433,
  username: process.env.DB_USER || "kubota_user",
  password: process.env.DB_PASSWORD || "kubota_password",
  database: process.env.DB_NAME || "kubota_rental",
  entities: [
    User,
    Equipment,
    Booking,
    Payment,
    InsuranceDocument,
    Contract,
  ],
  migrations: ["src/migrations/*.ts"],
  synchronize: envConfig.app.nodeEnv === 'development',
  logging: envConfig.debug.enabled,
  ssl: envConfig.app.nodeEnv === 'development' ? false : { rejectUnauthorized: false },
});
