import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Booking } from './booking.entity';

export enum InsuranceDocumentStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum InsuranceDocumentType {
  COI = 'coi', // Certificate of Insurance
  BINDER = 'binder', // Insurance Binder
  POLICY = 'policy', // Insurance Policy
  ENDORSEMENT = 'endorsement', // Policy Endorsement
}

@Entity('insurance_documents')
@Index(['booking', 'status'])
@Index(['expiresAt'])
export class InsuranceDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Booking, booking => booking.insuranceDocuments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'uuid', nullable: false })
  bookingId: string;

  @Column({ type: 'varchar', length: 50 })
  documentNumber: string; // e.g., "INS-2025-001"

  @Column({
    type: 'enum',
    enum: InsuranceDocumentType,
  })
  type: InsuranceDocumentType;

  @Column({
    type: 'enum',
    enum: InsuranceDocumentStatus,
    default: InsuranceDocumentStatus.PENDING,
  })
  status: InsuranceDocumentStatus;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 255 })
  originalFileName: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number; // bytes

  @Column({ type: 'text' })
  fileUrl: string; // S3 or local storage URL

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  insuranceCompany: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  policyNumber: string;

  @Column({ type: 'timestamp', nullable: true })
  effectiveDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  generalLiabilityLimit: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  equipmentLimit: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  deductible: number;

  @Column({ type: 'boolean', default: false, nullable: false })
  additionalInsuredIncluded: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  lossPayeeIncluded: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  waiverOfSubrogationIncluded: boolean;

  @Column({ type: 'json', nullable: true })
  extractedData: {
    insurerName?: string;
    policyNumber?: string;
    effectiveDate?: string;
    expirationDate?: string;
    coverageLimits?: {
      generalLiability?: number;
      equipment?: number;
      deductible?: number;
    };
    endorsements?: string[];
    additionalInsured?: string[];
    lossPayee?: string[];
  };

  @Column({ type: 'json', nullable: true })
  validationResults: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    checkedAt: Date;
    checkedBy: string; // user ID or "system"
  };

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reviewedBy: string; // user ID

  @Column({ type: 'json', nullable: true })
  metadata: {
    uploadedBy: string;
    uploadedFrom: string; // IP address
    userAgent: string;
    ocrConfidence?: number;
    processingTime?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
