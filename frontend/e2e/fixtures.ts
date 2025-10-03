// Reusable test fixtures and utilities for Playwright tests
import { test as base, Page } from '@playwright/test';
import { createApiMocks, mockScenarios } from './api-mocks';

// Extend the base test with custom fixtures
type TestFixtures = {
  apiMocks: ReturnType<typeof createApiMocks>;
};

export const test = base.extend<TestFixtures>({
  // Add API mocking utilities to all tests
  apiMocks: async ({ page }, use) => {
    const mocks = createApiMocks(page);
    await use(mocks);
  },
});

// Page Object Models for better test organization
export class BookingPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/book');
  }

  async fillDateRange(startDate: string, endDate: string) {
    await this.page.fill('input[name="startDate"]', startDate);
    await this.page.fill('input[name="endDate"]', endDate);
  }

  async fillDeliveryInfo(address: string, city: string, postalCode?: string) {
    await this.page.fill('input[name="deliveryAddress"]', address);
    await this.page.fill('input[name="deliveryCity"]', city);
    if (postalCode) {
      await this.page.fill('input[name="postalCode"]', postalCode);
    }
  }

  async clickNext() {
    await this.page.click('button:has-text("Next")');
  }

  async clickPrevious() {
    await this.page.click('button:has-text("Previous")');
  }

  async clickConfirmBooking() {
    await this.page.click('button:has-text("Confirm Booking")');
  }

  async expectOnStep(step: number) {
    await this.page.waitForSelector(`[data-step="${step}"].active`);
  }

  async expectValidationError(message: string) {
    await this.page.waitForSelector(`text=${message}`);
  }

  async expectBookingSuccess() {
    await this.page.waitForSelector('text=Booking Confirmed!');
  }

  async getPricingInfo() {
    return {
      dailyRate: await this.page.textContent('[data-testid="daily-rate"]'),
      days: await this.page.textContent('[data-testid="days"]'),
      subtotal: await this.page.textContent('[data-testid="subtotal"]'),
      taxes: await this.page.textContent('[data-testid="taxes"]'),
      floatFee: await this.page.textContent('[data-testid="float-fee"]'),
      total: await this.page.textContent('[data-testid="total"]'),
    };
  }
}

export class HomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async clickBookNow() {
    await this.page.click('text=Book Now');
  }

  async expectHeroContent() {
    await this.page.waitForSelector('text=Kubota SVL-75 Rental');
    await this.page.waitForSelector('text=Professional Grade Equipment');
  }
}

// Test data factories
export const testData = {
  validBooking: {
    startDate: '2024-12-15',
    endDate: '2024-12-17',
    deliveryAddress: '123 Main Street',
    deliveryCity: 'Saint John',
    postalCode: 'E2K 1A1',
  },

  invalidBooking: {
    startDate: '2024-12-17',
    endDate: '2024-12-15', // End before start
    deliveryAddress: '',
    deliveryCity: '',
  },

  oneDayBooking: {
    startDate: '2024-12-15',
    endDate: '2024-12-16',
    deliveryAddress: '456 Oak Avenue',
    deliveryCity: 'Fredericton',
  },

  longTermBooking: {
    startDate: '2024-12-15',
    endDate: '2024-12-30', // 15 days
    deliveryAddress: '789 Pine Road',
    deliveryCity: 'Moncton',
  },
};

// Common test steps that can be reused
export const testSteps = {
  completeValidBooking: async (page: Page, data = testData.validBooking) => {
    const bookingPage = new BookingPage(page);

    // Step 1: Fill dates
    await bookingPage.fillDateRange(data.startDate, data.endDate);
    await bookingPage.clickNext();

    // Step 2: Fill delivery info
    await bookingPage.fillDeliveryInfo(data.deliveryAddress, data.deliveryCity, data.postalCode);
    await bookingPage.clickNext();

    // Step 3: Confirm booking
    await bookingPage.clickConfirmBooking();
  },

  navigateToBookingPage: async (page: Page) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.clickBookNow();
  },

  setupSuccessfulBookingScenario: async (page: Page) => {
    await mockScenarios.successfulBooking(page);
  },

  setupNetworkFailureScenario: async (page: Page) => {
    await mockScenarios.networkFailure(page);
  },
};

// Accessibility helpers
export const a11y = {
  expectAccessible: async (page: Page) => {
    // Basic accessibility checks
    await page.waitForSelector('h1');
    await page.waitForSelector('main');

    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      await img.waitFor({ state: 'visible' });
      // Note: In a real scenario, you'd want more sophisticated alt text checking
    }
  },

  expectKeyboardNavigable: async (page: Page) => {
    // Test basic keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
  },
};

// Performance helpers
export const performance = {
  expectFastLoad: async (page: Page, maxLoadTime = 3000) => {
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    if (loadTime > maxLoadTime) {
      throw new Error(`Page load time (${loadTime}ms) exceeded maximum (${maxLoadTime}ms)`);
    }
  },

  measureInteractionTime: async (page: Page, action: () => Promise<void>) => {
    const startTime = Date.now();
    await action();
    return Date.now() - startTime;
  },
};

// Visual regression helpers (for future implementation)
export const visual = {
  expectScreenshotStable: async (page: Page, name: string) => {
    // Placeholder for visual regression testing
    // This would integrate with a tool like Playwright Visual Comparisons
    await page.screenshot({ path: `test-results/screenshots/${name}.png` });
  },
};
