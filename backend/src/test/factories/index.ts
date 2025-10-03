/**
 * Test Data Factories
 *
 * Comprehensive factory functions for all entities with time-freezing support
 * and GDPR-compliant test data generation.
 */

export const FACTORY_VERSION = '1.2';

import { DataSource } from 'typeorm';
import { Booking, BookingStatus, BookingType } from '../../entities/booking.entity';
import { Contract, ContractStatus, ContractType } from '../../entities/contract.entity';
import { Equipment, EquipmentStatus, EquipmentType } from '../../entities/equipment.entity';
import { InsuranceDocument, InsuranceDocumentStatus, InsuranceDocumentType } from '../../entities/insurance-document.entity';
import { Payment, PaymentMethod, PaymentStatus, PaymentType } from '../../entities/payment.entity';
import { User, UserRole, UserStatus } from '../../entities/user.entity';

export interface TestDataContext {
  dataSource?: DataSource;
  cleanup?: () => Promise<void>;
}

/**
 * Base factory interface
 */
export interface Factory<T> {
  create(overrides?: Partial<T>, context?: TestDataContext): Promise<T>;
  createMany(count: number, overrides?: Partial<T>, context?: TestDataContext): Promise<T[]>;
  build(overrides?: Partial<T>): T;
  buildMany(count: number, overrides?: Partial<T>): T[];
}

/**
 * User Factory
 */
export class UserFactory implements Factory<User> {
  private static idCounter = 1;
  private context?: TestDataContext;

  setContext(context: TestDataContext): void {
    this.context = context;
  }

  async create(overrides: Partial<User> = {}, context?: TestDataContext): Promise<User> {
    const userData = this.build(overrides);

    if (context?.dataSource) {
      const userRepository = context.dataSource.getRepository(User);
      const user = userRepository.create(userData);
      return await userRepository.save(user);
    }

    return userData as User;
  }

  async createMany(count: number, overrides: Partial<User> = {}, context?: TestDataContext): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      const userOverrides = {
        ...overrides,
        email: overrides.email ? `${overrides.email.split('@')[0]}${i}@example.com` : `user${i}@example.com`
      };
      users.push(await this.create(userOverrides, context));
    }
    return users;
  }

  build(overrides: Partial<User> = {}): User {
    const id = UserFactory.idCounter++;
    return {
      id: `user-${id}`,
      email: `user${id}@example.com`,
      firstName: `FirstName${id}`,
      lastName: `LastName${id}`,
      phone: `+1-555-${String(id).padStart(4, '0')}`,
      dateOfBirth: new Date('1990-01-01'),
      driversLicense: `DL${String(id).padStart(8, '0')}`,
      address: `${id} Main Street`,
      city: 'Anytown',
      province: 'ON',
      postalCode: `K1A ${String(id).padStart(3, '0')}B`,
      country: 'Canada',
      emailVerified: true,
      phoneVerified: true,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      passwordHash: 'hashedpassword123',
      resetToken: null,
      resetTokenExpires: null,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      stripeCustomerId: null,
      preferences: {
        notifications: {
          email: true,
          sms: true,
          marketing: false
        },
        language: 'en',
        timezone: 'America/Toronto'
      },
      lastLoginAt: null,
      lastLoginIp: null,
      bookings: [],
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      ...overrides
    } as User;
  }

  buildMany(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, (_, i) => {
      const id = UserFactory.idCounter + i;
      return this.build({
        ...overrides,
        id: `user-${id}`,
        email: overrides.email ? `${overrides.email.split('@')[0]}${i}@example.com` : `user${id}@example.com`
      });
    });
  }
}

/**
 * Equipment Factory
 */
export class EquipmentFactory implements Factory<Equipment> {
  private static idCounter = 1;
  private context?: TestDataContext;

  setContext(context: TestDataContext): void {
    this.context = context;
  }

