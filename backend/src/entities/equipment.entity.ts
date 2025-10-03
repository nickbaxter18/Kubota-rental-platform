import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Booking } from './booking.entity';

export enum EquipmentStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
  RETIRED = 'retired',
}

export enum EquipmentType {
  SVL75 = 'svl75',
  OTHER = 'other',
}

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  unitId: string; // e.g., "SVL75-001"

  @Column({ type: 'varchar', length: 100, unique: true })
  serialNumber: string;

  @Column({
    type: 'enum',
    enum: EquipmentType,
    default: EquipmentType.SVL75,
  })
  type: EquipmentType;

  @Column({ type: 'varchar', length: 100 })
  model: string; // e.g., "SVL75-3"

  @Column({ type: 'int' })
  year: number; // e.g., 2025

  @Column({ type: 'varchar', length: 100 })
  make: string; // e.g., "Kubota"

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  replacementValue: number; // e.g., 120000.00

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  dailyRate: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  weeklyRate: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  monthlyRate: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  overageHourlyRate: number; // e.g., 65.00

  @Column({ type: 'int', default: 8 })
  dailyHourAllowance: number; // e.g., 8 hours

  @Column({ type: 'int', default: 40 })
  weeklyHourAllowance: number; // e.g., 40 hours

  @Column({ type: 'json', nullable: true })
  specifications: {
    operatingWeight: number; // lbs
    transportDimensions: {
      length: number; // inches
      width: number; // inches
      height: number; // inches
    };
    engineHours: number;
    fuelType: string;
    attachments: string[];
  };

  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    default: EquipmentStatus.AVAILABLE,
  })
  status: EquipmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  attachments: {
    name: string;
    type: string;
    included: boolean;
    additionalCost?: number;
  }[];

  @Column({ type: 'timestamp', nullable: true })
  lastMaintenanceDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextMaintenanceDue: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEngineHours: number;

  @Column({ type: 'json', nullable: true })
  location: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  @Column({ type: 'json', nullable: true })
  images: {
    url: string;
    alt: string;
    isPrimary: boolean;
  }[];

  @Column({ type: 'json', nullable: true })
  documents: {
    type: string; // manual, warranty, etc.
    url: string;
    name: string;
  }[];

  @OneToMany(() => Booking, booking => booking.equipment)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
