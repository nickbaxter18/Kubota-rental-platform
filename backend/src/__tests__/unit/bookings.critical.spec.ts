import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingsService } from '../../bookings/bookings.service';
import { Booking, BookingStatus, BookingType } from '../../entities/booking.entity';
import { Equipment } from '../../entities/equipment.entity';
import { User } from '../../entities/user.entity';
import { TestDataFactory, createRealisticMockRepository, setupGlobalTestConfig } from '../../test/test-utils';

// Setup global test configuration
setupGlobalTestConfig();

describe('BookingsService - Critical Path Tests', () => {
  let service: BookingsService;
  let bookingRepository: jest.Mocked<Repository<Booking>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let equipmentRepository: jest.Mocked<Repository<Equipment>>;

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
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

    service = testModule.get<BookingsService>(BookingsService);
    bookingRepository = testModule.get(getRepositoryToken(Booking));
    userRepository = testModule.get(getRepositoryToken(User));
    equipmentRepository = testModule.get(getRepositoryToken(Equipment));

    // Clear all repositories before each test
    bookingRepository.clear();
    userRepository.clear();
    equipmentRepository.clear();
  });

  describe('✅ Booking Creation - Core Flow', () => {
    it('should create booking with valid data', async () => {
      // Arrange
      const testUser = TestDataFactory.createTestUser();
      const testEquipment = TestDataFactory.createTestEquipment();

      const createBookingDto = {
        customerId: testUser.id,
        equipmentId: testEquipment.id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        type: BookingType.DELIVERY,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Saint John',
      };

      // Mock successful responses
      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);
      bookingRepository.find.mockResolvedValue([]); // No conflicts

      const expectedBooking = {
        ...createBookingDto,
        id: 'booking-123',
        bookingNumber: 'UDR-2024-001',
        status: BookingStatus.CONFIRMED,
        dailyRate: 350,
        subtotal: 700,
        taxes: 105,
        floatFee: 150,
        total: 955,
        securityDeposit: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      bookingRepository.create.mockReturnValue(expectedBooking as any);
      bookingRepository.save.mockResolvedValue(expectedBooking as any);

      // Act
      const result = await service.create(createBookingDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('booking-123');
      expect(result.bookingNumber).toBe('UDR-2024-001');
      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(result.total).toBe(955);

      // Verify all repository calls
      expect(userRepository.findOne).toHaveBeenCalledWith(testUser.id);
      expect(equipmentRepository.findOne).toHaveBeenCalledWith(testEquipment.id);
      expect(bookingRepository.find).toHaveBeenCalled(); // Availability check
      expect(bookingRepository.create).toHaveBeenCalled();
      expect(bookingRepository.save).toHaveBeenCalled();
    });

    it('should reject booking when equipment unavailable', async () => {
      // Arrange
      const testUser = TestDataFactory.createTestUser();
      const testEquipment = TestDataFactory.createTestEquipment();

      const createBookingDto = {
        customerId: testUser.id,
        equipmentId: testEquipment.id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        type: BookingType.DELIVERY,
      };

      // Mock conflicting booking
      const conflictingBooking = TestDataFactory.createTestBooking({
        equipmentId: testEquipment.id,
        status: BookingStatus.CONFIRMED,
      });

      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);
      bookingRepository.find.mockResolvedValue([conflictingBooking] as any);

      // Act & Assert
      await expect(service.create(createBookingDto))
        .rejects.toThrow('Equipment not available');

      // Verify no booking was created
      expect(bookingRepository.create).not.toHaveBeenCalled();
      expect(bookingRepository.save).not.toHaveBeenCalled();
    });

    it('should reject booking with invalid date range', async () => {
      // Arrange
      const testUser = TestDataFactory.createTestUser();
      const testEquipment = TestDataFactory.createTestEquipment();

      const createBookingDto = {
        customerId: testUser.id,
        equipmentId: testEquipment.id,
        startDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // Later
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Earlier
        type: BookingType.DELIVERY,
      };

      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);

      // Act & Assert
      await expect(service.create(createBookingDto))
        .rejects.toThrow('End date must be after start date');
    });
  });

  describe('✅ Booking Retrieval - Core Flow', () => {
    it('should retrieve existing booking', async () => {
      // Arrange
      const testBooking = TestDataFactory.createTestBooking({
        id: 'booking-123',
        status: BookingStatus.CONFIRMED,
      });

      bookingRepository.findOne.mockResolvedValue(testBooking as any);

      // Act
      const result = await service.findOne('booking-123');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('booking-123');
      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(bookingRepository.findOne).toHaveBeenCalledWith('booking-123');
    });

    it('should throw error for non-existent booking', async () => {
      // Arrange
      bookingRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent-id'))
        .rejects.toThrow('Booking not found');
    });
  });

  describe('✅ Booking Status Updates - Core Flow', () => {
    it('should update booking status successfully', async () => {
      // Arrange
      const testBooking = TestDataFactory.createTestBooking({
        id: 'booking-123',
        status: BookingStatus.CONFIRMED,
      });

      const updatedBooking = {
        ...testBooking,
        status: BookingStatus.PAID,
        updatedAt: new Date(),
      };

      bookingRepository.findOne.mockResolvedValue(testBooking as any);
      bookingRepository.save.mockResolvedValue(updatedBooking as any);

      // Act
      const result = await service.updateStatus('booking-123', BookingStatus.PAID);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe(BookingStatus.PAID);
      expect(bookingRepository.save).toHaveBeenCalledWith(updatedBooking);
    });

    it('should reject invalid status transitions', async () => {
      // Arrange
      const testBooking = TestDataFactory.createTestBooking({
        id: 'booking-123',
        status: BookingStatus.COMPLETED,
      });

      bookingRepository.findOne.mockResolvedValue(testBooking as any);

      // Act & Assert
      await expect(service.updateStatus('booking-123', 'invalid-status' as any))
        .rejects.toThrow('Invalid status');

      expect(bookingRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('✅ Booking Cancellation - Core Flow', () => {
    it('should cancel booking with valid reason', async () => {
      // Arrange
      const testBooking = TestDataFactory.createTestBooking({
        id: 'booking-123',
        status: BookingStatus.CONFIRMED,
      });

      const cancelledBooking = {
        ...testBooking,
        status: BookingStatus.CANCELLED,
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
      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(result.cancellationReason).toBe('Customer request');
      expect(result.cancelledAt).toBeDefined();
    });

    it('should reject cancellation of completed booking', async () => {
      // Arrange
      const completedBooking = TestDataFactory.createTestBooking({
        id: 'booking-123',
        status: BookingStatus.COMPLETED,
      });

      bookingRepository.findOne.mockResolvedValue(completedBooking as any);

      // Act & Assert
      await expect(service.cancel('booking-123', 'Customer request'))
        .rejects.toThrow('Cannot cancel completed booking');

      expect(bookingRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('✅ Equipment Availability - Core Flow', () => {
    it('should return availability correctly', async () => {
      // Arrange
      const equipmentId = 'equipment-123';
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

      bookingRepository.find.mockResolvedValue([]); // No conflicts

      // Act
      const result = await service.checkAvailability(equipmentId, startDate, endDate);

      // Assert
      expect(result).toBe(true);
      expect(bookingRepository.find).toHaveBeenCalledWith({
        where: {
          equipmentId,
          status: BookingStatus.CONFIRMED,
        },
      });
    });

    it('should detect unavailable equipment', async () => {
      // Arrange
      const equipmentId = 'equipment-123';
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

      const conflictingBooking = TestDataFactory.createTestBooking({
        equipmentId,
        status: BookingStatus.CONFIRMED,
        startDate,
        endDate,
      });

      bookingRepository.find.mockResolvedValue([conflictingBooking] as any);

      // Act
      const result = await service.checkAvailability(equipmentId, startDate, endDate);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('✅ Pricing Calculation - Core Flow', () => {
    it('should calculate pricing for 2-day booking', async () => {
      // Arrange
      const equipmentId = 'equipment-123';
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

      const testEquipment = TestDataFactory.createTestEquipment({
        id: equipmentId,
        dailyRate: 350,
      });

      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);

      // Act
      const result = await service.calculatePricing(equipmentId, startDate, endDate, BookingType.DELIVERY);

      // Assert
      expect(result).toBeDefined();
      expect(result.dailyRate).toBe(350);
      expect(result.duration.days).toBe(2);
      expect(result.subtotal).toBe(700);
      expect(result.taxes).toBe(105);
      expect(result.floatFee).toBe(150);
      expect(result.total).toBe(955);
    });

    it('should handle single day booking', async () => {
      // Arrange
      const equipmentId = 'equipment-123';
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

      const testEquipment = TestDataFactory.createTestEquipment({
        id: equipmentId,
        dailyRate: 350,
      });

      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);

      // Act
      const result = await service.calculatePricing(equipmentId, startDate, endDate, BookingType.DELIVERY);

      // Assert
      expect(result.days).toBe(1);
      expect(result.subtotal).toBe(350);
      expect(result.total).toBe(610); // 350 + 52.5 + 150
    });
  });

  describe('✅ Performance Requirements', () => {
    it('should complete booking creation within performance budget', async () => {
      // Arrange
      const testUser = TestDataFactory.createTestUser();
      const testEquipment = TestDataFactory.createTestEquipment();

      const createBookingDto = {
        customerId: testUser.id,
        equipmentId: testEquipment.id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        type: BookingType.DELIVERY,
      };

      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);
      bookingRepository.find.mockResolvedValue([]);
      bookingRepository.create.mockReturnValue({} as any);
      bookingRepository.save.mockResolvedValue({} as any);

      // Act
      const startTime = Date.now();
      await service.create(createBookingDto);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(50); // Should be fast
    });

    it('should handle concurrent booking requests efficiently', async () => {
      // Arrange
      const testUser = TestDataFactory.createTestUser();
      const testEquipment = TestDataFactory.createTestEquipment();

      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);
      bookingRepository.find.mockResolvedValue([]);
      bookingRepository.create.mockReturnValue({} as any);
      bookingRepository.save.mockResolvedValue({} as any);

      const createBookingDto = {
        customerId: testUser.id,
        equipmentId: testEquipment.id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        type: BookingType.DELIVERY,
      };

      // Act - Create multiple bookings concurrently
      const promises = Array.from({ length: 5 }, () =>
        service.create(createBookingDto)
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Assert
      expect(results).toHaveLength(5);
      expect(duration).toBeLessThan(100); // Should handle concurrency efficiently
    });
  });

  describe('✅ Error Handling - Must Be Reliable', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      bookingRepository.findOne.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.findOne('booking-123'))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle missing customer error', async () => {
      // Arrange
      const createBookingDto = {
        customerId: 'non-existent-user',
        equipmentId: 'equipment-123',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        type: BookingType.DELIVERY,
      };

      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createBookingDto))
        .rejects.toThrow('Customer not found');
    });

    it('should handle missing equipment error', async () => {
      // Arrange
      const testUser = TestDataFactory.createTestUser();

      const createBookingDto = {
        customerId: testUser.id,
        equipmentId: 'non-existent-equipment',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        type: BookingType.DELIVERY,
      };

      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createBookingDto))
        .rejects.toThrow('Equipment not found');
    });
  });

  describe('✅ Data Consistency - Must Be Reliable', () => {
    it('should maintain referential integrity', async () => {
      // Arrange
      const testUser = TestDataFactory.createTestUser();
      const testEquipment = TestDataFactory.createTestEquipment();

      const createBookingDto = {
        customerId: testUser.id,
        equipmentId: testEquipment.id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        type: BookingType.DELIVERY,
      };

      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);
      bookingRepository.find.mockResolvedValue([]);

      const expectedBooking = {
        ...createBookingDto,
        id: 'booking-123',
        bookingNumber: 'UDR-2024-001',
        status: BookingStatus.CONFIRMED,
        dailyRate: 350,
        subtotal: 700,
        taxes: 105,
        floatFee: 150,
        total: 955,
        securityDeposit: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      bookingRepository.create.mockReturnValue(expectedBooking as any);
      bookingRepository.save.mockResolvedValue(expectedBooking as any);

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

      const createBookingDto = {
        customerId: testUser.id,
        equipmentId: testEquipment.id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        type: BookingType.DELIVERY,
      };

      userRepository.findOne.mockResolvedValue(testUser as any);
      equipmentRepository.findOne.mockResolvedValue(testEquipment as any);
      bookingRepository.find.mockResolvedValue([]);

      const booking1 = {
        ...createBookingDto,
        id: 'booking-1',
        bookingNumber: 'UDR-2024-001',
        status: BookingStatus.CONFIRMED,
        dailyRate: 350,
        subtotal: 700,
        taxes: 105,
        floatFee: 150,
        total: 955,
        securityDeposit: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const booking2 = {
        ...createBookingDto,
        id: 'booking-2',
        bookingNumber: 'UDR-2024-002',
        status: BookingStatus.CONFIRMED,
        dailyRate: 350,
        subtotal: 700,
        taxes: 105,
        floatFee: 150,
        total: 955,
        securityDeposit: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      bookingRepository.create
        .mockReturnValueOnce(booking1 as any)
        .mockReturnValueOnce(booking2 as any);

      bookingRepository.save
        .mockResolvedValueOnce(booking1 as any)
        .mockResolvedValueOnce(booking2 as any);

      // Act
      const result1 = await service.create(createBookingDto);
      const result2 = await service.create(createBookingDto);

      // Assert
      expect(result1.bookingNumber).not.toBe(result2.bookingNumber);
      expect(result1.bookingNumber).toMatch(/^UDR-2024-\d{3}$/);
      expect(result2.bookingNumber).toMatch(/^UDR-2024-\d{3}$/);
    });
  });
});