  async create(overrides: Partial<Equipment> = {}, context?: TestDataContext): Promise<Equipment> {
    const equipmentData = this.build(overrides);

    if (context?.dataSource) {
      const equipmentRepository = context.dataSource.getRepository(Equipment);
      const equipment = equipmentRepository.create(equipmentData);
      return await equipmentRepository.save(equipment);
    }

    return equipmentData as Equipment;
  }

  async createMany(count: number, overrides: Partial<Equipment> = {}, context?: TestDataContext): Promise<Equipment[]> {
    const equipment: Equipment[] = [];
    for (let i = 0; i < count; i++) {
      equipment.push(await this.create(overrides, context));
    }
    return equipment;
  }

  build(overrides: Partial<Equipment> = {}): Equipment {
    const id = EquipmentFactory.idCounter++;
    return {
      id: `equipment-${id}`,
      unitId: `SVL75-${String(id).padStart(3, '0')}`,
      serialNumber: `SVL75${String(id).padStart(4, '0')}`,
      type: EquipmentType.SVL75,
      model: 'SVL75-3',
      year: 2025,
      make: 'Kubota',
      description: 'Compact track loader with excellent performance and reliability',
      replacementValue: 120000.00,
      dailyRate: 250.00,
      weeklyRate: 1200.00,
      monthlyRate: 4500.00,
      overageHourlyRate: 65.00,
      dailyHourAllowance: 8,
      weeklyHourAllowance: 40,
      specifications: {
        operatingWeight: 8500,
        transportDimensions: {
          length: 142,
          width: 68,
          height: 82
        },
        engineHours: 0,
        fuelType: 'diesel',
        attachments: ['standard bucket', 'hydraulic quick coupler']
      },
      status: EquipmentStatus.AVAILABLE,
      notes: null,
      attachments: [
        {
          name: 'Standard Bucket',
          type: 'bucket',
          included: true
        }
      ],
      lastMaintenanceDate: new Date('2024-01-01T00:00:00Z'),
      nextMaintenanceDue: new Date('2024-07-01T00:00:00Z'),
      totalEngineHours: 0,
      location: {
        address: '123 Industrial Blvd',
        city: 'Construction City',
        province: 'ON',
        postalCode: 'K2B 8P9',
        coordinates: {
          lat: 45.4215,
          lng: -75.6972
        }
      },
      images: [
        {
          url: `https://example.com/images/svl75-${id}-1.jpg`,
          alt: `Kubota SVL75 #${id}`,
          isPrimary: true
        }
      ],
      documents: [
        {
          type: 'manual',
          url: `https://example.com/manuals/svl75-${id}.pdf`,
          name: 'Operator Manual'
        }
      ],
      bookings: [],
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      ...overrides
    } as Equipment;
  }

  buildMany(count: number, overrides: Partial<Equipment> = {}): Equipment[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}

/**
 * Booking Factory
 */
export class BookingFactory implements Factory<Booking> {
  private static idCounter = 1;
  private context?: TestDataContext;

  setContext(context: TestDataContext): void {
    this.context = context;
  }

  async create(overrides: Partial<Booking> = {}, context?: TestDataContext): Promise<Booking> {
    const bookingData = this.build(overrides);

    if (context?.dataSource) {
      const bookingRepository = context.dataSource.getRepository(Booking);
      const booking = bookingRepository.create(bookingData);
      return await bookingRepository.save(booking);
    }

    return bookingData as Booking;
  }

  async createMany(count: number, overrides: Partial<Booking> = {}, context?: TestDataContext): Promise<Booking[]> {
    const bookings: Booking[] = [];
    for (let i = 0; i < count; i++) {
      bookings.push(await this.create(overrides, context));
    }
    return bookings;
  }

