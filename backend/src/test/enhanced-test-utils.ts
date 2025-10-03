import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Contract } from '../entities/contract.entity';
import { Equipment } from '../entities/equipment.entity';
import { Payment } from '../entities/payment.entity';
import { User } from '../entities/user.entity';
import { TestDatabaseManager } from './test-database-manager';

// Enhanced test utilities with factory pattern
export class TestDataFactory {
  private testData: any = {};

  constructor(private app: INestApplication) {}

  async createUser(overrides: any = {}) {
    const userRepository = this.app.get<Repository<User>>(getRepositoryToken(User));

    const defaultUser = {
      id: 'test-user-' + Date.now(),
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      passwordHash: 'hashedpassword123',
      role: 'customer',
      status: 'active',
      phone: '555-0123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const user = userRepository.create({ ...defaultUser, ...overrides } as any);
    const savedUser = await userRepository.save(user);

    this.testData.users = this.testData.users || [];
    this.testData.users.push(savedUser);

    return savedUser;
  }

  async createEquipment(overrides: any = {}) {
    const equipmentRepository = this.app.get<Repository<Equipment>>(getRepositoryToken(Equipment));

    const defaultEquipment = {
      id: 'test-equipment-' + Date.now(),
      unitId: 'SVL75-' + Math.floor(Math.random() * 1000),
      serialNumber: 'SN' + Math.floor(Math.random() * 1000000),
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
    };

    const equipment = equipmentRepository.create({ ...defaultEquipment, ...overrides } as any);
    const savedEquipment = await equipmentRepository.save(equipment);

    this.testData.equipment = this.testData.equipment || [];
    this.testData.equipment.push(savedEquipment);

    return savedEquipment;
  }

  async createBooking(userId: string, equipmentId: string, overrides: any = {}) {
    const bookingRepository = this.app.get<Repository<Booking>>(getRepositoryToken(Booking));

    const defaultBooking = {
      id: 'test-booking-' + Date.now(),
      bookingNumber: 'UDR-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000),
      startDate: new Date('2024-12-15'),
      endDate: new Date('2024-12-17'),
      status: 'confirmed',
      dailyRate: 350,
      subtotal: 700,
      taxes: 105,
      floatFee: 150,
      total: 955,
      securityDeposit: 500,
      customerId: userId,
      equipmentId: equipmentId,
      deliveryAddress: '123 Main Street',
      deliveryCity: 'Saint John',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const booking = bookingRepository.create({ ...defaultBooking, ...overrides } as any);
    const savedBooking = await bookingRepository.save(booking);

    this.testData.bookings = this.testData.bookings || [];
    this.testData.bookings.push(savedBooking);

    return savedBooking;
  }

  async createPayment(bookingId: string, overrides: any = {}) {
    const paymentRepository = this.app.get<Repository<Payment>>(getRepositoryToken(Payment));

    const defaultPayment = {
      id: 'test-payment-' + Date.now(),
      bookingId: bookingId,
      paymentNumber: 'PAY-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000),
      type: 'deposit',
      method: 'credit_card',
      amount: 500,
      status: 'pending',
      stripePaymentIntentId: 'pi_test_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const payment = paymentRepository.create({ ...defaultPayment, ...overrides } as any);
    const savedPayment = await paymentRepository.save(payment);

    this.testData.payments = this.testData.payments || [];
    this.testData.payments.push(savedPayment);

    return savedPayment;
  }

  async createContract(bookingId: string, overrides: any = {}) {
    const contractRepository = this.app.get<Repository<Contract>>(getRepositoryToken(Contract));

    const defaultContract = {
      id: 'test-contract-' + Date.now(),
      contractNumber: 'CON-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000),
      bookingId: bookingId,
      type: 'combined',
      status: 'draft',
      documentUrl: 'https://example.com/contract.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const contract = contractRepository.create({ ...defaultContract, ...overrides } as any);
    const savedContract = await contractRepository.save(contract);

    this.testData.contracts = this.testData.contracts || [];
    this.testData.contracts.push(savedContract);

    return savedContract;
  }

  // Create complete booking scenario
  async createCompleteBookingScenario(overrides: any = {}) {
    const user = await this.createUser(overrides.user);
    const equipment = await this.createEquipment(overrides.equipment);
    const booking = await this.createBooking(user.id, equipment.id, overrides.booking);
    const payment = await this.createPayment(booking.id, overrides.payment);
    const contract = await this.createContract(booking.id, overrides.contract);

    return {
      user,
      equipment,
      booking,
      payment,
      contract,
    };
  }

  // Cleanup all created test data
  async cleanup() {
    const dbManager = new TestDatabaseManager();

    if (this.testData.bookings) {
      for (const booking of this.testData.bookings) {
        try {
          await dbManager.getRepository('booking').delete(booking.id);
        } catch (error) {
          console.warn(`Failed to cleanup booking ${booking.id}:`, error.message);
        }
      }
    }

    if (this.testData.payments) {
      for (const payment of this.testData.payments) {
        try {
          await dbManager.getRepository('payment').delete(payment.id);
        } catch (error) {
          console.warn(`Failed to cleanup payment ${payment.id}:`, error.message);
        }
      }
    }

    if (this.testData.contracts) {
      for (const contract of this.testData.contracts) {
        try {
          await dbManager.getRepository('contract').delete(contract.id);
        } catch (error) {
          console.warn(`Failed to cleanup contract ${contract.id}:`, error.message);
        }
      }
    }

    if (this.testData.equipment) {
      for (const equipment of this.testData.equipment) {
        try {
          await dbManager.getRepository('equipment').delete(equipment.id);
        } catch (error) {
          console.warn(`Failed to cleanup equipment ${equipment.id}:`, error.message);
        }
      }
    }

    if (this.testData.users) {
      for (const user of this.testData.users) {
        try {
          await dbManager.getRepository('user').delete(user.id);
        } catch (error) {
          console.warn(`Failed to cleanup user ${user.id}:`, error.message);
        }
      }
    }

    this.testData = {};
    console.log('✅ Test data cleanup completed');
  }

  getTestData() {
    return this.testData;
  }
}

// Time freezing utilities for deterministic tests
export class TimeMock {
  private originalDate: DateConstructor;
  private frozenTime: Date | null = null;

  freeze(time: Date = new Date('2024-12-15T10:00:00Z')) {
    this.frozenTime = time;
    this.originalDate = global.Date;

    // Mock Date constructor
    global.Date = class extends Date {
      constructor(...args: any[]) {
        if (args.length === 0 && TimeMock.getInstance().frozenTime) {
          super(TimeMock.getInstance().frozenTime);
        } else {
          super(...args);
        }
      }

      static now() {
        return TimeMock.getInstance().frozenTime?.getTime() || Date.now();
      }
    } as any;
  }

  unfreeze() {
    if (this.originalDate) {
      global.Date = this.originalDate;
      this.frozenTime = null;
    }
  }

  private static instance: TimeMock;
  static getInstance(): TimeMock {
    if (!TimeMock.instance) {
      TimeMock.instance = new TimeMock();
    }
    return TimeMock.instance;
  }
}

// Enhanced API test helpers
export class ApiTestHelper {
  constructor(private app: INestApplication) {}

  async authenticate(user: any) {
    // This would typically create a JWT token for the user
    // For now, return a mock token
    return {
      access_token: 'mock-jwt-token-for-' + user.id,
      user: user,
    };
  }

  async makeAuthenticatedRequest(method: 'get' | 'post' | 'put' | 'delete', url: string, token: string, data?: any): Promise<any> {
    const { default: supertest } = await import('supertest');
    const agent = supertest(this.app.getHttpServer());

    let request = agent[method](url)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');

    if (data) {
      request = request.send(data);
    }

    return request;
  }
}

// Export factory function
export const createTestDataFactory = (app: INestApplication) => new TestDataFactory(app);
export const createApiTestHelper = (app: INestApplication) => new ApiTestHelper(app);
