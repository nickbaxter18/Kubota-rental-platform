import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Test data factories for consistent, realistic test data
export class TestDataFactory {
  private static userCounter = 1;
  private static equipmentCounter = 1;
  private static bookingCounter = 1;

  static createTestUser(overrides = {}) {
    const id = `user-${this.userCounter++}`;
    return {
      id,
      email: `test${id}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      passwordHash: '$2b$10$test.hash.for.testing',
      role: 'customer',
      status: 'active',
      phone: '555-0123',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createTestEquipment(overrides = {}) {
    const id = `equipment-${this.equipmentCounter++}`;
    return {
      id,
      unitId: `SVL75-${String(this.equipmentCounter).padStart(3, '0')}`,
      serialNumber: `TEST${String(this.equipmentCounter).padStart(6, '0')}`,
      type: 'SVL75',
      model: 'SVL75-3',
      make: 'Kubota',
      year: 2025,
      description: 'High-performance compact track loader',
      dailyRate: 350,
      weeklyRate: 2000,
      monthlyRate: 7500,
      overageHourlyRate: 65,
      status: 'available',
      replacementValue: 120000,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createTestBooking(overrides = {}) {
    const id = `booking-${this.bookingCounter++}`;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // Next week

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2); // 2 days later

    return {
      id,
      bookingNumber: `UDR-2024-${String(this.bookingCounter).padStart(3, '0')}`,
      startDate,
      endDate,
      status: 'confirmed',
      dailyRate: 350,
      subtotal: 700,
      taxes: 105,
      floatFee: 150,
      total: 955,
      securityDeposit: 500,
      customerId: `user-${this.userCounter - 1}`,
      equipmentId: `equipment-${this.equipmentCounter - 1}`,
      deliveryAddress: '123 Main Street',
      deliveryCity: 'Saint John',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createTestPayment(overrides = {}) {
    return {
      id: `payment-${Date.now()}`,
      bookingId: `booking-${this.bookingCounter - 1}`,
      paymentNumber: `PAY-2024-${String(this.bookingCounter).padStart(3, '0')}`,
      type: 'deposit',
      method: 'credit_card',
      amount: 500,
      status: 'pending',
      stripePaymentIntentId: `pi_test_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }
}

// Enhanced mock repository with realistic behavior
export const createRealisticMockRepository = <T>() => {
  const data: T[] = [];

  return {
    find: jest.fn().mockImplementation((options?: any) => {
      if (options?.where) {
        return data.filter(item => {
          const itemObj = item as any;
          return Object.entries(options.where).every(([key, value]) => {
            return itemObj[key] === value;
          });
        });
      }
      return [...data];
    }),

    findOne: jest.fn().mockImplementation((options?: any) => {
      if (typeof options === 'string') {
        return data.find(item => (item as any).id === options) || null;
      }

      if (options?.where) {
        return data.find(item => {
          const itemObj = item as any;
          return Object.entries(options.where).every(([key, value]) => {
            return itemObj[key] === value;
          });
        }) || null;
      }

      return data[0] || null;
    }),

    findOneBy: jest.fn().mockImplementation((criteria: any) => {
      return data.find(item => {
        const itemObj = item as any;
        return Object.entries(criteria).every(([key, value]) => {
          return itemObj[key] === value;
        });
      }) || null;
    }),

    create: jest.fn().mockImplementation((entity: any) => {
      const newItem = {
        ...entity,
        id: `${entity.constructor.name.toLowerCase()}-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as T;
      return newItem;
    }),

    save: jest.fn().mockImplementation((entity: T) => {
      const savedEntity = {
        ...entity,
        updatedAt: new Date(),
      };
      data.push(savedEntity);
      return Promise.resolve(savedEntity);
    }),

    update: jest.fn().mockImplementation((id: string, updateData: any) => {
      const index = data.findIndex(item => (item as any).id === id);
      if (index !== -1) {
        data[index] = { ...data[index], ...updateData, updatedAt: new Date() };
        return Promise.resolve({ affected: 1 });
      }
      return Promise.resolve({ affected: 0 });
    }),

    delete: jest.fn().mockImplementation((id: string) => {
      const index = data.findIndex(item => (item as any).id === id);
      if (index !== -1) {
        data.splice(index, 1);
        return Promise.resolve({ affected: 1 });
      }
      return Promise.resolve({ affected: 0 });
    }),

    remove: jest.fn().mockImplementation((entity: T) => {
      const index = data.findIndex(item => item === entity);
      if (index !== -1) {
        data.splice(index, 1);
      }
      return Promise.resolve(entity);
    }),

    count: jest.fn().mockResolvedValue(data.length),

    clear: jest.fn().mockImplementation(() => {
      data.length = 0;
      return Promise.resolve();
    }),

    // Helper methods for testing
    getData: () => [...data],
    setData: (newData: T[]) => { data.length = 0; data.push(...newData); },
  };
};

// Performance-optimized test app creation
export const createOptimizedTestApp = async (moduleFixture: TestingModule): Promise<INestApplication> => {
  const app = moduleFixture.createNestApplication();

  // Disable logging for faster tests
  app.useLogger(false);

  await app.init();

  return app;
};

// Realistic service mocks
export const createRealisticStripeMock = () => ({
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret',
      status: 'requires_payment_method',
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'pi_test_123',
      status: 'succeeded',
      amount: 50000,
      currency: 'usd',
    }),
    confirm: jest.fn().mockResolvedValue({
      id: 'pi_test_123',
      status: 'succeeded',
    }),
    cancel: jest.fn().mockResolvedValue({
      id: 'pi_test_123',
      status: 'canceled',
    }),
  },
  paymentMethods: {
    attach: jest.fn().mockResolvedValue({
      id: 'pm_test_123',
      type: 'card',
    }),
    detach: jest.fn().mockResolvedValue({
      id: 'pm_test_123',
    }),
  },
  webhooks: {
    constructEvent: jest.fn().mockReturnValue({
      id: 'evt_test_123',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test_123' } },
    }),
  },
});

export const createRealisticDocuSignMock = () => ({
  createEnvelope: jest.fn().mockResolvedValue({
    envelopeId: 'env_test_123',
    status: 'sent',
    uri: '/envelopes/env_test_123',
  }),
  getEnvelope: jest.fn().mockResolvedValue({
    envelopeId: 'env_test_123',
    status: 'completed',
    documentsUri: '/envelopes/env_test_123/documents',
  }),
  sendEnvelope: jest.fn().mockResolvedValue({
    envelopeId: 'env_test_123',
    status: 'sent',
  }),
  downloadDocument: jest.fn().mockResolvedValue({
    documentId: 'doc_test_123',
    data: Buffer.from('test document content'),
  }),
});

// Enhanced response matchers for better error messages
export const createResponseMatchers = () => ({
  toBeValidBooking: (received: any) => {
    const pass = received &&
                 received.id &&
                 received.bookingNumber &&
                 received.startDate &&
                 received.endDate &&
                 received.total;

    if (pass) {
      return {
        message: () => `Expected ${JSON.stringify(received)} to be a valid booking`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${JSON.stringify(received)} to be a valid booking with id, bookingNumber, dates, and total`,
        pass: false,
      };
    }
  },

  toHaveValidPricing: (received: any) => {
    const pass = received &&
                 typeof received.dailyRate === 'number' &&
                 typeof received.days === 'number' &&
                 typeof received.subtotal === 'number' &&
                 typeof received.taxes === 'number' &&
                 typeof received.total === 'number';

    if (pass) {
      return {
        message: () => `Expected ${JSON.stringify(received)} to have valid pricing`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${JSON.stringify(received)} to have valid pricing structure`,
        pass: false,
      };
    }
  },
});

// Database performance helpers
export const createDatabaseHelpers = (app: INestApplication) => ({
  clearAll: async () => {
    // Clear all tables in correct order (respecting foreign keys)
    const entities = ['Booking', 'Payment', 'Contract', 'Equipment', 'User'];

    for (const entityName of entities) {
      try {
        const repository = app.get<Repository<any>>(getRepositoryToken(entityName as any));
        await repository.clear();
      } catch {
        // Ignore errors for missing repositories
      }
    }
  },

  seedTestData: async () => {
    const userRepo = app.get<Repository<any>>(getRepositoryToken('User' as any));
    const equipmentRepo = app.get<Repository<any>>(getRepositoryToken('Equipment' as any));
    const bookingRepo = app.get<Repository<any>>(getRepositoryToken('Booking' as any));

    const user = userRepo.create(TestDataFactory.createTestUser());
    const savedUser = await userRepo.save(user);

    const equipment = equipmentRepo.create(TestDataFactory.createTestEquipment());
    const savedEquipment = await equipmentRepo.save(equipment);

    const booking = bookingRepo.create(TestDataFactory.createTestBooking({
      customerId: savedUser.id,
      equipmentId: savedEquipment.id,
    }));
    const savedBooking = await bookingRepo.save(booking);

    return { user: savedUser, equipment: savedEquipment, booking: savedBooking };
  },
});

// Performance monitoring for tests
export const createPerformanceMonitor = () => {
  const startTimes = new Map<string, number>();

  return {
    startTimer: (testName: string) => {
      startTimes.set(testName, Date.now());
    },

    endTimer: (testName: string) => {
      const startTime = startTimes.get(testName);
      if (startTime) {
        const duration = Date.now() - startTime;
        if (duration > 100) {
          console.warn(`⚠️  Slow test detected: ${testName} took ${duration}ms`);
        }
        startTimes.delete(testName);
        return duration;
      }
      return 0;
    },

    getActiveTimers: () => Array.from(startTimes.keys()),
  };
};

// Global test configuration
export const setupGlobalTestConfig = () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_for_testing';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_webhook_secret';
  process.env.DOCUSIGN_CLIENT_ID = 'test-docusign-client-id';
  process.env.DOCUSIGN_USER_ID = 'test-docusign-user-id';
  process.env.DOCUSIGN_PRIVATE_KEY = 'test-docusign-private-key';
  process.env.DOCUSIGN_ACCOUNT_ID = 'test-docusign-account-id';

  // Disable external service calls in tests
  process.env.DISABLE_EXTERNAL_SERVICES = 'true';

  // Set test database URL
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/udigit_test';
};

// Error simulation utilities
export const createErrorSimulation = () => ({
  simulateNetworkError: () => {
    throw new Error('Network connection failed');
  },

  simulateTimeout: () => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), 100);
    });
  },

  simulateValidationError: (field: string, message: string) => {
    const error = new Error(`Validation failed: ${message}`);
    (error as any).status = 400;
    (error as any).response = {
      message: [`${field}: ${message}`],
    };
    throw error;
  },

  simulateNotFoundError: (resource: string) => {
    const error = new Error(`${resource} not found`);
    (error as any).status = 404;
    throw error;
  },
});

// Test data validation helpers
export const createValidationHelpers = () => ({
  isValidBooking: (booking: any) => {
    return booking &&
           booking.id &&
           booking.bookingNumber &&
           booking.startDate &&
           booking.endDate &&
           booking.customerId &&
           booking.equipmentId &&
           booking.total > 0;
  },

  isValidUser: (user: any) => {
    return user &&
           user.id &&
           user.email &&
           user.firstName &&
           user.lastName &&
           user.role;
  },

  isValidEquipment: (equipment: any) => {
    return equipment &&
           equipment.id &&
           equipment.unitId &&
           equipment.type &&
           equipment.dailyRate > 0;
  },
});

// Export commonly used test patterns
export const createCommonTestPatterns = () => ({
  testSuccessfulCreation: async (
    createFn: (data: any) => Promise<any>,
    validData: any,
    expectedStatus = 201
  ) => {
    const response = await createFn(validData);
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toBeDefined();
    return response.body;
  },

  testValidationError: async (
    createFn: (data: any) => Promise<any>,
    invalidData: any,
    expectedField: string
  ) => {
    const response = await createFn(invalidData);
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Validation failed');
    if (expectedField) {
      expect(response.body.message).toContain(expectedField);
    }
  },

  testNotFoundError: async (
    getFn: (id: string) => Promise<any>,
    invalidId: string
  ) => {
    const response = await getFn(invalidId);
    expect(response.status).toBe(404);
  },

  testUnauthorizedError: async (
    protectedFn: () => Promise<any>
  ) => {
    const response = await protectedFn();
    expect(response.status).toBe(401);
  },
});
