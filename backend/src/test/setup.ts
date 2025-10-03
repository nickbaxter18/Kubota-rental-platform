import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { agent } from 'supertest';
import { Repository } from 'typeorm';

// Test database entities
import { Booking, BookingStatus } from '../entities/booking.entity';
import { Contract, ContractStatus } from '../entities/contract.entity';
import { Equipment, EquipmentStatus, EquipmentType } from '../entities/equipment.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { User, UserRole, UserStatus } from '../entities/user.entity';

// Test utilities
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  passwordHash: 'hashedpassword123',
  role: UserRole.CUSTOMER,
  status: UserStatus.ACTIVE,
  phone: '555-0123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestEquipment = (overrides = {}): Partial<Equipment> => ({
  id: 'test-equipment-123',
  unitId: 'SVL75-001',
  serialNumber: '123456789',
  type: EquipmentType.SVL75,
  model: 'SVL75-3',
  make: 'Kubota',
  year: 2025,
  description: 'High-performance compact track loader',
  dailyRate: 350,
  weeklyRate: 2000,
  monthlyRate: 7500,
  overageHourlyRate: 65,
  status: EquipmentStatus.AVAILABLE,
  replacementValue: 120000,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestBooking = (overrides = {}): Partial<Booking> => ({
  id: 'test-booking-123',
  bookingNumber: 'UDR-2024-001',
  startDate: new Date('2024-12-15'),
  endDate: new Date('2024-12-17'),
  status: BookingStatus.CONFIRMED,
  dailyRate: 350,
  subtotal: 700,
  taxes: 105,
  floatFee: 150,
  total: 955,
  securityDeposit: 500,
  customerId: 'test-user-123',
  equipmentId: 'test-equipment-123',
  deliveryAddress: '123 Main Street',
  deliveryCity: 'Saint John',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestContract = (overrides = {}): Partial<Contract> => ({
  id: 'test-contract-123',
  contractNumber: 'CON-2024-001',
  bookingId: 'test-booking-123',
  type: 'combined' as any,
  status: ContractStatus.DRAFT,
  documentUrl: 'https://example.com/contract.pdf',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestPayment = (overrides = {}): Partial<Payment> => ({
  id: 'test-payment-123',
  bookingId: 'test-booking-123',
  paymentNumber: 'PAY-2024-001',
  type: 'deposit' as any,
  method: 'credit_card' as any,
  amount: 500,
  status: PaymentStatus.PENDING,
  stripePaymentIntentId: 'pi_test_123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock repositories
export const createMockRepository = <T>() => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getCount: jest.fn(),
  })),
});

// Test app setup
export const createTestApp = async (moduleFixture: TestingModule): Promise<INestApplication> => {
  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
};

// API test helpers
export const createAuthenticatedRequest = (app: INestApplication, token?: string) => {
  const req = agent(app.getHttpServer());
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  return req;
};

export const expectValidationError = (response: any, field: string, message?: string) => {
  expect(response.status).toBe(400);
  expect(response.body.message).toContain('Validation failed');
  if (message) {
    expect(response.body.message).toContain(message);
  }
};

export const expectUnauthorizedError = (response: any) => {
  expect(response.status).toBe(401);
  expect(response.body.message).toBe('Unauthorized');
};

export const expectNotFoundError = (response: any) => {
  expect(response.status).toBe(404);
  expect(response.body.message).toBe('Not found');
};

// Database test helpers
export const clearDatabase = async (app: INestApplication) => {
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const equipmentRepository = app.get<Repository<Equipment>>(getRepositoryToken(Equipment));
  const bookingRepository = app.get<Repository<Booking>>(getRepositoryToken(Booking));

  // Only clear repositories that are actually provided in the test module
  try {
    await bookingRepository.delete({});
    await equipmentRepository.delete({});
    await userRepository.delete({});
  } catch (error) {
    // Ignore errors for missing repositories in test context
  }
};

// Seed test data
export const seedTestData = async (app: INestApplication) => {
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const equipmentRepository = app.get<Repository<Equipment>>(getRepositoryToken(Equipment));

  const testUser = userRepository.create(createTestUser());
  const savedUser = await userRepository.save(testUser);

  const testEquipment = equipmentRepository.create(createTestEquipment());
  const savedEquipment = await equipmentRepository.save(testEquipment);

  return { user: savedUser, equipment: savedEquipment };
};

// Global test configuration
beforeAll(async () => {
  // Global test setup
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';

  // Critical infrastructure fixes
  process.env.LC_ALL = 'en_US.UTF-8';
  process.env.LANG = 'en_US.UTF-8';
  process.env.DISABLE_EXTERNAL_SERVICES = 'true';

  // Redis test configuration
  process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
  process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
});

afterAll(async () => {
  // Global test cleanup
});

// Mock external services
export const mockStripeService = () => ({
  paymentIntents: {
    create: jest.fn().mockResolvedValue({ id: 'pi_test_123', client_secret: 'secret_123' }),
    retrieve: jest.fn().mockResolvedValue({ id: 'pi_test_123', status: 'succeeded' }),
    confirm: jest.fn().mockResolvedValue({ id: 'pi_test_123', status: 'succeeded' }),
    cancel: jest.fn().mockResolvedValue({ id: 'pi_test_123', status: 'canceled' }),
  },
  paymentMethods: {
    attach: jest.fn().mockResolvedValue({ id: 'pm_test_123' }),
    detach: jest.fn().mockResolvedValue({ id: 'pm_test_123' }),
  },
  webhooks: {
    constructEvent: jest.fn().mockReturnValue({ type: 'payment_intent.succeeded', data: { object: {} } }),
  },
});

export const mockDocuSignService = () => ({
  createEnvelope: jest.fn().mockResolvedValue({ envelopeId: 'env_test_123' }),
  getEnvelope: jest.fn().mockResolvedValue({ status: 'completed', documents: [] }),
  sendEnvelope: jest.fn().mockResolvedValue({ envelopeId: 'env_test_123' }),
  downloadDocument: jest.fn().mockResolvedValue(Buffer.from('mock document')),
});

export const mockEmailService = () => ({
  sendBookingConfirmation: jest.fn().mockResolvedValue(true),
  sendPaymentConfirmation: jest.fn().mockResolvedValue(true),
  sendContractReady: jest.fn().mockResolvedValue(true),
  sendReminder: jest.fn().mockResolvedValue(true),
});

// External service detection and mocking
export const shouldUseExternalServices = (): boolean => {
  return process.env.DISABLE_EXTERNAL_SERVICES !== 'true' && process.env.NODE_ENV !== 'test';
};

export const getMockService = (serviceName: string) => {
  if (!shouldUseExternalServices()) {
    switch (serviceName) {
      case 'stripe':
        return mockStripeService();
      case 'docusign':
        return mockDocuSignService();
      case 'email':
        return mockEmailService();
      default:
        return null;
    }
  }
  return null;
};

// Error response helpers
export const createErrorResponse = (message: string, statusCode = 400) => ({
  statusCode,
  message: [message],
  error: 'Bad Request',
});

// Success response helpers
export const createSuccessResponse = (data: any, message = 'Success') => ({
  success: true,
  message,
  data,
});

// Pagination helpers
export const createPaginatedResponse = <T>(items: T[], total: number, page: number, limit: number) => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

// Date helpers for testing
export const createTestDate = (daysFromNow = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

export const createDateRange = (startDaysFromNow = 0, endDaysFromNow = 2) => ({
  startDate: createTestDate(startDaysFromNow),
  endDate: createTestDate(endDaysFromNow),
});

// Async test helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retry = async (fn: () => Promise<any>, attempts = 3, delay = 1000) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await waitFor(delay);
    }
  }
};
