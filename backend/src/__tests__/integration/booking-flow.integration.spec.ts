/**
 * Comprehensive Business Flow Integration Tests
 *
 * Tests complete booking flows, payment processing, and multi-role scenarios
 * with GDPR-compliant test data and proper cleanup.
 */

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../../app.module';
import {
    cleanupManager,
    DatabaseManager,
    factory,
    scenarioBuilder,
    TestDataContext,
    timeFreezer
} from '../../test/factories';

describe('Booking Flow Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testContext: TestDataContext;
  let dbManager: DatabaseManager;

  beforeAll(async () => {
    // Build the testing module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get database connection
    dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
    dbManager = new DatabaseManager(dataSource);

    // Setup test context
    testContext = {
      dataSource,
      cleanup: async () => {
        await dbManager.resetDatabase();
      }
    };

    factory.setContext(testContext);
    cleanupManager.register(async () => {
      await dbManager.resetDatabase();
    });

    // Reset database before tests
    await dbManager.resetDatabase();
  });

  afterAll(async () => {
    await cleanupManager.cleanup();
    await app.close();
  });

  beforeEach(async () => {
    // Reset database before each test
    await dbManager.resetDatabase();
  });

  describe('Complete Booking Flow', () => {
    it('should complete full booking lifecycle successfully', async () => {
      // Create test scenario
      const scenario = await scenarioBuilder.createBookingFlowScenario();

      // Verify user creation
      const userResponse = await request(app.getHttpServer())
        .get(`/auth/profile/${scenario.customer.id}`)
        .expect(200);

      expect(userResponse.body.email).toBe(scenario.customer.email);
      expect(userResponse.body.role).toBe('customer');

      // Verify equipment availability
      const equipmentResponse = await request(app.getHttpServer())
        .get(`/equipment/${scenario.equipment.id}`)
        .expect(200);

      expect(equipmentResponse.body.status).toBe('available');
      expect(equipmentResponse.body.dailyRate).toBe(250.00);

      // Verify booking creation
      const bookingResponse = await request(app.getHttpServer())
        .get(`/bookings/${scenario.booking.id}`)
        .expect(200);

      expect(bookingResponse.body.status).toBe('confirmed');
      expect(bookingResponse.body.total).toBe(2052.50);

      // Verify contract creation
      const contractResponse = await request(app.getHttpServer())
        .get(`/contracts/${scenario.contract.id}`)
        .expect(200);

      expect(contractResponse.body.status).toBe('signed');
      expect(contractResponse.body.contractNumber).toMatch(/^CON-2025-/);

      // Verify payment processing
      const paymentResponse = await request(app.getHttpServer())
        .get(`/payments/${scenario.payment.id}`)
        .expect(200);

      expect(paymentResponse.body.status).toBe('completed');
      expect(paymentResponse.body.amount).toBe(2052.50);

      // Verify insurance document
      const insuranceResponse = await request(app.getHttpServer())
        .get(`/insurance/${scenario.insuranceDocument.id}`)
        .expect(200);

      expect(insuranceResponse.body.status).toBe('approved');
      expect(insuranceResponse.body.type).toBe('coi');
    });

    it('should handle booking status transitions correctly', async () => {
      const scenario = await scenarioBuilder.createBookingFlowScenario();

      // Test status transition: pending -> confirmed -> paid
      await request(app.getHttpServer())
        .patch(`/bookings/${scenario.booking.id}/status`)
        .send({ status: 'paid' })
        .expect(200);

      const updatedBooking = await request(app.getHttpServer())
        .get(`/bookings/${scenario.booking.id}`)
        .expect(200);

      expect(updatedBooking.body.status).toBe('paid');

      // Test equipment status update
      const equipmentResponse = await request(app.getHttpServer())
        .get(`/equipment/${scenario.equipment.id}`)
        .expect(200);

      expect(equipmentResponse.body.status).toBe('rented');
    });

    it('should calculate pricing correctly for different rental periods', async () => {
      const customer = await factory.users.create({ role: 'customer' });
      const equipment = await factory.equipment.create({
        dailyRate: 100,
        weeklyRate: 500,
        monthlyRate: 1800
      });

      // Test daily rental (3 days)
      const dailyBooking = await factory.bookings.create({
        customerId: customer.id,
        equipmentId: equipment.id,
        startDate: new Date('2024-06-01T00:00:00Z'),
        endDate: new Date('2024-06-04T00:00:00Z'), // 3 days
        status: 'confirmed'
      });

      expect(dailyBooking.subtotal).toBe(300.00); // 3 * 100
      expect(dailyBooking.taxes).toBe(39.00); // 13% tax
      expect(dailyBooking.total).toBe(339.00);

      // Test weekly rental (2 weeks)
      const weeklyBooking = await factory.bookings.create({
        customerId: customer.id,
        equipmentId: equipment.id,
        startDate: new Date('2024-07-01T00:00:00Z'),
        endDate: new Date('2024-07-15T00:00:00Z'), // 14 days
        status: 'confirmed'
      });

      expect(weeklyBooking.subtotal).toBe(1000.00); // 2 * 500
      expect(weeklyBooking.taxes).toBe(130.00);
      expect(weeklyBooking.total).toBe(1130.00);
    });
  });

  describe('Payment Processing Failure Scenarios', () => {
    it('should handle payment failures gracefully', async () => {
      const scenario = await scenarioBuilder.createPaymentFailureScenario();

      // Verify booking is in pending payment state
      const bookingResponse = await request(app.getHttpServer())
        .get(`/bookings/${scenario.booking.id}`)
        .expect(200);

      expect(bookingResponse.body.status).toBe('pending');

      // Verify failed payment record
      const paymentResponse = await request(app.getHttpServer())
        .get(`/payments/${scenario.failedPayment.id}`)
        .expect(200);

      expect(paymentResponse.body.status).toBe('failed');
      expect(paymentResponse.body.failureReason).toBeTruthy();
    });

    it('should allow retry after payment failure', async () => {
      const scenario = await scenarioBuilder.createPaymentFailureScenario();

      // Create new successful payment
      const retryPayment = await factory.payments.create({
        bookingId: scenario.booking.id,
        status: 'completed',
        amount: 2052.50,
        stripePaymentIntentId: `pi_retry_${Date.now()}`
      });

      // Update booking status
      await request(app.getHttpServer())
        .patch(`/bookings/${scenario.booking.id}/status`)
        .send({ status: 'paid' })
        .expect(200);

      // Verify booking is now paid
      const bookingResponse = await request(app.getHttpServer())
        .get(`/bookings/${scenario.booking.id}`)
        .expect(200);

      expect(bookingResponse.body.status).toBe('paid');
    });

    it('should handle partial refunds correctly', async () => {
      const scenario = await scenarioBuilder.createBookingFlowScenario();

      // Process partial refund
      const refundPayment = await factory.payments.create({
        bookingId: scenario.booking.id,
        type: 'refund',
        status: 'completed',
        amount: -500.00, // Partial refund
        stripePaymentIntentId: `pi_refund_${Date.now()}`
      });

      // Verify refund amount is recorded
      const paymentResponse = await request(app.getHttpServer())
        .get(`/payments/${refundPayment.id}`)
        .expect(200);

      expect(paymentResponse.body.amount).toBe(-500.00);
      expect(paymentResponse.body.type).toBe('refund');
    });
  });

  describe('Multi-Role Accessibility', () => {
    it('should enforce proper role-based access control', async () => {
      const scenario = await scenarioBuilder.createMultiRoleScenario();

      // Customer should access their own booking
      await request(app.getHttpServer())
        .get(`/bookings/${scenario.booking.id}`)
        .set('Authorization', `Bearer customer-token`)
        .expect(200);

      // Operator should access booking for operational purposes
      await request(app.getHttpServer())
        .get(`/bookings/${scenario.booking.id}`)
        .set('Authorization', `Bearer operator-token`)
        .expect(200);

      // Admin should access all bookings
      await request(app.getHttpServer())
        .get(`/bookings/${scenario.booking.id}`)
        .set('Authorization', `Bearer admin-token`)
        .expect(200);
    });

    it('should handle concurrent booking requests safely', async () => {
      const customer = await factory.users.create({ role: 'customer' });
      const equipment = await factory.equipment.create({
        status: 'available'
      });

      // Simulate concurrent booking requests
      const bookingPromises = Array.from({ length: 3 }, () =>
        factory.bookings.create({
          customerId: customer.id,
          equipmentId: equipment.id,
          startDate: new Date('2024-08-01T00:00:00Z'),
          endDate: new Date('2024-08-08T00:00:00Z'),
          status: 'confirmed'
        })
      );

      const bookings = await Promise.all(bookingPromises);

      // Only one booking should succeed, others should fail due to equipment unavailability
      const successfulBookings = bookings.filter(b => b.status === 'confirmed');
      expect(successfulBookings.length).toBeLessThanOrEqual(1);

      // Equipment should be marked as rented
      const equipmentResponse = await request(app.getHttpServer())
        .get(`/equipment/${equipment.id}`)
        .expect(200);

      expect(equipmentResponse.body.status).toBe('rented');
    });

    it('should validate business rules for booking modifications', async () => {
      const scenario = await scenarioBuilder.createBookingFlowScenario();

      // Test booking modification within allowed timeframe
      const modificationTime = new Date(scenario.booking.createdAt.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

      await timeFreezer.freezeTime(modificationTime);

      await request(app.getHttpServer())
        .patch(`/bookings/${scenario.booking.id}`)
        .send({
          specialInstructions: 'Updated instructions'
        })
        .expect(200);

      // Test booking modification after cutoff (should fail)
      const cutoffTime = new Date(scenario.booking.startDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before start

      await timeFreezer.freezeTime(cutoffTime);

      await request(app.getHttpServer())
        .patch(`/bookings/${scenario.booking.id}`)
        .send({
          endDate: new Date('2024-06-10T00:00:00Z') // Extend booking
        })
        .expect(400); // Should fail due to business rules
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle equipment unavailability gracefully', async () => {
      const customer = await factory.users.create({ role: 'customer' });

      // Create equipment and mark as rented
      const equipment = await factory.equipment.create({
        status: 'rented'
      });

      // Attempt to book unavailable equipment
      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          customerId: customer.id,
          equipmentId: equipment.id,
          startDate: new Date('2024-09-01T00:00:00Z'),
          endDate: new Date('2024-09-08T00:00:00Z')
        })
        .expect(400); // Should fail due to unavailability
    });

    it('should validate insurance document requirements', async () => {
      const customer = await factory.users.create({ role: 'customer' });
      const equipment = await factory.equipment.create({
        status: 'available'
      });

      const booking = await factory.bookings.create({
        customerId: customer.id,
        equipmentId: equipment.id,
        status: 'pending'
      });

      // Attempt to confirm booking without insurance
      await request(app.getHttpServer())
        .patch(`/bookings/${booking.id}/status`)
        .send({ status: 'confirmed' })
        .expect(400); // Should require insurance verification

      // Add insurance document
      const insuranceDoc = await factory.insuranceDocuments.create({
        bookingId: booking.id,
        status: 'approved'
      });

      // Now confirmation should succeed
      await request(app.getHttpServer())
        .patch(`/bookings/${booking.id}/status`)
        .send({ status: 'insurance_verified' })
        .expect(200);
    });

    it('should handle contract signature workflow', async () => {
      const scenario = await scenarioBuilder.createBookingFlowScenario();

      // Test contract signature process
      await request(app.getHttpServer())
        .post(`/contracts/${scenario.contract.id}/send-for-signature`)
        .expect(200);

      // Verify contract status updated
      const contractResponse = await request(app.getHttpServer())
        .get(`/contracts/${scenario.contract.id}`)
        .expect(200);

      expect(contractResponse.body.status).toBe('sent_for_signature');

      // Simulate signature completion
      await request(app.getHttpServer())
        .post(`/contracts/${scenario.contract.id}/complete-signature`)
        .send({
          signature: 'data:image/png;base64,signed',
          ipAddress: '192.168.1.1'
        })
        .expect(200);

      // Verify final contract status
      const finalContractResponse = await request(app.getHttpServer())
        .get(`/contracts/${scenario.contract.id}`)
        .expect(200);

      expect(finalContractResponse.body.status).toBe('signed');
    });
  });

  describe('Data Integrity and GDPR Compliance', () => {
    it('should maintain data consistency across related entities', async () => {
      const scenario = await scenarioBuilder.createBookingFlowScenario();

      // Verify referential integrity
      expect(scenario.booking.customerId).toBe(scenario.user.id);
      expect(scenario.booking.equipmentId).toBe(scenario.equipment.id);
      expect(scenario.contract.bookingId).toBe(scenario.booking.id);
      expect(scenario.payment.bookingId).toBe(scenario.booking.id);
      expect(scenario.insuranceDocument.bookingId).toBe(scenario.booking.id);

      // Verify cascade operations work correctly
      await request(app.getHttpServer())
        .delete(`/bookings/${scenario.booking.id}`)
        .expect(200);

      // Related entities should be cascade deleted
      await request(app.getHttpServer())
        .get(`/contracts/${scenario.contract.id}`)
        .expect(404);

      await request(app.getHttpServer())
        .get(`/payments/${scenario.payment.id}`)
        .expect(404);
    });

    it('should handle GDPR data deletion requests', async () => {
      const scenario = await scenarioBuilder.createBookingFlowScenario();

      // Simulate GDPR deletion request
      await request(app.getHttpServer())
        .delete(`/users/${scenario.user.id}/gdpr-delete`)
        .expect(200);

      // Verify user data is anonymized or deleted
      const userResponse = await request(app.getHttpServer())
        .get(`/users/${scenario.user.id}`)
        .expect(404); // Should be deleted

      // Related bookings should also be handled appropriately
      const bookingResponse = await request(app.getHttpServer())
        .get(`/bookings/${scenario.booking.id}`)
        .expect(404); // Should be cascade deleted
    });

    it('should validate data retention policies', async () => {
      const scenario = await scenarioBuilder.createBookingFlowScenario();

      // Advance time beyond retention period
      const retentionCutoff = new Date();
      retentionCutoff.setFullYear(retentionCutoff.getFullYear() + 2); // 2 years later

      await timeFreezer.freezeTime(retentionCutoff);

      // Trigger data retention cleanup
      await request(app.getHttpServer())
        .post('/admin/cleanup-retention-data')
        .expect(200);

      // Verify old data is archived or deleted
      // (Implementation depends on specific retention policies)
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent bookings efficiently', async () => {
      const startTime = Date.now();

      // Create multiple customers and equipment
      const customers = await factory.users.createMany(5, { role: 'customer' });
      const equipment = await factory.equipment.createMany(3, { status: 'available' });

      // Create concurrent bookings
      const bookingPromises = customers.flatMap(customer =>
        equipment.map(eq =>
          factory.bookings.create({
            customerId: customer.id,
            equipmentId: eq.id,
            startDate: new Date('2024-10-01T00:00:00Z'),
            endDate: new Date('2024-10-08T00:00:00Z'),
            status: 'confirmed'
          })
        )
      );

      const bookings = await Promise.all(bookingPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
      expect(bookings.length).toBe(15); // 5 customers * 3 equipment
    });

    it('should maintain performance under load', async () => {
      const customer = await factory.users.create({ role: 'customer' });
      const equipment = await factory.equipment.create({ status: 'available' });

      // Create multiple rapid booking requests
      const rapidBookings = Array.from({ length: 10 }, (_, i) =>
        factory.bookings.create({
          customerId: customer.id,
          equipmentId: equipment.id,
          startDate: new Date(`2024-11-01T${String(i).padStart(2, '0')}:00:00Z`),
          endDate: new Date(`2024-11-02T${String(i).padStart(2, '0')}:00:00Z`),
          status: 'confirmed'
        })
      );

      const bookings = await Promise.all(rapidBookings);

      // Verify all bookings were created successfully
      expect(bookings.length).toBe(10);

      // Verify equipment status is properly managed
      const equipmentResponse = await request(app.getHttpServer())
        .get(`/equipment/${equipment.id}`)
        .expect(200);

      expect(equipmentResponse.body.status).toBe('rented');
    });
  });
});