  build(overrides: Partial<Booking> = {}): Booking {
    const id = BookingFactory.idCounter++;
    const startDate = overrides.startDate || new Date('2024-06-01T00:00:00Z');
    const endDate = overrides.endDate || new Date('2024-06-07T00:00:00Z');

    return {
      id: `booking-${id}`,
      bookingNumber: `UDR-2025-${String(id).padStart(3, '0')}`,
      customerId: overrides.customerId || 'user-1',
      equipmentId: overrides.equipmentId || 'equipment-1',
      startDate,
      endDate,
      status: BookingStatus.CONFIRMED,
      type: BookingType.DELIVERY,
      deliveryAddress: '456 Customer Ave',
      deliveryCity: 'Customer City',
      deliveryProvince: 'ON',
      deliveryPostalCode: 'K1C 2D3',
      dailyRate: 250.00,
      weeklyRate: 1200.00,
      monthlyRate: 4500.00,
      subtotal: 1750.00,
      taxes: 227.50,
      floatFee: 75.00,
      total: 2052.50,
      securityDeposit: 1000.00,
      additionalCharges: 0,
      refundAmount: 0,
      actualStartDate: null,
      actualEndDate: null,
      startEngineHours: 0,
      endEngineHours: 0,
      overageHours: 0,
      overageCharges: 0,
      specialInstructions: null,
      internalNotes: null,
      attachments: [],
      cancelledAt: null,
      cancellationReason: null,
      cancellationFee: 0,
      termsAccepted: {
        termsVersion: '1.0',
        riderVersion: '1.0',
        termsHash: 'sha256-hash',
        riderHash: 'sha256-hash',
        acceptedAt: new Date('2024-05-01T00:00:00Z'),
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser',
        initials: {
          section2: 'CU',
          section3: 'CU',
          section4: 'CU',
          section5: 'CU',
          section7: 'CU',
          section8: 'CU',
          finalAcceptance: 'CU'
        }
      },
      signatures: {
        customerSignature: 'data:image/png;base64,signed',
        contractId: 'contract-1',
        signedAt: new Date('2024-05-01T00:00:00Z'),
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser'
      },
      documents: {
        rentalAgreement: {
          url: 'https://example.com/agreement.pdf',
          hash: 'sha256-hash',
          generatedAt: new Date('2024-05-01T00:00:00Z')
        }
      },
      payments: [],
      insuranceDocuments: [],
      customer: null as any,
      equipment: null as any,
      createdAt: new Date('2024-05-01T00:00:00Z'),
      updatedAt: new Date('2024-05-01T00:00:00Z'),
      ...overrides
    } as Booking;
  }

  buildMany(count: number, overrides: Partial<Booking> = {}): Booking[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}

/**
 * Contract Factory
 */
export class ContractFactory implements Factory<Contract> {
  private static idCounter = 1;
  private context?: TestDataContext;

  setContext(context: TestDataContext): void {
    this.context = context;
  }

  async create(overrides: Partial<Contract> = {}, context?: TestDataContext): Promise<Contract> {
    const contractData = this.build(overrides);

    if (context?.dataSource) {
      const contractRepository = context.dataSource.getRepository(Contract);
      const contract = contractRepository.create(contractData);
      return await contractRepository.save(contract);
    }

    return contractData as Contract;
  }

  async createMany(count: number, overrides: Partial<Contract> = {}, context?: TestDataContext): Promise<Contract[]> {
    const contracts: Contract[] = [];
    for (let i = 0; i < count; i++) {
      contracts.push(await this.create(overrides, context));
    }
    return contracts;
  }

