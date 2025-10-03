import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Booking } from './booking.entity';

export enum ContractStatus {
  DRAFT = 'draft',
  SENT_FOR_SIGNATURE = 'sent_for_signature',
  SIGNED = 'signed',
  DECLINED = 'declined',
  VOIDED = 'voided',
  EXPIRED = 'expired',
}

export enum ContractType {
  RENTAL_AGREEMENT = 'rental_agreement',
  RIDER = 'rider',
  TERMS_AND_CONDITIONS = 'terms_and_conditions',
  COMBINED = 'combined', // Rental Agreement + Rider + Terms
}

export enum SignatureType {
  ELECTRONIC = 'electronic',
  WET_INK = 'wet_ink',
  CLICKWRAP = 'clickwrap',
}

@Entity('contracts')
@Index(['booking', 'status'])
@Index(['envelopeId'])
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  contractNumber: string; // e.g., "CON-2025-001"

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'uuid' })
  bookingId: string;

  @Column({
    type: 'enum',
    enum: ContractType,
    default: ContractType.COMBINED,
  })
  type: ContractType;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.DRAFT,
  })
  status: ContractStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  envelopeId: string; // DocuSign envelope ID

  @Column({ type: 'varchar', length: 100, nullable: true })
  documentId: string; // DocuSign document ID

  @Column({ type: 'text', nullable: true })
  documentContent: string; // Base64 encoded PDF content

  @Column({ type: 'varchar', length: 500, nullable: true })
  documentUrl: string; // URL to stored PDF

  @Column({ type: 'json', nullable: true })
  documentMetadata: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    pageCount: number;
    hash: string; // SHA-256 hash for integrity verification
  };

  @Column({ type: 'json' })
  legalVersions: {
    termsVersion: string;
    riderVersion: string;
    termsHash: string;
    riderHash: string;
    combinedHash: string; // Hash of the combined document
  };

  @Column({ type: 'json', nullable: true })
  signatures: {
    customerSignature: {
      type: SignatureType;
      signedAt: Date;
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
      fullName: string;
      email: string;
    };
    witnessSignature?: {
      signedAt: Date;
      ipAddress: string;
      userAgent: string;
      fullName: string;
      email: string;
    };
  };

  @Column({ type: 'json', nullable: true })
  docusignData: {
    envelopeId: string;
    recipientId: string;
    clientUserId?: string;
    status: string;
    signedAt?: Date;
    declineReason?: string;
    events: {
      eventType: string;
      eventDate: Date;
      description: string;
    }[];
  };

  @Column({ type: 'json', nullable: true })
  initialsCapture: {
    coordinates: {
      section2: { x: number; y: number };
      section3: { x: number; y: number };
      section4: { x: number; y: number };
      section5: { x: number; y: number };
      section7: { x: number; y: number };
      section8: { x: number; y: number };
      finalAcceptance: { x: number; y: number };
    };
    images: {
      section2: string; // Base64 image of initials
      section3: string;
      section4: string;
      section5: string;
      section7: string;
      section8: string;
      finalAcceptance: string;
    };
  };

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  signedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  auditTrail: {
    action: string;
    timestamp: Date;
    userId?: string;
    ipAddress: string;
    userAgent: string;
    details: string;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
