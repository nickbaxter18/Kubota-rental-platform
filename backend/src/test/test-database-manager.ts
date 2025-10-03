import { DataSource, Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Contract } from '../entities/contract.entity';
import { Equipment } from '../entities/equipment.entity';
import { InsuranceDocument } from '../entities/insurance-document.entity';
import { Payment } from '../entities/payment.entity';
import { User } from '../entities/user.entity';

/**
 * Test database manager for integration tests
 * Provides in-memory SQLite database with factory methods for test data
 */
export class TestDatabaseManager {
  private dataSource: DataSource;
  private repositories: Map<string, Repository<any>> = new Map();

  async initialize(): Promise<void> {
    this.dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [
        User,
        Equipment,
        Booking,
        Contract,
        Payment,
        InsuranceDocument,
      ],
      synchronize: true,
      logging: false,
    });

    await this.dataSource.initialize();
    this.initializeRepositories();
  }

  private initializeRepositories(): void {
    this.repositories.set('user', this.dataSource.getRepository(User));
    this.repositories.set('equipment', this.dataSource.getRepository(Equipment));
    this.repositories.set('booking', this.dataSource.getRepository(Booking));
    this.repositories.set('contract', this.dataSource.getRepository(Contract));
    this.repositories.set('payment', this.dataSource.getRepository(Payment));
    this.repositories.set('insuranceDocument', this.dataSource.getRepository(InsuranceDocument));
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }

  getRepository(entityName: string): Repository<any> {
    const repository = this.repositories.get(entityName);
    if (!repository) {
      throw new Error(`Repository for ${entityName} not found`);
    }
    return repository;
  }

  async seedDatabase(dataSource: DataSource, seedData?: any): Promise<void> {
    // Seed with default test data or provided data
    const defaultSeedData = seedData || this.getDefaultSeedData();

    for (const [entityName, entities] of Object.entries(defaultSeedData)) {
      const repository = this.getRepository(entityName);
      await repository.save(entities);
    }
  }

  async clearDatabase(dataSource: DataSource): Promise<void> {
    const entities = dataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }
  }

  private getDefaultSeedData() {
    return {
      user: [
        {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'hashedpassword',
          role: 'customer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          password: 'hashedpassword',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      equipment: [
        {
          id: 'equipment-1',
          name: 'Kubota SVL-75',
          description: 'Compact track loader',
          category: 'loader',
          dailyRate: 150,
          available: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      booking: [
        {
          id: 'booking-1',
          userId: 'user-1',
          equipmentId: 'equipment-1',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          totalAmount: 1050,
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };
  }

  async close(): Promise<void> {
    if (this.dataSource) {
      await this.dataSource.destroy();
    }
  }

  // Factory methods for creating test data
  async createUser(overrides: Partial<User> = {}): Promise<User> {
    const repository = this.getRepository('user');
    const user = repository.create({
      email: `test${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      password: 'hashedpassword',
      role: 'customer',
      ...overrides,
    });
    return repository.save(user);
  }

  async createEquipment(overrides: Partial<Equipment> = {}): Promise<Equipment> {
    const repository = this.getRepository('equipment');
    const equipment = repository.create({
      name: 'Test Equipment',
      description: 'Test equipment description',
      category: 'loader',
      dailyRate: 100,
      available: true,
      ...overrides,
    });
    return repository.save(equipment);
  }

  async createBooking(user: User, equipment: Equipment, overrides: Partial<Booking> = {}): Promise<Booking> {
    const repository = this.getRepository('booking');
    const booking = repository.create({
      userId: user.id,
      equipmentId: equipment.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      totalAmount: equipment.dailyRate * 3,
      status: 'pending',
      ...overrides,
    });
    return repository.save(booking);
  }
}