  build(overrides: Partial<Contract> = {}): Contract {
    const id = ContractFactory.idCounter++;
    return {
      id: `contract-${id}`,
      contractNumber: `CON-2025-${String(id).padStart(3, '0')}`,
      bookingId: overrides.bookingId || 'booking-1',
      type: ContractType.COMBINED,
      status: ContractStatus.SIGNED,
      envelopeId: `envelope-${id}`,
      documentId: `document-${id}`,
      documentContent: 'base64-encoded-pdf-content',
      documentUrl: `https://example.com/contract-${id}.pdf`,
      documentMetadata: {
        fileName: `contract-${id}.pdf`,
        fileSize: 245760,
        mimeType: 'application/pdf',
        pageCount: 5,
        hash: 'sha256-hash'
      },
      legalVersions: {
        termsVersion: '1.0',
        riderVersion: '1.0',
        termsHash: 'sha256-hash',
        riderHash: 'sha256-hash',
        combinedHash: 'sha256-hash'
      },
      signatures: {
        customerSignature: {
          type: 'electronic' as any,
          signedAt: new Date('2024-05-01T00:00:00Z'),
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser',
          initials: {
            section2: 'CU',
            section3: 'CU',
            section4: 'CU',
            section5: 'CU',
            section7: 'CU',
            section8: 'CU',
            finalAcceptance: 'CU'
          },
          fullName: 'Customer User',
          email: 'customer@example.com'
        }
      },
      docusignData: {
        envelopeId: `envelope-${id}`,
        recipientId: 'recipient-1',
        status: 'completed',
        signedAt: new Date('2024-05-01T00:00:00Z'),
        events: []
      },
      initialsCapture: {
        coordinates: {
          section2: { x: 100, y: 100 },
          section3: { x: 100, y: 200 },
          section4: { x: 100, y: 300 },
          section5: { x: 100, y: 400 },
          section7: { x: 100, y: 500 },
          section8: { x: 100, y: 600 },
          finalAcceptance: { x: 100, y: 700 }
        },
        images: {
          section2: 'base64-image',
          section3: 'base64-image',
          section4: 'base64-image',
          section5: 'base64-image',
          section7: 'base64-image',
          section8: 'base64-image',
          finalAcceptance: 'base64-image'
        }
      },
      sentAt: new Date('2024-05-01T00:00:00Z'),
      signedAt: new Date('2024-05-01T00:00:00Z'),
      expiresAt: new Date('2024-12-31T23:59:59Z'),
      notes: null,
      auditTrail: [],
      booking: null as any,
      createdAt: new Date('2024-05-01T00:00:00Z'),
      updatedAt: new Date('2024-05-01T00:00:00Z'),
      ...overrides
    } as Contract;
  }

  buildMany(count: number, overrides: Partial<Contract> = {}): Contract[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}

/**
 * Payment Factory
 */
export class PaymentFactory implements Factory<Payment> {
  private static idCounter = 1;
  private context?: TestDataContext;

  setContext(context: TestDataContext): void {
    this.context = context;
  }

  async create(overrides: Partial<Payment> = {}, context?: TestDataContext): Promise<Payment> {
    const paymentData = this.build(overrides);

    if (context?.dataSource) {
      const paymentRepository = context.dataSource.getRepository(Payment);
      const payment = paymentRepository.create(paymentData);
      return await paymentRepository.save(payment);
    }

    return paymentData as Payment;
  }

  async createMany(count: number, overrides: Partial<Payment> = {}, context?: TestDataContext): Promise<Payment[]> {
    const payments: Payment[] = [];
    for (let i = 0; i < count; i++) {
      payments.push(await this.create(overrides, context));
    }
    return payments;
  }

  build(overrides: Partial<Payment> = {}): Payment {
    const id = PaymentFactory.idCounter++;
    return {
      id: `payment-${id}`,
      bookingId: overrides.bookingId || 'booking-1',
      paymentNumber: `PAY-2025-${String(id).padStart(3, '0')}`,
      type: PaymentType.PAYMENT,
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.CREDIT_CARD,
      amount: 2052.50,
      amountRefunded: 0,
      description: 'Equipment rental payment',
      stripePaymentIntentId: `pi_${id}_test_${Date.now()}`,
      stripeChargeId: `ch_${id}_test_${Date.now()}`,
      stripeRefundId: null,
      stripeMetadata: {
        customerEmail: 'customer@example.com',
        bookingNumber: 'UDR-2025-001'
      },
      billingAddress: {
        line1: '456 Customer Ave',
        city: 'Customer City',
        province: 'ON',
        postalCode: 'K1C 2D3',
        country: 'Canada'
      },
      processedAt: new Date('2024-05-01T00:00:00Z'),
      failedAt: null,
      failureReason: null,
      webhookEvents: [],
      notes: null,
      booking: null as any,
      createdAt: new Date('2024-05-01T00:00:00Z'),
      updatedAt: new Date('2024-05-01T00:00:00Z'),
      ...overrides
    } as Payment;
  }

