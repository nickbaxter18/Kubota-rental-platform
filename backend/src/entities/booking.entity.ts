import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Equipment } from './equipment.entity';
import { InsuranceDocument } from './insurance-document.entity';
import { Payment } from './payment.entity';
import { User } from './user.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  INSURANCE_VERIFIED = 'insurance_verified',
  READY_FOR_PICKUP = 'ready_for_pickup',
  DELIVERED = 'delivered',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum BookingType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
}

@Entity('bookings')
@Index(['customer', 'startDate'])
@Index(['equipment', 'startDate'])
@Index(['status'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  bookingNumber: string; // e.g., "UDR-2025-001"

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Equipment, { eager: true })
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;

  @Column({ type: 'uuid' })
  equipmentId: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({
    type: 'enum',
    enum: BookingType,
    default: BookingType.DELIVERY,
  })
  type: BookingType;

  @Column({ type: 'text', nullable: true })
  deliveryAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deliveryCity: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deliveryProvince: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  deliveryPostalCode: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  dailyRate: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  weeklyRate: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  monthlyRate: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  taxes: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  floatFee: number; // delivery/pickup fee

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  securityDeposit: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  additionalCharges: number; // fuel, cleaning, damage, etc.

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  actualStartDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualEndDate: Date;

  @Column({ type: 'int', default: 0 })
  startEngineHours: number;

  @Column({ type: 'int', default: 0 })
  endEngineHours: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  overageHours: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  overageCharges: number;

  @Column({ type: 'text', nullable: true })
  specialInstructions: string;

  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  @Column({ type: 'json', nullable: true })
  attachments: {
    name: string;
    type: string;
    included: boolean;
    additionalCost?: number;
  }[];

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  cancellationFee: number;

  @Column({ type: 'json', nullable: true })
  termsAccepted: {
    termsVersion: string;
    riderVersion: string;
    termsHash: string;
    riderHash: string;
    acceptedAt: Date;
    ipAddress: string;
    userAgent: string;
    initials: {
      section2: string; // Insurance
      section3: string; // Transport & Tie-Down
      section4: string; // Operating Limits & Safety
      section5: string; // Prohibited Uses
      section7: string; // Damage/Loss/Theft & Environmental
      section8: string; // Financial Terms
      finalAcceptance: string;
    };
  };

  @Column({ type: 'json', nullable: true })
  signatures: {
    customerSignature: string;
    contractId: string;
    signedAt: Date;
    ipAddress: string;
    userAgent: string;
  };

  @Column({ type: 'json', nullable: true })
  documents: {
    rentalAgreement: {
      url: string;
      hash: string;
      generatedAt: Date;
    };
    signedContract?: {
      url: string;
      hash: string;
      signedAt: Date;
    };
    invoice?: {
      url: string;
      hash: string;
      generatedAt: Date;
    };
  };

  @OneToMany(() => Payment, payment => payment.booking)
  payments: Payment[];

  @OneToMany(() => InsuranceDocument, insurance => insurance.booking)
  insuranceDocuments: InsuranceDocument[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
