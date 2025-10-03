// API Mocking utilities for Playwright tests
import { Page } from '@playwright/test';

export class ApiMocks {
  constructor(private page: Page) {}

  // Mock successful booking creation
  async mockBookingSuccess(overrides = {}) {
    const defaultBooking = {
      id: 'booking-123',
      startDate: '2024-12-15',
      endDate: '2024-12-17',
      equipmentId: 'kubota-svl75',
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
        address: '123 Main Street',
        city: 'Saint John',
      },
      pricing: {
        dailyRate: 350,
        days: 2,
        subtotal: 700,
        taxes: 105,
        floatFee: 150,
        total: 955,
      },
      status: 'confirmed',
      bookingNumber: 'UDR-2024-001',
      createdAt: new Date().toISOString(),
      ...overrides,
    };

    await this.page.route('**/api/bookings', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: defaultBooking,
        }),
      });
    });

    return defaultBooking;
  }

  // Mock booking validation errors
  async mockBookingValidationError(errors = {}) {
    const defaultErrors = {
      startDate: ['Start date is required'],
      endDate: ['End date is required'],
      ...errors,
    };

    await this.page.route('**/api/bookings', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          errors: defaultErrors,
        }),
      });
    });
  }

  // Mock equipment availability check
  async mockEquipmentAvailability(available = true, dates = {}) {
    const defaultAvailability = {
      '2024-12-15': available,
      '2024-12-16': available,
      '2024-12-17': true,
      ...dates,
    };

    await this.page.route('**/api/availability/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          available: available,
          dates: defaultAvailability,
        }),
      });
    });
  }

  // Mock equipment unavailability
  async mockEquipmentUnavailable() {
    await this.mockEquipmentAvailability(false);
  }

  // Mock payment processing
  async mockPaymentSuccess(paymentIntentId = 'pi_test_123') {
    await this.page.route('**/api/webhooks/stripe', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          paymentIntentId,
          status: 'succeeded',
        }),
      });
    });
  }

  // Mock payment failure
  async mockPaymentFailure(error = 'Your card was declined') {
    await this.page.route('**/api/webhooks/stripe', async route => {
      await route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error,
        }),
      });
    });
  }

  // Mock network errors
  async mockNetworkError() {
    await this.page.route('**/api/**', async route => {
      await route.abort('failed');
    });
  }

  // Mock slow network
  async mockSlowNetwork(delay = 3000) {
    await this.page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, delay));
      await route.continue();
    });
  }

  // Mock authentication endpoints
  async mockAuthSuccess(token = 'fake-jwt-token') {
    await this.page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token,
          user: {
            id: 'user-123',
            name: 'John Doe',
            email: 'john@example.com',
          },
        }),
      });
    });
  }

  // Mock health check endpoint
  async mockHealthCheck(healthy = true) {
    await this.page.route('**/api/health', async route => {
      await route.fulfill({
        status: healthy ? 200 : 503,
        contentType: 'application/json',
        body: JSON.stringify({
          status: healthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
        }),
      });
    });
  }
}

// Helper function to create API mocks for a page
export const createApiMocks = (page: Page) => new ApiMocks(page);

// Common test scenarios
export const mockScenarios = {
  successfulBooking: async (page: Page) => {
    const mocks = createApiMocks(page);
    await mocks.mockHealthCheck(true);
    await mocks.mockEquipmentAvailability(true);
    await mocks.mockBookingSuccess();
    await mocks.mockPaymentSuccess();
  },

  bookingWithUnavailableEquipment: async (page: Page) => {
    const mocks = createApiMocks(page);
    await mocks.mockHealthCheck(true);
    await mocks.mockEquipmentUnavailable();
  },

  networkFailure: async (page: Page) => {
    const mocks = createApiMocks(page);
    await mocks.mockNetworkError();
  },

  slowNetwork: async (page: Page) => {
    const mocks = createApiMocks(page);
    await mocks.mockSlowNetwork();
  },
};