  buildMany(count: number, overrides: Partial<Payment> = {}): Payment[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}

/**
 * Insurance Document Factory
 */
export class InsuranceDocumentFactory implements Factory<InsuranceDocument> {
  private static idCounter = 1;
  private context?: TestDataContext;

  setContext(context: TestDataContext): void {
    this.context = context;
  }

  async create(overrides: Partial<InsuranceDocument> = {}, context?: TestDataContext): Promise<InsuranceDocument> {
    const documentData = this.build(overrides);

    if (context?.dataSource) {
      const documentRepository = context.dataSource.getRepository(InsuranceDocument);
      const document = documentRepository.create(documentData);
      return await documentRepository.save(document);
    }

    return documentData as InsuranceDocument;
  }

  async createMany(count: number, overrides: Partial<InsuranceDocument> = {}, context?: TestDataContext): Promise<InsuranceDocument[]> {
    const documents: InsuranceDocument[] = [];
    for (let i = 0; i < count; i++) {
      documents.push(await this.create(overrides, context));
    }
    return documents;
  }

  build(overrides: Partial<InsuranceDocument> = {}): InsuranceDocument {
    const id = InsuranceDocumentFactory.idCounter++;
    return {
      id: `insurance-${id}`,
      bookingId: overrides.bookingId || 'booking-1',
      documentNumber: `INS-2025-${String(id).padStart(3, '0')}`,
      type: InsuranceDocumentType.COI,
      status: InsuranceDocumentStatus.APPROVED,
      fileName: `insurance-document-${id}.pdf`,
      originalFileName: `insurance-document-${id}.pdf`,
      mimeType: 'application/pdf',
      fileSize: 245760,
      fileUrl: `https://example.com/insurance-${id}.pdf`,
      description: 'Certificate of Insurance',
      insuranceCompany: 'Test Insurance Corp',
      policyNumber: `POL-${String(id).padStart(6, '0')}`,
      effectiveDate: new Date('2024-05-01T00:00:00Z'),
      expiresAt: new Date('2024-12-31T23:59:59Z'),
      generalLiabilityLimit: 2000000,
      equipmentLimit: 500000,
      deductible: 1000,
      additionalInsuredIncluded: true,
      lossPayeeIncluded: true,
      waiverOfSubrogationIncluded: true,
      extractedData: {
        insurerName: 'Test Insurance Corp',
        policyNumber: `POL-${String(id).padStart(6, '0')}`,
        effectiveDate: '2024-05-01',
        expirationDate: '2024-12-31',
        coverageLimits: {
          generalLiability: 2000000,
          equipment: 500000,
          deductible: 1000
        }
      },
      validationResults: {
        isValid: true,
        errors: [],
        warnings: [],
        checkedAt: new Date('2024-05-01T00:00:00Z'),
        checkedBy: 'system'
      },
      reviewNotes: null,
      reviewedAt: new Date('2024-05-01T00:00:00Z'),
      reviewedBy: 'admin-1',
      metadata: {
        uploadedBy: 'user-1',
        uploadedFrom: '192.168.1.1',
        userAgent: 'Test Browser'
      },
      booking: null as any,
      createdAt: new Date('2024-05-01T00:00:00Z'),
      updatedAt: new Date('2024-05-01T00:00:00Z'),
      ...overrides
    } as InsuranceDocument;
  }

  buildMany(count: number, overrides: Partial<InsuranceDocument> = {}): InsuranceDocument[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}

/**
 * Factory Registry
 */
export class TestDataFactory {
  private static instance: TestDataFactory;
  private context?: TestDataContext;

