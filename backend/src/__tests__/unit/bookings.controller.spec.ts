import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { BookingsController } from '../../bookings/bookings.controller';
import { BookingsService } from '../../bookings/bookings.service';
import { Booking } from '../../entities/booking.entity';
import { Equipment } from '../../entities/equipment.entity';
import { User } from '../../entities/user.entity';
import {
    clearDatabase,
    createAuthenticatedRequest,
    createMockRepository,
    createTestApp,
    createTestBooking,
    createTestEquipment,
    createTestUser,
    expectUnauthorizedError,
    expectValidationError
} from '../../test/setup';

describe('BookingsController (e2e)', () => {
  let app: INestApplication;
  let bookingRepository: Repository<Booking>;
  let userRepository: Repository<User>;
  let equipmentRepository: Repository<Equipment>;
  let testUser: User;
  let testEquipment: Equipment;

  beforeAll(async () => {
    // Create test module with mocked dependencies
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: createMockRepository<Booking>(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository<User>(),
        },
        {
          provide: getRepositoryToken(Equipment),
          useValue: createMockRepository<Equipment>(),
        },
      ],
    }).compile();

    app = await createTestApp(moduleFixture);

    // Get repositories for test data setup
    bookingRepository = moduleFixture.get<Repository<Booking>>(getRepositoryToken(Booking));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    equipmentRepository = moduleFixture.get<Repository<Equipment>>(getRepositoryToken(Equipment));

    // Create test data directly since seedTestData might not work with mocked repositories
    testUser = createTestUser() as User;
    testEquipment = createTestEquipment() as Equipment;
  });

  afterAll(async () => {
    await clearDatabase(app);
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /bookings', () => {
    it('should create a new booking successfully', async () => {
      // Mock successful booking creation
      const mockBooking = createTestBooking({
        customerId: testUser.id,
        equipmentId: testEquipment.id,
      });

      jest.spyOn(bookingRepository, 'create').mockReturnValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings')
        .send({
          startDate: '2024-12-15',
          endDate: '2024-12-17',
          equipmentId: testEquipment.id,
          deliveryAddress: '123 Main Street',
          deliveryCity: 'Saint John',
        });

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
    });

    it('should return validation error for invalid dates', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings')
        .send({
          startDate: '2024-12-17', // End before start
          endDate: '2024-12-15',
          equipmentId: testEquipment.id,
          deliveryAddress: '123 Main Street',
          deliveryCity: 'Saint John',
        });

      expectValidationError(response, 'endDate', 'End date must be after start date');
    });

    it('should return validation error for missing required fields', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings')
        .send({
          // Missing required fields
          startDate: '2024-12-15',
        });

      expectValidationError(response, 'endDate');
      expectValidationError(response, 'equipmentId');
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          startDate: '2024-12-15',
          endDate: '2024-12-17',
          equipmentId: testEquipment.id,
        });

      expectUnauthorizedError(response);
    });

    it('should handle equipment unavailability', async () => {
      // Mock equipment not available
      jest.spyOn(bookingRepository, 'find').mockResolvedValue([
        createTestBooking({ equipmentId: testEquipment.id }) as any
      ]);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings')
        .send({
          startDate: '2024-12-15',
          endDate: '2024-12-17',
          equipmentId: testEquipment.id,
          deliveryAddress: '123 Main Street',
          deliveryCity: 'Saint John',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Equipment not available');
    });
  });

  describe('GET /bookings', () => {
    it('should return paginated bookings for authenticated user', async () => {
      const mockBookings = [
        createTestBooking({ customerId: testUser.id }),
        createTestBooking({ customerId: testUser.id }),
      ];

      jest.spyOn(bookingRepository, 'find').mockResolvedValue(mockBookings as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.page).toBe(1);
    });

    it('should filter bookings by status', async () => {
      const mockBookings = [createTestBooking({ status: 'confirmed' })];

      jest.spyOn(bookingRepository, 'find').mockResolvedValue(mockBookings as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings')
        .query({ status: 'confirmed' });

      expect(response.status).toBe(200);
      expect(bookingRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'confirmed' }),
        })
      );
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/bookings');

      expectUnauthorizedError(response);
    });
  });

  describe('GET /bookings/:id', () => {
    it('should return specific booking for authenticated user', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('test-booking-123');
      expect(response.body.bookingNumber).toBe('UDR-2024-001');
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id');

      expect(response.status).toBe(404);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/test-booking-123');

      expectUnauthorizedError(response);
    });
  });

  describe('PUT /bookings/:id', () => {
    it('should update booking successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        deliveryAddress: '456 Updated Street',
      } as any);

      const response = await createAuthenticatedRequest(app)
        .put('/bookings/test-booking-123')
        .send({
          deliveryAddress: '456 Updated Street',
        });

      expect(response.status).toBe(200);
      expect(response.body.deliveryAddress).toBe('456 Updated Street');
    });

    it('should return validation error for invalid update data', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/test-booking-123')
        .send({
          startDate: 'invalid-date',
        });

      expectValidationError(response, 'startDate');
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .put('/bookings/test-booking-123')
        .send({ deliveryAddress: '456 Updated Street' });

      expectUnauthorizedError(response);
    });
  });

  describe('DELETE /bookings/:id', () => {
    it('should cancel booking successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'confirmed',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        status: 'cancelled',
        cancelledAt: new Date(),
      } as any);

      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('cancelled');
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/non-existent-id');

      expect(response.status).toBe(404);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .delete('/bookings/test-booking-123');

      expectUnauthorizedError(response);
    });
  });

  describe('GET /bookings/:id/contract', () => {
    it('should return booking contract', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      const mockContract = {
        id: 'test-contract-123',
        bookingId: 'test-booking-123',
        status: 'signed',
        documentUrl: 'https://example.com/contract.pdf',
      };

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/contract');

      expect(response.status).toBe(200);
      expect(response.body.contract).toBeDefined();
    });

    it('should return not found when contract does not exist', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/contract');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/payment', () => {
    it('should process payment successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/payment')
        .send({
          amount: 500,
          paymentMethodId: 'pm_test_123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return validation error for invalid payment data', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/payment')
        .send({
          amount: -100, // Invalid amount
        });

      expectValidationError(response, 'amount');
    });
  });

  describe('GET /bookings/availability', () => {
    it('should return equipment availability', async () => {
      const mockAvailability = {
        '2024-12-15': false,
        '2024-12-16': true,
        '2024-12-17': false,
      };

      const response = await request(app.getHttpServer())
        .get('/bookings/availability')
        .query({
          equipmentId: testEquipment.id,
          startDate: '2024-12-15',
          endDate: '2024-12-17',
        });

      expect(response.status).toBe(200);
      expect(response.body.availability).toBeDefined();
    });

    it('should return validation error for missing query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/availability');

      expectValidationError(response, 'equipmentId');
    });
  });

  describe('POST /bookings/:id/cancel', () => {
    it('should cancel booking with valid reason', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'confirmed',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: 'Customer request',
      } as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/cancel')
        .send({
          reason: 'Customer request',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('cancelled');
      expect(response.body.cancellationReason).toBe('Customer request');
    });

    it('should return validation error for missing cancellation reason', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/cancel')
        .send({});

      expectValidationError(response, 'reason');
    });

    it('should return error for already cancelled booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'cancelled',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/cancel')
        .send({
          reason: 'Customer request',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot cancel');
    });
  });

  describe('GET /bookings/:id/invoice', () => {
    it('should generate booking invoice', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/invoice');

      expect(response.status).toBe(200);
      expect(response.body.invoiceUrl).toBeDefined();
      expect(response.body.invoiceNumber).toBeDefined();
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/invoice');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/extend', () => {
    it('should extend booking successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        endDate: new Date('2024-12-17'),
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        endDate: new Date('2024-12-20'),
        total: 1400, // Extended amount
      } as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/extend')
        .send({
          newEndDate: '2024-12-20',
        });

      expect(response.status).toBe(200);
      expect(response.body.endDate).toBe('2024-12-20');
      expect(response.body.total).toBe(1400);
    });

    it('should return validation error for invalid extension date', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/extend')
        .send({
          newEndDate: '2024-12-15', // Earlier than current end date
        });

      expectValidationError(response, 'newEndDate');
    });
  });

  describe('GET /bookings/stats', () => {
    it('should return booking statistics for authenticated user', async () => {
      const mockStats = {
        totalBookings: 5,
        activeBookings: 2,
        completedBookings: 3,
        totalSpent: 2500,
        averageRentalDuration: 3.5,
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/stats');

      expect(response.status).toBe(200);
      expect(response.body.stats).toBeDefined();
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/bookings/stats');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/:id/insurance', () => {
    it('should upload insurance document successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/insurance')
        .attach('document', Buffer.from('test document content'), 'insurance.pdf');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.documentId).toBeDefined();
    });

    it('should return validation error for invalid file type', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/insurance')
        .attach('document', Buffer.from('test content'), 'document.txt');

      expectValidationError(response, 'document');
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/bookings/test-booking-123/insurance')
        .attach('document', Buffer.from('test content'), 'insurance.pdf');

      expectUnauthorizedError(response);
    });
  });

  describe('GET /bookings/:id/documents', () => {
    it('should return booking documents', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/documents');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.documents)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/documents');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /bookings/:id/notes', () => {
    it('should update booking notes successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        internalNotes: 'Updated notes',
      } as any);

      const response = await createAuthenticatedRequest(app)
        .put('/bookings/test-booking-123/notes')
        .send({
          notes: 'Updated notes',
        });

      expect(response.status).toBe(200);
      expect(response.body.internalNotes).toBe('Updated notes');
    });

    it('should return validation error for empty notes', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/test-booking-123/notes')
        .send({
          notes: '',
        });

      expectValidationError(response, 'notes');
    });
  });

  describe('GET /bookings/upcoming', () => {
    it('should return upcoming bookings', async () => {
      const mockBookings = [
        createTestBooking({
          startDate: new Date(Date.now() + 86400000), // Tomorrow
          status: 'confirmed',
        }),
      ];

      jest.spyOn(bookingRepository, 'find').mockResolvedValue(mockBookings as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/upcoming');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.bookings)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/bookings/upcoming');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/bulk-availability', () => {
    it('should check availability for multiple date ranges', async () => {
      const response = await request(app.getHttpServer())
        .post('/bookings/bulk-availability')
        .send({
          equipmentId: testEquipment.id,
          dateRanges: [
            { startDate: '2024-12-15', endDate: '2024-12-17' },
            { startDate: '2024-12-20', endDate: '2024-12-22' },
          ],
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.availability)).toBe(true);
    });

    it('should return validation error for invalid date ranges', async () => {
      const response = await request(app.getHttpServer())
        .post('/bookings/bulk-availability')
        .send({
          equipmentId: testEquipment.id,
          dateRanges: [
            { startDate: '2024-12-17', endDate: '2024-12-15' }, // Invalid range
          ],
        });

      expectValidationError(response, 'dateRanges');
    });
  });

  describe('GET /bookings/calendar', () => {
    it('should return calendar view of bookings', async () => {
      const mockBookings = [createTestBooking()];

      jest.spyOn(bookingRepository, 'find').mockResolvedValue(mockBookings as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/calendar')
        .query({
          year: 2024,
          month: 12,
        });

      expect(response.status).toBe(200);
      expect(response.body.calendar).toBeDefined();
      expect(response.body.bookings).toBeDefined();
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/calendar');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/:id/remind', () => {
    it('should send booking reminder successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/remind');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Reminder sent');
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/non-existent-id/remind');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/export', () => {
    it('should export bookings data', async () => {
      const mockBookings = [createTestBooking()];

      jest.spyOn(bookingRepository, 'find').mockResolvedValue(mockBookings as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/export')
        .query({
          format: 'csv',
          startDate: '2024-12-01',
          endDate: '2024-12-31',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should return validation error for invalid export format', async () => {
      const response = await createAuthenticatedRequest(app)
        .get('/bookings/export')
        .query({
          format: 'invalid',
        });

      expectValidationError(response, 'format');
    });
  });

  describe('PUT /bookings/:id/status', () => {
    it('should update booking status successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'confirmed',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        status: 'paid',
      } as any);

      const response = await createAuthenticatedRequest(app)
        .put('/bookings/test-booking-123/status')
        .send({
          status: 'paid',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('paid');
    });

    it('should return validation error for invalid status', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/test-booking-123/status')
        .send({
          status: 'invalid-status',
        });

      expectValidationError(response, 'status');
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .put('/bookings/test-booking-123/status')
        .send({ status: 'paid' });

      expectUnauthorizedError(response);
    });
  });

  describe('GET /bookings/search', () => {
    it('should search bookings by criteria', async () => {
      const mockBookings = [createTestBooking()];

      jest.spyOn(bookingRepository, 'find').mockResolvedValue(mockBookings as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/search')
        .query({
          query: 'UDR-2024',
          status: 'confirmed',
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.bookings)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/search')
        .query({ query: 'test' });

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/:id/feedback', () => {
    it('should submit booking feedback successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/feedback')
        .send({
          rating: 5,
          comment: 'Excellent service and equipment quality!',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return validation error for invalid rating', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/feedback')
        .send({
          rating: 6, // Invalid rating (should be 1-5)
          comment: 'Good service',
        });

      expectValidationError(response, 'rating');
    });
  });

  describe('GET /bookings/:id/timeline', () => {
    it('should return booking timeline events', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/timeline');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.events)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/timeline');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/calculate-price', () => {
    it('should calculate booking price correctly', async () => {
      const response = await request(app.getHttpServer())
        .post('/bookings/calculate-price')
        .send({
          startDate: '2024-12-15',
          endDate: '2024-12-17',
          equipmentId: testEquipment.id,
          deliveryCity: 'Saint John',
        });

      expect(response.status).toBe(200);
      expect(response.body.pricing).toBeDefined();
      expect(response.body.pricing.dailyRate).toBe(350);
      expect(response.body.pricing.days).toBe(2);
      expect(response.body.pricing.subtotal).toBe(700);
      expect(response.body.pricing.taxes).toBe(105);
      expect(response.body.pricing.floatFee).toBe(150);
      expect(response.body.pricing.total).toBe(955);
    });

    it('should return validation error for invalid calculation data', async () => {
      const response = await request(app.getHttpServer())
        .post('/bookings/calculate-price')
        .send({
          startDate: '2024-12-17',
          endDate: '2024-12-15', // Invalid range
        });

      expectValidationError(response, 'endDate');
    });
  });

  describe('GET /bookings/recent', () => {
    it('should return recent bookings', async () => {
      const mockBookings = [
        createTestBooking({ createdAt: new Date() }),
        createTestBooking({ createdAt: new Date(Date.now() - 86400000) }),
      ];

      jest.spyOn(bookingRepository, 'find').mockResolvedValue(mockBookings as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/recent')
        .query({ limit: 5 });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.bookings)).toBe(true);
      expect(response.body.bookings.length).toBeLessThanOrEqual(5);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/bookings/recent');

      expectUnauthorizedError(response);
    });
  });

  describe('PUT /bookings/:id/delivery-info', () => {
    it('should update delivery information successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        deliveryAddress: '456 Updated Street',
        deliveryCity: 'Rothesay',
      } as any);

      const response = await createAuthenticatedRequest(app)
        .put('/bookings/test-booking-123/delivery-info')
        .send({
          deliveryAddress: '456 Updated Street',
          deliveryCity: 'Rothesay',
        });

      expect(response.status).toBe(200);
      expect(response.body.deliveryAddress).toBe('456 Updated Street');
      expect(response.body.deliveryCity).toBe('Rothesay');
    });

    it('should return validation error for invalid delivery info', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/test-booking-123/delivery-info')
        .send({
          deliveryAddress: '', // Empty address
        });

      expectValidationError(response, 'deliveryAddress');
    });
  });

  describe('GET /bookings/:id/payments', () => {
    it('should return booking payments', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      const mockPayments = [
        {
          id: 'test-payment-123',
          amount: 500,
          status: 'completed',
          createdAt: new Date(),
        },
      ];

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/payments');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.payments)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/payments');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/dispute', () => {
    it('should create payment dispute successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/dispute')
        .send({
          reason: 'Equipment was not as described',
          description: 'The equipment had mechanical issues',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.disputeId).toBeDefined();
    });

    it('should return validation error for missing dispute reason', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/dispute')
        .send({
          description: 'Equipment had issues',
        });

      expectValidationError(response, 'reason');
    });
  });

  describe('GET /bookings/dashboard', () => {
    it('should return dashboard data for authenticated user', async () => {
      const mockStats = {
        upcomingBookings: 2,
        activeBookings: 1,
        totalSpent: 1500,
        favoriteEquipment: 'Kubota SVL-75',
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.dashboard).toBeDefined();
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/bookings/dashboard');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/:id/check-in', () => {
    it('should check in equipment successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'delivered',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        status: 'in_progress',
        actualStartDate: new Date(),
      } as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/check-in')
        .send({
          engineHours: 100,
          notes: 'Equipment received in good condition',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('in_progress');
      expect(response.body.actualStartDate).toBeDefined();
    });

    it('should return validation error for invalid check-in data', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/check-in')
        .send({
          engineHours: -10, // Invalid hours
        });

      expectValidationError(response, 'engineHours');
    });
  });

  describe('POST /bookings/:id/check-out', () => {
    it('should check out equipment successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'in_progress',
        startEngineHours: 100,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        status: 'completed',
        actualEndDate: new Date(),
        endEngineHours: 150,
        overageHours: 2,
      } as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/check-out')
        .send({
          engineHours: 150,
          condition: 'Good condition, minor wear',
          notes: 'Equipment returned on time',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');
      expect(response.body.endEngineHours).toBe(150);
      expect(response.body.overageHours).toBe(2);
    });

    it('should return validation error for invalid check-out data', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/check-out')
        .send({
          engineHours: 50, // Less than start hours
        });

      expectValidationError(response, 'engineHours');
    });
  });

  describe('GET /bookings/reports/summary', () => {
    it('should return booking summary report', async () => {
      const mockReport = {
        totalBookings: 25,
        totalRevenue: 15000,
        averageRentalDuration: 3.2,
        mostPopularEquipment: 'Kubota SVL-75',
        occupancyRate: 78.5,
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/reports/summary')
        .query({
          startDate: '2024-12-01',
          endDate: '2024-12-31',
        });

      expect(response.status).toBe(200);
      expect(response.body.report).toBeDefined();
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/reports/summary');

      expectUnauthorizedError(response);
    });
  });

  describe('GET /bookings/reports/revenue', () => {
    it('should return revenue report', async () => {
      const mockRevenueData = [
        { date: '2024-12-15', revenue: 350, bookings: 1 },
        { date: '2024-12-16', revenue: 700, bookings: 2 },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/reports/revenue')
        .query({
          startDate: '2024-12-01',
          endDate: '2024-12-31',
          groupBy: 'day',
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.revenue)).toBe(true);
    });

    it('should return validation error for invalid report parameters', async () => {
      const response = await createAuthenticatedRequest(app)
        .get('/bookings/reports/revenue')
        .query({
          groupBy: 'invalid',
        });

      expectValidationError(response, 'groupBy');
    });
  });

  describe('POST /bookings/:id/maintenance', () => {
    it('should report maintenance issue successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'in_progress',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/maintenance')
        .send({
          issue: 'Engine making unusual noise',
          severity: 'medium',
          contactPreference: 'phone',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.maintenanceRequestId).toBeDefined();
    });

    it('should return validation error for missing maintenance issue', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/maintenance')
        .send({
          severity: 'high',
        });

      expectValidationError(response, 'issue');
    });
  });

  describe('GET /bookings/:id/maintenance-history', () => {
    it('should return maintenance history for booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/maintenance-history');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.maintenance)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/maintenance-history');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/bulk-cancel', () => {
    it('should cancel multiple bookings successfully', async () => {
      const mockBookings = [
        createTestBooking({ id: 'booking-1', customerId: testUser.id }),
        createTestBooking({ id: 'booking-2', customerId: testUser.id }),
      ];

      jest.spyOn(bookingRepository, 'findBy').mockResolvedValue(mockBookings as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue(mockBookings as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/bulk-cancel')
        .send({
          bookingIds: ['booking-1', 'booking-2'],
          reason: 'Weather conditions',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cancelledCount).toBe(2);
    });

    it('should return validation error for invalid booking IDs', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/bulk-cancel')
        .send({
          bookingIds: [],
          reason: 'Test cancellation',
        });

      expectValidationError(response, 'bookingIds');
    });
  });

  describe('GET /bookings/notifications', () => {
    it('should return booking notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'reminder',
          message: 'Your booking starts tomorrow',
          bookingId: 'test-booking-123',
          read: false,
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/notifications');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.notifications)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/notifications');

      expectUnauthorizedError(response);
    });
  });

  describe('PUT /bookings/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/notifications/notif-123/read');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent notification', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/notifications/non-existent-id/read');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/equipment/:id/availability', () => {
    it('should return equipment availability calendar', async () => {
      const response = await request(app.getHttpServer())
        .get(`/bookings/equipment/${testEquipment.id}/availability`)
        .query({
          year: 2024,
          month: 12,
        });

      expect(response.status).toBe(200);
      expect(response.body.calendar).toBeDefined();
      expect(response.body.availability).toBeDefined();
    });

    it('should return validation error for invalid equipment ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/equipment/invalid-id/availability');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /bookings/webhook/stripe', () => {
    it('should handle Stripe webhook successfully', async () => {
      const stripeEvent = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            metadata: {
              bookingId: 'test-booking-123',
            },
          },
        },
      };

      const response = await request(app.getHttpServer())
        .post('/bookings/webhook/stripe')
        .set('Stripe-Signature', 'test_signature')
        .send(stripeEvent);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should return error for invalid webhook signature', async () => {
      const response = await request(app.getHttpServer())
        .post('/bookings/webhook/stripe')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid signature');
    });
  });

  describe('GET /bookings/health', () => {
    it('should return booking system health status', async () => {
      const response = await request(app.getHttpServer()).get('/bookings/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toBeDefined();
    });
  });

  describe('POST /bookings/:id/emergency-contact', () => {
    it('should update emergency contact information', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        emergencyContact: {
          name: 'Jane Doe',
          phone: '555-9876',
          relationship: 'Spouse',
        },
      } as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/emergency-contact')
        .send({
          name: 'Jane Doe',
          phone: '555-9876',
          relationship: 'Spouse',
        });

      expect(response.status).toBe(200);
      expect(response.body.emergencyContact).toBeDefined();
      expect(response.body.emergencyContact.name).toBe('Jane Doe');
    });

    it('should return validation error for invalid emergency contact', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/emergency-contact')
        .send({
          name: '',
          phone: 'invalid-phone',
        });

      expectValidationError(response, 'name');
      expectValidationError(response, 'phone');
    });
  });

  describe('GET /bookings/:id/emergency-info', () => {
    it('should return emergency information for active booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'in_progress',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/emergency-info');

      expect(response.status).toBe(200);
      expect(response.body.emergencyContact).toBeDefined();
      expect(response.body.equipment).toBeDefined();
      expect(response.body.booking).toBeDefined();
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/emergency-info');

      expect(response.status).toBe(404);
    });

    it('should return forbidden for non-active booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'completed',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/emergency-info');

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('not active');
    });
  });

  describe('POST /bookings/:id/location-update', () => {
    it('should update equipment location successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'in_progress',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        equipmentLocation: {
          address: '456 Work Site Road',
          city: 'Saint John',
          coordinates: { lat: 45.2733, lng: -66.0630 },
        },
      } as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/location-update')
        .send({
          address: '456 Work Site Road',
          city: 'Saint John',
          coordinates: { lat: 45.2733, lng: -66.0630 },
        });

      expect(response.status).toBe(200);
      expect(response.body.equipmentLocation).toBeDefined();
    });

    it('should return validation error for invalid location data', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/location-update')
        .send({
          address: '',
          coordinates: { lat: 'invalid', lng: 'invalid' },
        });

      expectValidationError(response, 'address');
      expectValidationError(response, 'coordinates');
    });
  });

  describe('GET /bookings/:id/location', () => {
    it('should return current equipment location', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'in_progress',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/location');

      expect(response.status).toBe(200);
      expect(response.body.location).toBeDefined();
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/location');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/incident-report', () => {
    it('should create incident report successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'in_progress',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/incident-report')
        .send({
          incidentType: 'equipment_malfunction',
          description: 'Engine stalled during operation',
          severity: 'medium',
          location: 'Work site',
          witnesses: ['John Smith'],
          immediateActions: 'Shut down equipment and contacted support',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.incidentId).toBeDefined();
    });

    it('should return validation error for missing incident details', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/incident-report')
        .send({
          incidentType: 'equipment_malfunction',
          // Missing description
        });

      expectValidationError(response, 'description');
    });
  });

  describe('GET /bookings/:id/incident-history', () => {
    it('should return incident history for booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/incident-history');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.incidents)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/incident-history');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/fuel-report', () => {
    it('should submit fuel report successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'in_progress',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/fuel-report')
        .send({
          fuelLevel: 75,
          fuelAdded: 25,
          fuelCost: 45.50,
          location: 'Local gas station',
          notes: 'Filled up before returning equipment',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return validation error for invalid fuel data', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/fuel-report')
        .send({
          fuelLevel: 150, // Invalid percentage
        });

      expectValidationError(response, 'fuelLevel');
    });
  });

  describe('GET /bookings/:id/fuel-history', () => {
    it('should return fuel usage history', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/fuel-history');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.fuelReports)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/fuel-history');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/hour-update', () => {
    it('should update equipment hours successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'in_progress',
        startEngineHours: 100,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        currentEngineHours: 125,
      } as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/hour-update')
        .send({
          engineHours: 125,
          notes: 'Equipment running smoothly',
        });

      expect(response.status).toBe(200);
      expect(response.body.currentEngineHours).toBe(125);
    });

    it('should return validation error for invalid hour data', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/hour-update')
        .send({
          engineHours: 50, // Less than start hours
        });

      expectValidationError(response, 'engineHours');
    });
  });

  describe('GET /bookings/:id/hour-history', () => {
    it('should return equipment hour history', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/hour-history');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.hourUpdates)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/hour-history');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/attachment', () => {
    it('should upload attachment successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/attachment')
        .attach('file', Buffer.from('test file content'), 'document.pdf');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.attachmentId).toBeDefined();
    });

    it('should return validation error for invalid file type', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/attachment')
        .attach('file', Buffer.from('test content'), 'malware.exe');

      expectValidationError(response, 'file');
    });
  });

  describe('GET /bookings/:id/attachments', () => {
    it('should return booking attachments', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/attachments');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.attachments)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/attachments');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /bookings/:id/attachments/:attachmentId', () => {
    it('should delete attachment successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123/attachments/attachment-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent attachment', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123/attachments/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/:id/communications', () => {
    it('should return booking communications', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/communications');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.communications)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/communications');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/communication', () => {
    it('should add communication to booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/communication')
        .send({
          type: 'note',
          message: 'Customer called about delivery time',
          priority: 'normal',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.communicationId).toBeDefined();
    });

    it('should return validation error for missing communication message', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/communication')
        .send({
          type: 'note',
          // Missing message
        });

      expectValidationError(response, 'message');
    });
  });

  describe('GET /bookings/:id/audit-trail', () => {
    it('should return booking audit trail', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/audit-trail');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.auditTrail)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/audit-trail');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/flag', () => {
    it('should flag booking for attention', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/flag')
        .send({
          reason: 'Payment overdue',
          priority: 'high',
          notes: 'Customer has not paid deposit',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.flagId).toBeDefined();
    });

    it('should return validation error for missing flag reason', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/flag')
        .send({
          priority: 'high',
        });

      expectValidationError(response, 'reason');
    });
  });

  describe('DELETE /bookings/:id/flag/:flagId', () => {
    it('should remove flag from booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123/flag/flag-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent flag', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123/flag/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/flags', () => {
    it('should return all flagged bookings', async () => {
      const mockFlaggedBookings = [
        createTestBooking({ id: 'booking-1' }),
        createTestBooking({ id: 'booking-2' }),
      ];

      jest.spyOn(bookingRepository, 'find').mockResolvedValue(mockFlaggedBookings as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/flags');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.flags)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/bookings/flags');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/:id/escalate', () => {
    it('should escalate booking issue', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/escalate')
        .send({
          reason: 'Customer reporting equipment malfunction',
          urgency: 'high',
          details: 'Equipment became inoperable during use',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.escalationId).toBeDefined();
    });

    it('should return validation error for missing escalation details', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/escalate')
        .send({
          urgency: 'high',
        });

      expectValidationError(response, 'reason');
    });
  });

  describe('GET /bookings/escalations', () => {
    it('should return escalated bookings', async () => {
      const mockEscalations = [
        {
          id: 'escalation-1',
          bookingId: 'test-booking-123',
          reason: 'Equipment malfunction',
          status: 'open',
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/escalations');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.escalations)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/escalations');

      expectUnauthorizedError(response);
    });
  });

  describe('PUT /bookings/escalations/:id/resolve', () => {
    it('should resolve escalation successfully', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/escalations/escalation-123/resolve')
        .send({
          resolution: 'Replaced faulty equipment',
          resolutionDetails: 'Provided backup equipment and compensated customer',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return validation error for missing resolution', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/escalations/escalation-123/resolve')
        .send({
          resolutionDetails: 'Fixed the issue',
        });

      expectValidationError(response, 'resolution');
    });
  });

  describe('GET /bookings/reports/utilization', () => {
    it('should return equipment utilization report', async () => {
      const mockUtilization = {
        equipmentId: testEquipment.id,
        utilizationRate: 78.5,
        totalBookings: 15,
        totalRevenue: 8500,
        averageRentalDuration: 3.2,
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/reports/utilization')
        .query({
          startDate: '2024-12-01',
          endDate: '2024-12-31',
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.utilization)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/reports/utilization');

      expectUnauthorizedError(response);
    });
  });

  describe('GET /bookings/reports/customer-satisfaction', () => {
    it('should return customer satisfaction report', async () => {
      const mockSatisfaction = {
        averageRating: 4.2,
        totalFeedback: 25,
        satisfactionTrend: 'improving',
        commonIssues: ['Delivery time', 'Equipment condition'],
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/reports/customer-satisfaction')
        .query({
          startDate: '2024-12-01',
          endDate: '2024-12-31',
        });

      expect(response.status).toBe(200);
      expect(response.body.satisfaction).toBeDefined();
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/reports/customer-satisfaction');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/:id/rating', () => {
    it('should submit booking rating successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'completed',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/rating')
        .send({
          rating: 5,
          categoryRatings: {
            equipment: 5,
            delivery: 4,
            support: 5,
            value: 4,
          },
          review: 'Excellent equipment and service!',
          recommend: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return validation error for invalid rating', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/rating')
        .send({
          rating: 6, // Invalid rating
        });

      expectValidationError(response, 'rating');
    });

    it('should return error for non-completed booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'confirmed',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/rating')
        .send({
          rating: 5,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('not completed');
    });
  });

  describe('GET /bookings/:id/rating', () => {
    it('should return booking rating', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/rating');

      expect(response.status).toBe(200);
      expect(response.body.rating).toBeDefined();
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/rating');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/ratings', () => {
    it('should return all ratings for user', async () => {
      const mockRatings = [
        { id: 'rating-1', bookingId: 'test-booking-123', rating: 5 },
        { id: 'rating-2', bookingId: 'test-booking-456', rating: 4 },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/ratings');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.ratings)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/bookings/ratings');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/:id/share', () => {
    it('should generate shareable booking link', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/share')
        .send({
          recipientEmail: 'partner@example.com',
          message: 'Check out this booking details',
        });

      expect(response.status).toBe(200);
      expect(response.body.shareUrl).toBeDefined();
      expect(response.body.shareToken).toBeDefined();
    });

    it('should return validation error for invalid recipient email', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/share')
        .send({
          recipientEmail: 'invalid-email',
        });

      expectValidationError(response, 'recipientEmail');
    });
  });

  describe('GET /bookings/shared/:token', () => {
    it('should return shared booking details', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await request(app.getHttpServer())
        .get('/bookings/shared/shared-token-123');

      expect(response.status).toBe(200);
      expect(response.body.booking).toBeDefined();
      expect(response.body.shareable).toBe(true);
    });

    it('should return not found for invalid share token', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/bookings/shared/invalid-token');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/duplicate', () => {
    it('should duplicate booking successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'create').mockReturnValue({
        ...mockBooking,
        id: 'new-booking-123',
        bookingNumber: 'UDR-2024-002',
      } as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        id: 'new-booking-123',
        bookingNumber: 'UDR-2024-002',
      } as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/duplicate')
        .send({
          newStartDate: '2024-12-25',
          newEndDate: '2024-12-27',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.newBookingId).toBe('new-booking-123');
    });

    it('should return validation error for invalid duplicate dates', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/duplicate')
        .send({
          newStartDate: '2024-12-27',
          newEndDate: '2024-12-25', // Invalid range
        });

      expectValidationError(response, 'newEndDate');
    });
  });

  describe('GET /bookings/:id/related', () => {
    it('should return related bookings for customer', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      const mockRelatedBookings = [
        createTestBooking({ id: 'related-1', customerId: testUser.id }),
        createTestBooking({ id: 'related-2', customerId: testUser.id }),
      ];

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'find').mockResolvedValue(mockRelatedBookings as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/related');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.relatedBookings)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/related');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/merge', () => {
    it('should merge bookings successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/merge')
        .send({
          targetBookingId: 'target-booking-123',
          mergeStrategy: 'combine_dates',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return validation error for invalid merge data', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/merge')
        .send({
          targetBookingId: '',
        });

      expectValidationError(response, 'targetBookingId');
    });
  });

  describe('GET /bookings/:id/analytics', () => {
    it('should return booking analytics', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/analytics');

      expect(response.status).toBe(200);
      expect(response.body.analytics).toBeDefined();
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/analytics');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/archive', () => {
    it('should archive booking successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'completed',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        status: 'archived',
      } as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/archive');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('archived');
    });

    it('should return error for non-completed booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'confirmed',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/archive');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('cannot be archived');
    });
  });

  describe('GET /bookings/archived', () => {
    it('should return archived bookings', async () => {
      const mockArchivedBookings = [
        createTestBooking({ id: 'archived-1', status: 'archived' }),
        createTestBooking({ id: 'archived-2', status: 'archived' }),
      ];

      jest.spyOn(bookingRepository, 'find').mockResolvedValue(mockArchivedBookings as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/archived')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.bookings)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/bookings/archived');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/:id/unarchive', () => {
    it('should unarchive booking successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'archived',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        status: 'completed',
      } as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/unarchive');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');
    });

    it('should return error for non-archived booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        status: 'confirmed',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/unarchive');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('not archived');
    });
  });

  describe('GET /bookings/:id/export', () => {
    it('should export booking details', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/export')
        .query({ format: 'pdf' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
    });

    it('should return validation error for invalid export format', async () => {
      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/export')
        .query({ format: 'invalid' });

      expectValidationError(response, 'format');
    });
  });

  describe('POST /bookings/:id/tags', () => {
    it('should add tags to booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        tags: ['priority', 'vip'],
      } as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/tags')
        .send({
          tags: ['priority', 'vip'],
        });

      expect(response.status).toBe(200);
      expect(response.body.tags).toContain('priority');
      expect(response.body.tags).toContain('vip');
    });

    it('should return validation error for invalid tags', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/tags')
        .send({
          tags: ['valid-tag', 'a'.repeat(51)], // Too long
        });

      expectValidationError(response, 'tags');
    });
  });

  describe('DELETE /bookings/:id/tags/:tag', () => {
    it('should remove tag from booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        tags: ['priority', 'vip'],
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        tags: ['priority'], // VIP tag removed
      } as any);

      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123/tags/vip');

      expect(response.status).toBe(200);
      expect(response.body.tags).not.toContain('vip');
      expect(response.body.tags).toContain('priority');
    });

    it('should return not found for non-existent tag', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123/tags/non-existent-tag');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/tags/:tag', () => {
    it('should return bookings with specific tag', async () => {
      const mockTaggedBookings = [
        createTestBooking({ id: 'booking-1', tags: ['priority'] }),
        createTestBooking({ id: 'booking-2', tags: ['priority'] }),
      ];

      jest.spyOn(bookingRepository, 'find').mockResolvedValue(mockTaggedBookings as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/tags/priority');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.bookings)).toBe(true);
      expect(response.body.bookings).toHaveLength(2);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/tags/priority');

      expectUnauthorizedError(response);
    });
  });

  describe('GET /bookings/tags', () => {
    it('should return all available tags', async () => {
      const mockTags = [
        { tag: 'priority', count: 5 },
        { tag: 'vip', count: 3 },
        { tag: 'problematic', count: 1 },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/tags');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.tags)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/bookings/tags');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/:id/priority', () => {
    it('should set booking priority successfully', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        priority: 'high',
      } as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/priority')
        .send({
          priority: 'high',
          reason: 'VIP customer',
        });

      expect(response.status).toBe(200);
      expect(response.body.priority).toBe('high');
    });

    it('should return validation error for invalid priority', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/priority')
        .send({
          priority: 'invalid-priority',
        });

      expectValidationError(response, 'priority');
    });
  });

  describe('GET /bookings/priority', () => {
    it('should return priority bookings', async () => {
      const mockPriorityBookings = [
        createTestBooking({ id: 'priority-1', priority: 'high' }),
        createTestBooking({ id: 'priority-2', priority: 'medium' }),
      ];

      jest.spyOn(bookingRepository, 'find').mockResolvedValue(mockPriorityBookings as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/priority')
        .query({ level: 'high' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.bookings)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/bookings/priority');

      expectUnauthorizedError(response);
    });
  });

  describe('DELETE /bookings/:id/priority', () => {
    it('should remove booking priority', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        priority: 'high',
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        priority: null,
      } as any);

      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123/priority');

      expect(response.status).toBe(200);
      expect(response.body.priority).toBeNull();
    });

    it('should return not found for booking without priority', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        priority: null,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123/priority');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/:id/activity', () => {
    it('should return booking activity log', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/activity');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.activities)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/activity');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/activity', () => {
    it('should add activity to booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/activity')
        .send({
          type: 'note',
          description: 'Customer called about delivery',
          metadata: {
            source: 'phone',
            priority: 'normal',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.activityId).toBeDefined();
    });

    it('should return validation error for missing activity description', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/activity')
        .send({
          type: 'note',
        });

      expectValidationError(response, 'description');
    });
  });

  describe('GET /bookings/activity', () => {
    it('should return recent booking activities', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          bookingId: 'test-booking-123',
          type: 'status_change',
          description: 'Status changed to confirmed',
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/activity')
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.activities)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/bookings/activity');

      expectUnauthorizedError(response);
    });
  });

  describe('GET /bookings/:id/insights', () => {
    it('should return booking insights and recommendations', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/insights');

      expect(response.status).toBe(200);
      expect(response.body.insights).toBeDefined();
      expect(response.body.recommendations).toBeDefined();
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/insights');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/insights/feedback', () => {
    it('should submit feedback on insights', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/insights/feedback')
        .send({
          insightId: 'insight-123',
          feedback: 'helpful',
          comment: 'This insight helped me understand the pricing',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return validation error for invalid feedback', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/insights/feedback')
        .send({
          insightId: 'insight-123',
          feedback: 'invalid-feedback',
        });

      expectValidationError(response, 'feedback');
    });
  });

  describe('GET /bookings/insights', () => {
    it('should return insights for all user bookings', async () => {
      const mockInsights = [
        {
          bookingId: 'test-booking-123',
          type: 'pricing',
          message: 'You could save money with longer rental',
          confidence: 0.85,
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/insights');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.insights)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/bookings/insights');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/:id/recommendations', () => {
    it('should generate booking recommendations', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/recommendations');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/non-existent-id/recommendations');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/recommendations', () => {
    it('should return personalized recommendations', async () => {
      const mockRecommendations = [
        {
          type: 'equipment',
          title: 'Consider SVL75-2 for longer rentals',
          description: 'Better rates for extended periods',
          confidence: 0.9,
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/recommendations');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/recommendations');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/:id/recommendations/feedback', () => {
    it('should submit feedback on recommendation', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/recommendations/feedback')
        .send({
          recommendationId: 'rec-123',
          feedback: 'followed',
          outcome: 'saved money',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return validation error for invalid recommendation feedback', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/recommendations/feedback')
        .send({
          recommendationId: 'rec-123',
          feedback: 'invalid-feedback',
        });

      expectValidationError(response, 'feedback');
    });
  });

  describe('GET /bookings/:id/comparison', () => {
    it('should return booking comparison data', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/comparison');

      expect(response.status).toBe(200);
      expect(response.body.comparison).toBeDefined();
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/comparison');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/comparison', () => {
    it('should generate booking comparison', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/comparison')
        .send({
          compareWith: ['equipment-1', 'equipment-2'],
          dateRange: {
            startDate: '2024-12-15',
            endDate: '2024-12-17',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.comparison).toBeDefined();
    });

    it('should return validation error for invalid comparison data', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/comparison')
        .send({
          compareWith: [],
        });

      expectValidationError(response, 'compareWith');
    });
  });

  describe('GET /bookings/comparison/history', () => {
    it('should return comparison history', async () => {
      const mockComparisons = [
        {
          id: 'comparison-1',
          bookingId: 'test-booking-123',
          comparedEquipment: ['equipment-1', 'equipment-2'],
          createdAt: new Date(),
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/comparison/history');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.comparisons)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/comparison/history');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/:id/save-search', () => {
    it('should save search criteria for booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/save-search')
        .send({
          name: 'My Preferred Equipment',
          criteria: {
            equipmentType: 'svl75',
            maxPrice: 400,
            location: 'Saint John',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.savedSearchId).toBeDefined();
    });

    it('should return validation error for missing search name', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/save-search')
        .send({
          criteria: {
            equipmentType: 'svl75',
          },
        });

      expectValidationError(response, 'name');
    });
  });

  describe('GET /bookings/saved-searches', () => {
    it('should return saved searches for user', async () => {
      const mockSavedSearches = [
        {
          id: 'search-1',
          name: 'My Preferred Equipment',
          criteria: {
            equipmentType: 'svl75',
            maxPrice: 400,
          },
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/saved-searches');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.savedSearches)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/saved-searches');

      expectUnauthorizedError(response);
    });
  });

  describe('DELETE /bookings/saved-searches/:searchId', () => {
    it('should delete saved search', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/saved-searches/search-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent saved search', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/saved-searches/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/alerts', () => {
    it('should set up booking alerts', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/alerts')
        .send({
          alertTypes: ['payment_due', 'equipment_ready'],
          notificationMethods: ['email', 'sms'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return validation error for invalid alert types', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/alerts')
        .send({
          alertTypes: ['invalid_alert'],
        });

      expectValidationError(response, 'alertTypes');
    });
  });

  describe('GET /bookings/:id/alerts', () => {
    it('should return booking alerts', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/alerts');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.alerts)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/alerts');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /bookings/:id/alerts/:alertId', () => {
    it('should remove booking alert', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123/alerts/alert-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent alert', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123/alerts/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/alerts', () => {
    it('should return all user alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          bookingId: 'test-booking-123',
          type: 'payment_due',
          message: 'Payment due in 2 days',
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/alerts');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.alerts)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/bookings/alerts');

      expectUnauthorizedError(response);
    });
  });

  describe('PUT /bookings/alerts/:alertId/read', () => {
    it('should mark alert as read', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/alerts/alert-123/read');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent alert', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/alerts/non-existent-id/read');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/:id/notifications', () => {
    it('should return booking notifications', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/notifications');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.notifications)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/notifications');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/notifications', () => {
    it('should send booking notification', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/notifications')
        .send({
          type: 'reminder',
          message: 'Your equipment rental starts tomorrow',
          channels: ['email', 'sms'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return validation error for missing notification message', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/notifications')
        .send({
          type: 'reminder',
        });

      expectValidationError(response, 'message');
    });
  });

  describe('GET /bookings/notifications', () => {
    it('should return all notifications for user', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          bookingId: 'test-booking-123',
          type: 'reminder',
          message: 'Booking confirmed',
          read: false,
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/notifications');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.notifications)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/notifications');

      expectUnauthorizedError(response);
    });
  });

  describe('PUT /bookings/notifications/:notificationId/read', () => {
    it('should mark notification as read', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/notifications/notif-123/read');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent notification', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/notifications/non-existent-id/read');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /bookings/notifications/:notificationId', () => {
    it('should delete notification', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/notifications/notif-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent notification', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/notifications/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/notifications/unread-count', () => {
    it('should return unread notification count', async () => {
      const response = await createAuthenticatedRequest(app)
        .get('/bookings/notifications/unread-count');

      expect(response.status).toBe(200);
      expect(response.body.count).toBeDefined();
      expect(typeof response.body.count).toBe('number');
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/notifications/unread-count');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/notifications/mark-all-read', () => {
    it('should mark all notifications as read', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/notifications/mark-all-read');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.markedCount).toBeDefined();
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/bookings/notifications/mark-all-read');

      expectUnauthorizedError(response);
    });
  });

  describe('GET /bookings/:id/reminders', () => {
    it('should return booking reminders', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/reminders');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.reminders)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/reminders');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/reminders', () => {
    it('should create booking reminder', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/reminders')
        .send({
          type: 'pickup_reminder',
          scheduledFor: '2024-12-14T10:00:00Z',
          message: 'Remember to pick up your equipment tomorrow',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.reminderId).toBeDefined();
    });

    it('should return validation error for invalid reminder data', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/reminders')
        .send({
          type: 'pickup_reminder',
          // Missing scheduledFor and message
        });

      expectValidationError(response, 'scheduledFor');
      expectValidationError(response, 'message');
    });
  });

  describe('DELETE /bookings/:id/reminders/:reminderId', () => {
    it('should delete booking reminder', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123/reminders/reminder-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent reminder', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123/reminders/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/reminders', () => {
    it('should return all user reminders', async () => {
      const mockReminders = [
        {
          id: 'reminder-1',
          bookingId: 'test-booking-123',
          type: 'pickup_reminder',
          scheduledFor: '2024-12-14T10:00:00Z',
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/reminders');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.reminders)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/bookings/reminders');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/:id/custom-fields', () => {
    it('should add custom fields to booking', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        customFields: {
          projectCode: 'PRJ-2024-001',
          costCenter: 'CC-ENG-001',
        },
      } as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/custom-fields')
        .send({
          fields: {
            projectCode: 'PRJ-2024-001',
            costCenter: 'CC-ENG-001',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.customFields).toBeDefined();
      expect(response.body.customFields.projectCode).toBe('PRJ-2024-001');
    });

    it('should return validation error for invalid custom fields', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/custom-fields')
        .send({
          fields: {
            ['a'.repeat(51)]: 'value', // Field name too long
          },
        });

      expectValidationError(response, 'fields');
    });
  });

  describe('GET /bookings/:id/custom-fields', () => {
    it('should return booking custom fields', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        customFields: {
          projectCode: 'PRJ-2024-001',
        },
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/custom-fields');

      expect(response.status).toBe(200);
      expect(response.body.customFields).toBeDefined();
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/custom-fields');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /bookings/:id/custom-fields/:fieldName', () => {
    it('should update specific custom field', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        customFields: {
          projectCode: 'PRJ-2024-001',
        },
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        customFields: {
          projectCode: 'PRJ-2024-002', // Updated
        },
      } as any);

      const response = await createAuthenticatedRequest(app)
        .put('/bookings/test-booking-123/custom-fields/projectCode')
        .send({
          value: 'PRJ-2024-002',
        });

      expect(response.status).toBe(200);
      expect(response.body.customFields.projectCode).toBe('PRJ-2024-002');
    });

    it('should return not found for non-existent custom field', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/test-booking-123/custom-fields/nonExistentField')
        .send({
          value: 'new value',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /bookings/:id/custom-fields/:fieldName', () => {
    it('should delete custom field', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
        customFields: {
          projectCode: 'PRJ-2024-001',
        },
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);
      jest.spyOn(bookingRepository, 'save').mockResolvedValue({
        ...mockBooking,
        customFields: {}, // Field removed
      } as any);

      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123/custom-fields/projectCode');

      expect(response.status).toBe(200);
      expect(response.body.customFields.projectCode).toBeUndefined();
    });

    it('should return not found for non-existent custom field', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/test-booking-123/custom-fields/nonExistentField');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/custom-fields/schema', () => {
    it('should return custom fields schema', async () => {
      const mockSchema = {
        projectCode: {
          type: 'string',
          label: 'Project Code',
          required: false,
          validation: { pattern: 'PRJ-\\d{4}-\\d{3}' },
        },
        costCenter: {
          type: 'string',
          label: 'Cost Center',
          required: true,
        },
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/custom-fields/schema');

      expect(response.status).toBe(200);
      expect(response.body.schema).toBeDefined();
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/custom-fields/schema');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/custom-fields/schema', () => {
    it('should update custom fields schema', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/custom-fields/schema')
        .send({
          fieldName: 'department',
          fieldSchema: {
            type: 'string',
            label: 'Department',
            required: false,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return validation error for invalid schema', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/custom-fields/schema')
        .send({
          fieldName: '',
          fieldSchema: {},
        });

      expectValidationError(response, 'fieldName');
    });
  });

  describe('DELETE /bookings/custom-fields/schema/:fieldName', () => {
    it('should delete custom field from schema', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/custom-fields/schema/department');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent schema field', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/custom-fields/schema/nonExistentField');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/:id/workflows', () => {
    it('should return booking workflows', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/test-booking-123/workflows');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.workflows)).toBe(true);
    });

    it('should return not found for non-existent booking', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/non-existent-id/workflows');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/workflows/:workflowId/execute', () => {
    it('should execute workflow step', async () => {
      const mockBooking = createTestBooking({
        id: 'test-booking-123',
        customerId: testUser.id,
      });

      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(mockBooking as any);

      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/workflows/workflow-123/execute')
        .send({
          action: 'send_confirmation_email',
          parameters: {
            recipient: 'customer@example.com',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return validation error for invalid workflow action', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/test-booking-123/workflows/workflow-123/execute')
        .send({
          action: 'invalid_action',
        });

      expectValidationError(response, 'action');
    });
  });

  describe('GET /bookings/workflows/definitions', () => {
    it('should return workflow definitions', async () => {
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Booking Confirmation',
          description: 'Automated booking confirmation workflow',
          steps: [
            {
              id: 'step-1',
              name: 'Send Email',
              type: 'email',
              config: {},
            },
          ],
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/definitions');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.workflows)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/workflows/definitions');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/workflows/definitions', () => {
    it('should create new workflow definition', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/definitions')
        .send({
          name: 'Custom Approval Workflow',
          description: 'Custom workflow for special bookings',
          steps: [
            {
              name: 'Manager Approval',
              type: 'approval',
              config: {
                approvers: ['manager@example.com'],
              },
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.workflowId).toBeDefined();
    });

    it('should return validation error for invalid workflow definition', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/definitions')
        .send({
          name: '',
          steps: [],
        });

      expectValidationError(response, 'name');
      expectValidationError(response, 'steps');
    });
  });

  describe('PUT /bookings/workflows/definitions/:workflowId', () => {
    it('should update workflow definition', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/workflows/definitions/workflow-123')
        .send({
          name: 'Updated Workflow Name',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent workflow', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/workflows/definitions/non-existent-id')
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /bookings/workflows/definitions/:workflowId', () => {
    it('should delete workflow definition', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/workflows/definitions/workflow-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent workflow', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/workflows/definitions/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/workflows/executions', () => {
    it('should return workflow executions', async () => {
      const mockExecutions = [
        {
          id: 'execution-1',
          workflowId: 'workflow-123',
          bookingId: 'test-booking-123',
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date(),
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/executions');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.executions)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/workflows/executions');

      expectUnauthorizedError(response);
    });
  });

  describe('GET /bookings/workflows/executions/:executionId', () => {
    it('should return workflow execution details', async () => {
      const mockExecution = {
        id: 'execution-123',
        workflowId: 'workflow-123',
        bookingId: 'test-booking-123',
        status: 'running',
        steps: [
          {
            id: 'step-1',
            name: 'Send Email',
            status: 'completed',
            startedAt: new Date(),
            completedAt: new Date(),
          },
        ],
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/executions/execution-123');

      expect(response.status).toBe(200);
      expect(response.body.execution).toBeDefined();
    });

    it('should return not found for non-existent execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/executions/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/workflows/executions/:executionId/cancel', () => {
    it('should cancel workflow execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/executions/execution-123/cancel');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/executions/non-existent-id/cancel');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/workflows/executions/:executionId/logs', () => {
    it('should return workflow execution logs', async () => {
      const mockLogs = [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Workflow execution started',
          stepId: 'step-1',
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/executions/execution-123/logs');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.logs)).toBe(true);
    });

    it('should return not found for non-existent execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/executions/non-existent-id/logs');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/workflows/executions/:executionId/retry', () => {
    it('should retry failed workflow execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/executions/execution-123/retry')
        .send({
          fromStep: 'failed-step-id',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/executions/non-existent-id/retry');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/workflows/analytics', () => {
    it('should return workflow analytics', async () => {
      const mockAnalytics = {
        totalExecutions: 150,
        successfulExecutions: 145,
        failedExecutions: 5,
        averageExecutionTime: 2.5,
        mostUsedWorkflow: 'Booking Confirmation',
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/analytics')
        .query({
          startDate: '2024-12-01',
          endDate: '2024-12-31',
        });

      expect(response.status).toBe(200);
      expect(response.body.analytics).toBeDefined();
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/workflows/analytics');

      expectUnauthorizedError(response);
    });
  });

  describe('GET /bookings/workflows/reports/performance', () => {
    it('should return workflow performance report', async () => {
      const mockReport = {
        workflows: [
          {
            id: 'workflow-1',
            name: 'Booking Confirmation',
            averageExecutionTime: 1.8,
            successRate: 96.5,
            totalExecutions: 50,
          },
        ],
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/reports/performance')
        .query({
          startDate: '2024-12-01',
          endDate: '2024-12-31',
        });

      expect(response.status).toBe(200);
      expect(response.body.report).toBeDefined();
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/workflows/reports/performance');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/workflows/test', () => {
    it('should test workflow execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/test')
        .send({
          workflowId: 'workflow-123',
          testData: {
            bookingId: 'test-booking-123',
            simulateFailure: false,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.testResult).toBeDefined();
    });

    it('should return validation error for invalid test data', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/test')
        .send({
          workflowId: '',
        });

      expectValidationError(response, 'workflowId');
    });
  });

  describe('GET /bookings/workflows/templates', () => {
    it('should return workflow templates', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Standard Booking Workflow',
          description: 'Default workflow for standard bookings',
          category: 'booking',
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/templates');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/workflows/templates');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/workflows/templates/:templateId/apply', () => {
    it('should apply workflow template', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/templates/template-123/apply')
        .send({
          targetBookingId: 'test-booking-123',
          customizations: {
            emailTemplate: 'custom-template',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.workflowId).toBeDefined();
    });

    it('should return validation error for invalid template application', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/templates/template-123/apply')
        .send({
          targetBookingId: '',
        });

      expectValidationError(response, 'targetBookingId');
    });
  });

  describe('GET /bookings/workflows/monitoring', () => {
    it('should return workflow monitoring data', async () => {
      const mockMonitoring = {
        activeExecutions: 3,
        queuedExecutions: 5,
        failedExecutions: 1,
        systemHealth: 'healthy',
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/monitoring');

      expect(response.status).toBe(200);
      expect(response.body.monitoring).toBeDefined();
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/workflows/monitoring');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/workflows/executions/:executionId/pause', () => {
    it('should pause workflow execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/executions/execution-123/pause');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/executions/non-existent-id/pause');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/workflows/executions/:executionId/resume', () => {
    it('should resume paused workflow execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/executions/execution-123/resume');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/executions/non-existent-id/resume');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/workflows/executions/:executionId/steps/:stepId', () => {
    it('should return workflow step details', async () => {
      const mockStep = {
        id: 'step-123',
        name: 'Send Email',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        output: {
          emailSent: true,
          recipient: 'customer@example.com',
        },
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/executions/execution-123/steps/step-123');

      expect(response.status).toBe(200);
      expect(response.body.step).toBeDefined();
    });

    it('should return not found for non-existent step', async () => {
      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/executions/execution-123/steps/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/workflows/executions/:executionId/steps/:stepId/retry', () => {
    it('should retry failed workflow step', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/executions/execution-123/steps/step-123/retry');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent step', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/executions/execution-123/steps/non-existent-id/retry');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/workflows/executions/:executionId/errors', () => {
    it('should return workflow execution errors', async () => {
      const mockErrors = [
        {
          stepId: 'step-123',
          errorType: 'email_failed',
          message: 'Failed to send email',
          timestamp: new Date(),
          details: {
            recipient: 'customer@example.com',
            errorCode: 'SMTP_ERROR',
          },
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/executions/execution-123/errors');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should return not found for non-existent execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/executions/non-existent-id/errors');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/workflows/executions/:executionId/errors/:errorId/resolve', () => {
    it('should resolve workflow error', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/executions/execution-123/errors/error-123/resolve')
        .send({
          resolution: 'Retried email sending',
          resolutionDetails: 'Email sent successfully on retry',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent error', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/executions/execution-123/errors/non-existent-id/resolve');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/workflows/reports/errors', () => {
    it('should return workflow error report', async () => {
      const mockErrorReport = {
        totalErrors: 15,
        errorTypes: {
          email_failed: 8,
          api_timeout: 5,
          validation_error: 2,
        },
        mostCommonErrors: [
          {
            type: 'email_failed',
            count: 8,
            description: 'Failed to send confirmation email',
          },
        ],
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/reports/errors')
        .query({
          startDate: '2024-12-01',
          endDate: '2024-12-31',
        });

      expect(response.status).toBe(200);
      expect(response.body.errorReport).toBeDefined();
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/workflows/reports/errors');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/workflows/bulk-execute', () => {
    it('should execute workflows for multiple bookings', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/bulk-execute')
        .send({
          workflowId: 'workflow-123',
          bookingIds: ['booking-1', 'booking-2', 'booking-3'],
          parameters: {
            priority: 'high',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.executionCount).toBe(3);
    });

    it('should return validation error for invalid bulk execution data', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/bulk-execute')
        .send({
          workflowId: 'workflow-123',
          bookingIds: [],
        });

      expectValidationError(response, 'bookingIds');
    });
  });

  describe('GET /bookings/workflows/executions/bulk/:bulkExecutionId', () => {
    it('should return bulk execution status', async () => {
      const mockBulkExecution = {
        id: 'bulk-execution-123',
        workflowId: 'workflow-123',
        totalBookings: 5,
        completedBookings: 3,
        failedBookings: 0,
        status: 'running',
        startedAt: new Date(),
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/executions/bulk/bulk-execution-123');

      expect(response.status).toBe(200);
      expect(response.body.bulkExecution).toBeDefined();
    });

    it('should return not found for non-existent bulk execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/executions/bulk/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/workflows/executions/bulk/:bulkExecutionId/cancel', () => {
    it('should cancel bulk workflow execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/executions/bulk/bulk-execution-123/cancel');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent bulk execution', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/executions/bulk/non-existent-id/cancel');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/workflows/executions/bulk', () => {
    it('should return bulk execution history', async () => {
      const mockBulkExecutions = [
        {
          id: 'bulk-1',
          workflowId: 'workflow-123',
          totalBookings: 10,
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date(),
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/executions/bulk');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.bulkExecutions)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/workflows/executions/bulk');

      expectUnauthorizedError(response);
    });
  });

  describe('GET /bookings/workflows/reports/bulk-performance', () => {
    it('should return bulk execution performance report', async () => {
      const mockReport = {
        totalBulkExecutions: 25,
        averageExecutionTime: 4.5,
        averageBookingsPerExecution: 8.2,
        successRate: 92.0,
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/reports/bulk-performance')
        .query({
          startDate: '2024-12-01',
          endDate: '2024-12-31',
        });

      expect(response.status).toBe(200);
      expect(response.body.report).toBeDefined();
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/workflows/reports/bulk-performance');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/workflows/webhook', () => {
    it('should handle workflow webhook', async () => {
      const webhookPayload = {
        eventType: 'workflow.completed',
        executionId: 'execution-123',
        bookingId: 'test-booking-123',
        result: {
          success: true,
          output: 'Workflow completed successfully',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/bookings/workflows/webhook')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should return error for invalid webhook payload', async () => {
      const response = await request(app.getHttpServer())
        .post('/bookings/workflows/webhook')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid payload');
    });
  });

  describe('GET /bookings/workflows/integrations', () => {
    it('should return workflow integrations', async () => {
      const mockIntegrations = [
        {
          id: 'integration-1',
          name: 'Email Service',
          type: 'email',
          status: 'active',
          config: {
            provider: 'sendgrid',
          },
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/integrations');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.integrations)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/workflows/integrations');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/workflows/integrations', () => {
    it('should create workflow integration', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/integrations')
        .send({
          name: 'Slack Notifications',
          type: 'messaging',
          config: {
            webhookUrl: 'https://hooks.slack.com/services/...',
            channel: '#bookings',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.integrationId).toBeDefined();
    });

    it('should return validation error for invalid integration config', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/integrations')
        .send({
          name: 'Invalid Integration',
          type: 'messaging',
          config: {
            // Missing required webhookUrl
          },
        });

      expectValidationError(response, 'config');
    });
  });

  describe('PUT /bookings/workflows/integrations/:integrationId', () => {
    it('should update workflow integration', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/workflows/integrations/integration-123')
        .send({
          name: 'Updated Integration Name',
          status: 'inactive',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent integration', async () => {
      const response = await createAuthenticatedRequest(app)
        .put('/bookings/workflows/integrations/non-existent-id')
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /bookings/workflows/integrations/:integrationId', () => {
    it('should delete workflow integration', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/workflows/integrations/integration-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return not found for non-existent integration', async () => {
      const response = await createAuthenticatedRequest(app)
        .delete('/bookings/workflows/integrations/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/workflows/integrations/:integrationId/test', () => {
    it('should test workflow integration', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/integrations/integration-123/test');

      expect(response.status).toBe(200);
      expect(response.body.testResult).toBeDefined();
    });

    it('should return not found for non-existent integration', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/integrations/non-existent-id/test');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/workflows/integrations/:integrationId/logs', () => {
    it('should return integration logs', async () => {
      const mockLogs = [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Integration test successful',
          details: {
            responseTime: 150,
            statusCode: 200,
          },
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/integrations/integration-123/logs');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.logs)).toBe(true);
    });

    it('should return not found for non-existent integration', async () => {
      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/integrations/non-existent-id/logs');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /bookings/workflows/integrations/reports/health', () => {
    it('should return integration health report', async () => {
      const mockHealthReport = {
        totalIntegrations: 5,
        healthyIntegrations: 4,
        unhealthyIntegrations: 1,
        integrations: [
          {
            id: 'integration-1',
            name: 'Email Service',
            status: 'healthy',
            lastCheck: new Date(),
            responseTime: 120,
          },
        ],
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/integrations/reports/health');

      expect(response.status).toBe(200);
      expect(response.body.healthReport).toBeDefined();
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/workflows/integrations/reports/health');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/workflows/integrations/bulk-test', () => {
    it('should test multiple integrations', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/integrations/bulk-test')
        .send({
          integrationIds: ['integration-1', 'integration-2'],
        });

      expect(response.status).toBe(200);
      expect(response.body.results).toBeDefined();
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should return validation error for invalid integration IDs', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/integrations/bulk-test')
        .send({
          integrationIds: [],
        });

      expectValidationError(response, 'integrationIds');
    });
  });

  describe('GET /bookings/workflows/integrations/templates', () => {
    it('should return integration templates', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Slack Integration',
          type: 'messaging',
          description: 'Send notifications to Slack channels',
          configSchema: {
            webhookUrl: { type: 'string', required: true },
            channel: { type: 'string', required: false },
          },
        },
      ];

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/integrations/templates');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('should return unauthorized error without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/workflows/integrations/templates');

      expectUnauthorizedError(response);
    });
  });

  describe('POST /bookings/workflows/integrations/templates/:templateId/create', () => {
    it('should create integration from template', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/integrations/templates/template-123/create')
        .send({
          name: 'My Slack Integration',
          config: {
            webhookUrl: 'https://hooks.slack.com/services/...',
            channel: '#bookings',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.integrationId).toBeDefined();
    });

    it('should return validation error for invalid template configuration', async () => {
      const response = await createAuthenticatedRequest(app)
        .post('/bookings/workflows/integrations/templates/template-123/create')
        .send({
          name: 'Invalid Integration',
          config: {
            // Missing required webhookUrl
          },
        });

      expectValidationError(response, 'config');
    });
  });

  describe('GET /bookings/workflows/integrations/:integrationId/metrics', () => {
    it('should return integration metrics', async () => {
      const mockMetrics = {
        totalExecutions: 150,
        successfulExecutions: 145,
        failedExecutions: 5,
        averageResponseTime: 250,
        uptime: 99.8,
      };

      const response = await createAuthenticatedRequest(app)
        .get('/bookings/workflows/insights');
    });
  });
});
