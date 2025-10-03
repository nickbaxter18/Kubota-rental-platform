import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingsService } from '../../bookings/bookings.service';
import { Booking } from '../../entities/booking.entity';
import { Equipment } from '../../entities/equipment.entity';
import { User } from '../../entities/user.entity';
import {
    TestDataFactory,
    createCommonTestPatterns,
    createPerformanceMonitor,
    createRealisticMockRepository,
    createValidationHelpers,
    setupGlobalTestConfig,
} from '../../test/test-utils';

// Setup global test configuration
setupGlobalTestConfig();

describe('BookingsService (Unit Tests)', () => {
  let service: BookingsService;
  let bookingRepository: jest.Mocked<Repository<Booking>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let equipmentRepository: jest.Mocked<Repository<Equipment>>;
  let performanceMonitor: ReturnType<typeof createPerformanceMonitor>;
  let validationHelpers: ReturnType<typeof createValidationHelpers>;
  let testPatterns: ReturnType<typeof createCommonTestPatterns>;

  beforeAll(() => {
    performanceMonitor = createPerformanceMonitor();
    validationHelpers = createValidationHelpers();
    testPatterns = createCommonTestPatterns();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: createRealisticMockRepository<Booking>(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createRealisticMockRepository<User>(),
        },
        {
          provide: getRepositoryToken(Equipment),
          useValue: createRealisticMockRepository<Equipment>(),
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingRepository = module.get(getRepositoryToken(Booking));
    userRepository = module.get(getRepositoryToken(User));
    equipmentRepository = module.get(getRepositoryToken(Equipment));

    // Clear all repositories before each test
    bookingRepository.clear();
    userRepository.clear();
    equipmentRepository.clear();
  });

  describe('create() - Critical Path', () => {
    it('should create a booking successfully with valid data', async () => {
      performanceMonitor.startTimer('create-booking-success');

      // Arrange
      const testUser = TestDataFactory.createTestUser();
      const testEquipment = TestDataFactory.createTestEquipment();
      const createBookingDto = {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 2 days later
        equipmentId: testEquipment.id,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Saint John',
      };

      // Mock repository responses
      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);
      bookingRepository.find.mockResolvedValue([]); // No conflicting bookings
      bookingRepository.create.mockReturnValue({
        ...createBookingDto,
        id: 'booking-123',
        bookingNumber: 'UDR-2024-001',
        status: 'confirmed',
        dailyRate: 350,
        subtotal: 700,
        taxes: 105,
        floatFee: 150,
        total: 955,
        securityDeposit: 500,
        customerId: testUser.id,
        equipmentId: testEquipment.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await service.create(createBookingDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.bookingNumber).toBe('UDR-2024-001');
      expect(result.status).toBe('confirmed');
      expect(result.total).toBe(955);
      expect(validationHelpers.isValidBooking(result)).toBe(true);

      // Verify repository calls
      expect(userRepository.findOne).toHaveBeenCalledWith(testUser.id);
      expect(equipmentRepository.findOne).toHaveBeenCalledWith(testEquipment.id);
      expect(bookingRepository.find).toHaveBeenCalled(); // Check availability
      expect(bookingRepository.create).toHaveBeenCalled();
      expect(bookingRepository.save).toHaveBeenCalled();

      const duration = performanceMonitor.endTimer('create-booking-success');
      expect(duration).toBeLessThan(50); // Should be fast
    });

    it('should throw error when equipment is not available', async () => {
      // Arrange
      const testUser = TestDataFactory.createTestUser();
      const testEquipment = TestDataFactory.createTestEquipment();
      const conflictingBooking = TestDataFactory.createTestBooking({
        equipmentId: testEquipment.id,
        status: 'confirmed',
      });

      const createBookingDto = {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        equipmentId: testEquipment.id,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Saint John',
      };

      // Mock conflicting booking
      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);
      bookingRepository.find.mockResolvedValue([conflictingBooking] as any);

      // Act & Assert
      await expect(service.create(createBookingDto)).rejects.toThrow('Equipment not available');

      // Verify no booking was created
      expect(bookingRepository.create).not.toHaveBeenCalled();
      expect(bookingRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error for invalid date range', async () => {
      // Arrange
      const testUser = TestDataFactory.createTestUser();
      const testEquipment = TestDataFactory.createTestEquipment();

      const createBookingDto = {
        startDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // Later date
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Earlier date
        equipmentId: testEquipment.id,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Saint John',
      };

      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);

      // Act & Assert
      await expect(service.create(createBookingDto)).rejects.toThrow('End date must be after start date');
    });

    it('should throw error when customer does not exist', async () => {
      // Arrange
      const testEquipment = TestDataFactory.createTestEquipment();
      const createBookingDto = {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        equipmentId: testEquipment.id,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Saint John',
      };

      userRepository.findOne.mockResolvedValue(null); // Customer not found

      // Act & Assert
      await expect(service.create(createBookingDto)).rejects.toThrow('Customer not found');
    });

    it('should throw error when equipment does not exist', async () => {
      // Arrange
      const testUser = TestDataFactory.createTestUser();
      const createBookingDto = {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        equipmentId: 'non-existent-equipment',
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Saint John',
      };

      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(null); // Equipment not found

      // Act & Assert
      await expect(service.create(createBookingDto)).rejects.toThrow('Equipment not found');
    });
  });

  describe('findOne() - Critical Path', () => {
    it('should return booking when it exists', async () => {
      // Arrange
      const testBooking = TestDataFactory.createTestBooking();

      bookingRepository.findOne.mockResolvedValue(testBooking as any);

      // Act
      const result = await service.findOne(testBooking.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(testBooking.id);
      expect(result.bookingNumber).toBe(testBooking.bookingNumber);
      expect(validationHelpers.isValidBooking(result)).toBe(true);

      expect(bookingRepository.findOne).toHaveBeenCalledWith(testBooking.id);
    });

    it('should throw error when booking does not exist', async () => {
      // Arrange
      bookingRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent-id')).rejects.toThrow('Booking not found');

      expect(bookingRepository.findOne).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('findAll() - Critical Path', () => {
    it('should return all bookings when no filters provided', async () => {
      // Arrange
      const bookings = [
        TestDataFactory.createTestBooking({ id: 'booking-1' }),
        TestDataFactory.createTestBooking({ id: 'booking-2' }),
        TestDataFactory.createTestBooking({ id: 'booking-3' }),
      ];

      bookingRepository.find.mockResolvedValue(bookings as any);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toBeDefined();
      expect(result[1]).toBeDefined();
      expect(result[2]).toBeDefined();

      result.forEach(booking => {
        expect(validationHelpers.isValidBooking(booking)).toBe(true);
      });

      expect(bookingRepository.find).toHaveBeenCalledWith({});
    });

    it('should filter bookings by status', async () => {
      // Arrange
      const confirmedBookings = [
        TestDataFactory.createTestBooking({ id: 'booking-1', status: 'confirmed' }),
        TestDataFactory.createTestBooking({ id: 'booking-2', status: 'confirmed' }),
      ];

      bookingRepository.find.mockResolvedValue(confirmedBookings as any);

      // Act
      const result = await service.findAll({ status: 'confirmed' });

      // Assert
      expect(result).toHaveLength(2);
      result.forEach(booking => {
        expect(booking.status).toBe('confirmed');
      });

      expect(bookingRepository.find).toHaveBeenCalledWith({
        where: { status: 'confirmed' }
      });
    });

    it('should filter bookings by customer ID', async () => {
      // Arrange
      const customerBookings = [
        TestDataFactory.createTestBooking({ customerId: 'user-123' }),
      ];

      bookingRepository.find.mockResolvedValue(customerBookings as any);

      // Act
      const result = await service.findAll({ customerId: 'user-123' });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].customerId).toBe('user-123');

      expect(bookingRepository.find).toHaveBeenCalledWith({
        where: { customerId: 'user-123' }
      });
    });
  });

  describe('updateStatus() - Critical Path', () => {
    it('should update booking status successfully', async () => {
      // Arrange
      const testBooking = TestDataFactory.createTestBooking({
        id: 'booking-123',
        status: 'confirmed'
      });

      const updatedBooking = {
        ...testBooking,
        status: 'paid',
        updatedAt: new Date(),
      };

      bookingRepository.findOne.mockResolvedValue(testBooking as any);
      bookingRepository.save.mockResolvedValue(updatedBooking as any);

      // Act
      const result = await service.updateStatus('booking-123', 'paid');

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('paid');
      expect(result.id).toBe('booking-123');

      expect(bookingRepository.findOne).toHaveBeenCalledWith('booking-123');
      expect(bookingRepository.save).toHaveBeenCalledWith(updatedBooking);
    });

    it('should throw error when booking does not exist', async () => {
      // Arrange
      bookingRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateStatus('non-existent-id', 'paid'))
        .rejects.toThrow('Booking not found');

      expect(bookingRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error for invalid status transition', async () => {
      // Arrange
      const testBooking = TestDataFactory.createTestBooking({
        id: 'booking-123',
        status: 'completed'
      });

      bookingRepository.findOne.mockResolvedValue(testBooking as any);

      // Act & Assert
      await expect(service.updateStatus('booking-123', 'invalid-status'))
        .rejects.toThrow('Invalid status');

      expect(bookingRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('cancel() - Critical Path', () => {
    it('should cancel booking successfully with valid reason', async () => {
      // Arrange
      const testBooking = TestDataFactory.createTestBooking({
        id: 'booking-123',
        status: 'confirmed'
      });

      const cancelledBooking = {
        ...testBooking,
        status: 'cancelled',
        cancellationReason: 'Customer request',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      };

      bookingRepository.findOne.mockResolvedValue(testBooking as any);
      bookingRepository.save.mockResolvedValue(cancelledBooking as any);

      // Act
      const result = await service.cancel('booking-123', 'Customer request');

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('cancelled');
      expect(result.cancellationReason).toBe('Customer request');
      expect(result.cancelledAt).toBeDefined();

      expect(bookingRepository.findOne).toHaveBeenCalledWith('booking-123');
      expect(bookingRepository.save).toHaveBeenCalledWith(cancelledBooking);
    });

    it('should throw error when booking does not exist', async () => {
      // Arrange
      bookingRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.cancel('non-existent-id', 'Customer request'))
        .rejects.toThrow('Booking not found');

      expect(bookingRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when booking is already completed', async () => {
      // Arrange
      const completedBooking = TestDataFactory.createTestBooking({
        id: 'booking-123',
        status: 'completed'
      });

      bookingRepository.findOne.mockResolvedValue(completedBooking as any);

      // Act & Assert
      await expect(service.cancel('booking-123', 'Customer request'))
        .rejects.toThrow('Cannot cancel completed booking');

      expect(bookingRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('checkAvailability() - Critical Path', () => {
    it('should return true when equipment is available', async () => {
      // Arrange
      const equipmentId = 'equipment-123';
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

      // No conflicting bookings
      bookingRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.checkAvailability(equipmentId, startDate, endDate);

      // Assert
      expect(result.available).toBe(true);

      expect(bookingRepository.find).toHaveBeenCalledWith({
        where: {
          equipmentId,
          status: 'confirmed',
        },
      });
    });

    it('should return false when equipment is not available', async () => {
      // Arrange
      const equipmentId = 'equipment-123';
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

      const conflictingBooking = TestDataFactory.createTestBooking({
        equipmentId,
        status: 'confirmed',
        startDate,
        endDate: new Date(endDate.getTime() + 24 * 60 * 60 * 1000), // Overlapping
      });

      bookingRepository.find.mockResolvedValue([conflictingBooking] as any);

      // Act
      const result = await service.checkAvailability(equipmentId, startDate, endDate);

      // Assert
      expect(result.available).toBe(false);

      expect(bookingRepository.find).toHaveBeenCalledWith({
        where: {
          equipmentId,
          status: 'confirmed',
        },
      });
    });

    it('should handle edge case of exact date boundaries', async () => {
      // Arrange
      const equipmentId = 'equipment-123';
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

      // Booking ends exactly when new booking starts
      const adjacentBooking = TestDataFactory.createTestBooking({
        equipmentId,
        status: 'confirmed',
        startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        endDate: startDate, // Ends exactly when new booking starts
      });

      bookingRepository.find.mockResolvedValue([adjacentBooking] as any);

      // Act
      const result = await service.checkAvailability(equipmentId, startDate, endDate);

      // Assert
      expect(result.available).toBe(true); // Should be available since it ends at the start time
    });
  });

  describe('calculatePricing() - Critical Path', () => {
    it('should calculate pricing correctly for valid booking period', async () => {
      // Arrange
      const equipmentId = 'equipment-123';
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000); // 2 days

      const testEquipment = TestDataFactory.createTestEquipment({
        id: equipmentId,
        dailyRate: 350,
      });

      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);

      // Act
      const result = await service.calculatePricing(equipmentId, startDate, endDate, 'standard');

      // Assert
      expect(result).toBeDefined();
      expect(result.dailyRate).toBe(350);
      expect(result.days).toBe(2);
      expect(result.subtotal).toBe(700);
      expect(result.taxes).toBe(105); // 15% tax
      expect(result.floatFee).toBe(150); // Fixed float fee
      expect(result.total).toBe(955); // 700 + 105 + 150

      expect(equipmentRepository.findOne).toHaveBeenCalledWith(equipmentId);
    });

    it('should throw error when equipment does not exist', async () => {
      // Arrange
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

      equipmentRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.calculatePricing('non-existent-equipment', startDate, endDate, 'standard'))
        .rejects.toThrow('Equipment not found');
    });

    it('should handle single day booking correctly', async () => {
      // Arrange
      const equipmentId = 'equipment-123';
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // Same day

      const testEquipment = TestDataFactory.createTestEquipment({
        id: equipmentId,
        dailyRate: 350,
      });

      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);

      // Act
      const result = await service.calculatePricing(equipmentId, startDate, endDate, 'standard');

      // Assert
      expect(result.days).toBe(1);
      expect(result.subtotal).toBe(350);
      expect(result.total).toBe(610); // 350 + 52.5 + 150
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk operations efficiently', async () => {
      // Arrange
      const bookings = Array.from({ length: 100 }, (_, i) =>
        TestDataFactory.createTestBooking({ id: `booking-${i}` })
      );

      bookingRepository.find.mockResolvedValue(bookings as any);

      // Act
      const startTime = Date.now();
      const result = await service.findAll();
      const duration = Date.now() - startTime;

      // Assert
      expect(result).toHaveLength(100);
      expect(duration).toBeLessThan(100); // Should be fast even with 100 records
    });

    it('should handle concurrent booking creation', async () => {
      // Arrange
      const testUser = TestDataFactory.createTestUser();
      const testEquipment = TestDataFactory.createTestEquipment();

      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);
      bookingRepository.find.mockResolvedValue([]); // No conflicts

      const createBookingDto = {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        equipmentId: testEquipment.id,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Saint John',
      };

      // Act - Create multiple bookings concurrently
      const promises = Array.from({ length: 10 }, () =>
        service.create(createBookingDto)
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Assert
      expect(results).toHaveLength(10);
      results.forEach(booking => {
        expect(validationHelpers.isValidBooking(booking)).toBe(true);
      });
      expect(duration).toBeLessThan(200); // Should handle concurrent requests efficiently
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      bookingRepository.findOne.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.findOne('booking-123'))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle repository save errors', async () => {
      // Arrange
      const testUser = TestDataFactory.createTestUser();
      const testEquipment = TestDataFactory.createTestEquipment();

      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);
      bookingRepository.find.mockResolvedValue([]);
      bookingRepository.create.mockReturnValue({} as any);
      bookingRepository.save.mockRejectedValue(new Error('Save operation failed'));

      const createBookingDto = {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        equipmentId: testEquipment.id,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Saint John',
      };

      // Act & Assert
      await expect(service.create(createBookingDto))
        .rejects.toThrow('Save operation failed');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity', async () => {
      // Arrange
      const testUser = TestDataFactory.createTestUser();
      const testEquipment = TestDataFactory.createTestEquipment();

      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);
      bookingRepository.find.mockResolvedValue([]);

      const createBookingDto = {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        equipmentId: testEquipment.id,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Saint John',
      };

      // Act
      const result = await service.create(createBookingDto);

      // Assert
      expect(result.customerId).toBe(testUser.id);
      expect(result.equipmentId).toBe(testEquipment.id);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should generate unique booking numbers', async () => {
      // Arrange
      const testUser = TestDataFactory.createTestUser();
      const testEquipment = TestDataFactory.createTestEquipment();

      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);
      bookingRepository.find.mockResolvedValue([]);

      const createBookingDto = {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        equipmentId: testEquipment.id,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Saint John',
      };

      // Act
      const booking1 = await service.create(createBookingDto);
      const booking2 = await service.create(createBookingDto);

      // Assert
      expect(booking1.bookingNumber).not.toBe(booking2.bookingNumber);
      expect(booking1.bookingNumber).toMatch(/^UDR-2024-\d{3}$/);
      expect(booking2.bookingNumber).toMatch(/^UDR-2024-\d{3}$/);
    });
  });
});