  // Factory instances
  public readonly users = new UserFactory();
  public readonly equipment = new EquipmentFactory();
  public readonly bookings = new BookingFactory();
  public readonly contracts = new ContractFactory();
  public readonly payments = new PaymentFactory();
  public readonly insuranceDocuments = new InsuranceDocumentFactory();

  private constructor() {}

  static getInstance(): TestDataFactory {
    if (!TestDataFactory.instance) {
      TestDataFactory.instance = new TestDataFactory();
    }
    return TestDataFactory.instance;
  }

  /**
   * Set test context (dataSource, cleanup function)
   */
  setContext(context: TestDataContext): void {
    this.context = context;
    // Propagate context to all factories
    this.users.setContext(context);
    this.equipment.setContext(context);
    this.bookings.setContext(context);
    this.contracts.setContext(context);
    this.payments.setContext(context);
    this.insuranceDocuments.setContext(context);
  }

  /**
   * Get current context
   */
  getContext(): TestDataContext | undefined {
    return this.context;
  }

  /**
   * Enhanced relationship creation methods
   */
  async createUserWithBookings(count = 1): Promise<{ user: User; bookings: Booking[] }> {
    const user = await this.users.create();
    const bookings = await this.bookings.createMany(count, { customerId: user.id }, this.context);
    return { user, bookings };
  }

  async createEquipmentWithBookings(count = 1): Promise<{ equipment: Equipment; bookings: Booking[] }> {
    const equipment = await this.equipment.create();
    const bookings = await this.bookings.createMany(count, { equipmentId: equipment.id }, this.context);
    return { equipment, bookings };
  }

  async createBookingWithRelatedEntities(): Promise<{
    user: User;
    equipment: Equipment;
    booking: Booking;
    contract: Contract;
    payment: Payment;
    insuranceDocument: InsuranceDocument;
  }> {
    const user = await this.users.create();
    const equipment = await this.equipment.create({ status: EquipmentStatus.AVAILABLE });

    const booking = await this.bookings.create({
      customerId: user.id,
      equipmentId: equipment.id
    }, this.context);

    const contract = await this.contracts.create({
      bookingId: booking.id
    }, this.context);

    const payment = await this.payments.create({
      bookingId: booking.id
    }, this.context);

    const insuranceDocument = await this.insuranceDocuments.create({
      bookingId: booking.id
    }, this.context);

    return { user, equipment, booking, contract, payment, insuranceDocument };
  }

  async createComplexScenario(): Promise<{
    admin: User;
    customer: User;
    operator: User;
    equipment: Equipment;
    booking: Booking;
    contract: Contract;
    payment: Payment;
    insuranceDocument: InsuranceDocument;
  }> {
    const [admin, customer, operator] = await Promise.all([
      this.users.create({ role: UserRole.ADMIN }),
      this.users.create({ role: UserRole.CUSTOMER }),
      this.users.create({ role: UserRole.CUSTOMER })
    ]);

    const equipment = await this.equipment.create({ status: EquipmentStatus.AVAILABLE });

    const booking = await this.bookings.create({
      customerId: customer.id,
      equipmentId: equipment.id
    }, this.context);

    const contract = await this.contracts.create({
      bookingId: booking.id
    }, this.context);

    const payment = await this.payments.create({
      bookingId: booking.id
    }, this.context);

    const insuranceDocument = await this.insuranceDocuments.create({
      bookingId: booking.id
    }, this.context);

    return { admin, customer, operator, equipment, booking, contract, payment, insuranceDocument };
  }

  /**
   * Create complete test scenario with related entities
   */
  async createCompleteBookingScenario(overrides: {
    user?: Partial<User>;
    equipment?: Partial<Equipment>;
    booking?: Partial<Booking>;
    contract?: Partial<Contract>;
    payment?: Partial<Payment>;
    insuranceDocument?: Partial<InsuranceDocument>;
  } = {}): Promise<{
    user: User;
    equipment: Equipment;
    booking: Booking;
    contract: Contract;
    payment: Payment;
    insuranceDocument: InsuranceDocument;
  }> {
    const user = await this.users.create(overrides.user, this.context);
    const equipment = await this.equipment.create({
      ...overrides.equipment,
      status: EquipmentStatus.AVAILABLE
    }, this.context);

    const booking = await this.bookings.create({
      ...overrides.booking,
      customerId: user.id,
      equipmentId: equipment.id
    }, this.context);

    const contract = await this.contracts.create({
      ...overrides.contract,
      bookingId: booking.id
    }, this.context);

    const payment = await this.payments.create({
      ...overrides.payment,
      bookingId: booking.id
    }, this.context);

    const insuranceDocument = await this.insuranceDocuments.create({
      ...overrides.insuranceDocument,
      bookingId: booking.id
    }, this.context);

    return {
      user,
      equipment,
      booking,
      contract,
      payment,
      insuranceDocument
    };
  }

  /**
   * Clean up all test data
   */
  async cleanup(): Promise<void> {
    if (this.context?.cleanup) {
      await this.context.cleanup();
    }
  }
}

/**
 * Global factory instance
 */
export const factory = TestDataFactory.getInstance();

/**
 * GDPR-compliant test data generator
 */
export class GDPRTestDataGenerator {
  private static usedEmails = new Set<string>();
  private static usedPhones = new Set<string>();

  /**
   * Generate fake but GDPR-compliant email
   */
  static generateEmail(prefix = 'test'): string {
    let email: string;
    let attempts = 0;

    do {
      const random = Math.random().toString(36).substring(2, 8);
      email = `${prefix}.${random}@test.local`;
      attempts++;
    } while (this.usedEmails.has(email) && attempts < 10);

    this.usedEmails.add(email);
    return email;
  }

  /**
   * Generate fake but GDPR-compliant phone number
   */
  static generatePhone(): string {
    let phone: string;
    let attempts = 0;

    do {
      const area = Math.floor(Math.random() * 900) + 100;
      const exchange = Math.floor(Math.random() * 900) + 100;
      const number = Math.floor(Math.random() * 9000) + 1000;
      phone = `+1-${area}-${exchange}-${number}`;
      attempts++;
    } while (this.usedPhones.has(phone) && attempts < 10);

    this.usedPhones.add(phone);
    return phone;
  }

  /**
   * Generate fake personal information
   */
  static generatePersonalInfo() {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return {
      firstName,
      lastName,
      email: this.generateEmail(`${firstName.toLowerCase()}.${lastName.toLowerCase()}`),
      phone: this.generatePhone()
    };
  }

  /**
   * Clear used data (for test isolation)
   */
  static clear(): void {
    this.usedEmails.clear();
    this.usedPhones.clear();
  }
}

/**
 * Test scenario builders
 */
export class TestScenarioBuilder {
  private factory = TestDataFactory.getInstance();

  /**
   * Create booking flow scenario
   */
  async createBookingFlowScenario(): Promise<{
    customer: User;
    equipment: Equipment;
    booking: Booking;
    contract: Contract;
    payment: Payment;
    insuranceDocument: InsuranceDocument;
  }> {
    const customer = await this.factory.users.create({
      role: UserRole.CUSTOMER,
      emailVerified: true,
      status: UserStatus.ACTIVE
    });

    const equipment = await this.factory.equipment.create({
      status: EquipmentStatus.AVAILABLE,
      dailyRate: 250.00
    });

    const booking = await this.factory.bookings.create({
      customerId: customer.id,
      equipmentId: equipment.id,
      startDate: new Date('2024-06-01T00:00:00Z'),
      endDate: new Date('2024-06-07T00:00:00Z'),
      status: BookingStatus.CONFIRMED
    });

    const contract = await this.factory.contracts.create({
      bookingId: booking.id,
      status: ContractStatus.SIGNED
    });

    const payment = await this.factory.payments.create({
      bookingId: booking.id,
      amount: 2052.50,
      status: PaymentStatus.COMPLETED
    });

    const insuranceDocument = await this.factory.insuranceDocuments.create({
      bookingId: booking.id,
      status: InsuranceDocumentStatus.APPROVED
    });

    return { customer, equipment, booking, contract, payment, insuranceDocument };
  }

  /**
   * Create payment failure scenario
   */
  async createPaymentFailureScenario(): Promise<{
    customer: User;
    booking: Booking;
    failedPayment: Payment;
  }> {
    const customer = await this.factory.users.create();
    const booking = await this.factory.bookings.create({
      customerId: customer.id,
      status: BookingStatus.PENDING
    });

    const failedPayment = await this.factory.payments.create({
      bookingId: booking.id,
      status: PaymentStatus.FAILED,
      stripePaymentIntentId: 'pi_failed_test'
    });

    return { customer, booking, failedPayment };
  }

  /**
   * Create multi-role scenario
   */
  async createMultiRoleScenario(): Promise<{
    customer: User;
    operator: User;
    admin: User;
    equipment: Equipment;
    booking: Booking;
  }> {
    const [customer, operator, admin] = await Promise.all([
      this.factory.users.create({ role: UserRole.CUSTOMER }),
      this.factory.users.create({ role: UserRole.CUSTOMER }),
      this.factory.users.create({ role: UserRole.ADMIN })
    ]);

    const equipment = await this.factory.equipment.create();
    const booking = await this.factory.bookings.create({
      customerId: customer.id,
      equipmentId: equipment.id
    });

    return { customer, operator, admin, equipment, booking };
  }
}

/**
 * Global cleanup utilities
 */
export class TestCleanupManager {
  private static instance: TestCleanupManager;
  private cleanupFunctions: Array<() => Promise<void>> = [];

  static getInstance(): TestCleanupManager {
    if (!TestCleanupManager.instance) {
      TestCleanupManager.instance = new TestCleanupManager();
    }
    return TestCleanupManager.instance;
  }

  /**
   * Register cleanup function
   */
  register(cleanupFn: () => Promise<void>): void {
    this.cleanupFunctions.push(cleanupFn);
  }

  /**
   * Execute all cleanup functions
   */
  async cleanup(): Promise<void> {
    for (const cleanupFn of this.cleanupFunctions.reverse()) {
      try {
        await cleanupFn();
      } catch (error) {
        console.error('Cleanup function failed:', error);
      }
    }
    this.cleanupFunctions = [];
  }

  /**
   * Clear all registered cleanup functions
   */
  clear(): void {
    this.cleanupFunctions = [];
  }
}

/**
 * Database truncation utilities
 */
export class DatabaseManager {
  constructor(private dataSource: DataSource) {}

  /**
   * Truncate all tables
   */
  async truncateAll(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.clear();
    }
  }

  /**
   * Reset sequences/counters
   */
  async resetSequences(): Promise<void> {
    // Reset auto-increment counters if using PostgreSQL
    if (this.dataSource.options.type === 'postgres') {
      const entities = this.dataSource.entityMetadatas;

      for (const entity of entities) {
        if (entity.tableName) {
          await this.dataSource.query(`ALTER SEQUENCE ${entity.tableName}_id_seq RESTART WITH 1;`);
        }
      }
    }
  }

  /**
   * Complete database reset
   */
  async resetDatabase(): Promise<void> {
    await this.truncateAll();
    await this.resetSequences();
  }
}

/**
 * Time freezing utilities for testing
 */
export class TimeFreezer {
  private static frozenTime: Date | null = null;

  static freezeTime(time: Date): void {
    this.frozenTime = time;
  }

  static unfreezeTime(): void {
    this.frozenTime = null;
  }

  static getFrozenTime(): Date | null {
    return this.frozenTime;
  }

  static now(): number {
    return this.frozenTime ? this.frozenTime.getTime() : Date.now();
  }
}

/**
 * Export singleton instances
 */
export const gdprGenerator = GDPRTestDataGenerator;
export const scenarioBuilder = new TestScenarioBuilder();
export const cleanupManager = TestCleanupManager.getInstance();
export const timeFreezer = TimeFreezer;
