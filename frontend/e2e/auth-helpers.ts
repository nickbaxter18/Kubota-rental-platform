// Authentication helpers for Playwright tests
import { BrowserContext, Page } from '@playwright/test';

export class AuthHelpers {
  constructor(private context: BrowserContext) {}

  // Create authenticated session
  async loginAs(email: string, password: string = 'password123') {
    // Navigate to login page
    await this.context.newPage().then(async page => {
      await page.goto('/login');

      // Fill login form
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect or success message
      await page.waitForURL('**/dashboard');

      // Save authentication state
      await this.context.storageState({ path: 'test-auth.json' });
    });
  }

  // Create admin session
  async loginAsAdmin() {
    await this.loginAs('admin@udigitrentals.com', 'admin123');
  }

  // Create customer session
  async loginAsCustomer() {
    await this.loginAs('customer@example.com', 'customer123');
  }

  // Load saved authentication state
  async loadAuthState() {
    try {
      return await this.context.storageState({ path: 'test-auth.json' });
    } catch {
      return null;
    }
  }

  // Clear authentication state
  async clearAuthState() {
    try {
      await this.context.clearCookies();
    } catch (error) {
      console.warn('Failed to clear auth state:', error);
    }
  }

  // Check if user is authenticated
  async isAuthenticated(page: Page): Promise<boolean> {
    try {
      await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  // Get current user info
  async getCurrentUser(page: Page) {
    if (!(await this.isAuthenticated(page))) {
      return null;
    }

    return {
      name: await page.textContent('[data-testid="user-name"]'),
      email: await page.textContent('[data-testid="user-email"]'),
      role: await page.textContent('[data-testid="user-role"]'),
    };
  }
}

// Helper function to create auth helpers
export const createAuthHelpers = (context: BrowserContext) => new AuthHelpers(context);

// Predefined test users
export const testUsers = {
  admin: {
    email: 'admin@udigitrentals.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  },

  customer: {
    email: 'customer@example.com',
    password: 'customer123',
    name: 'John Customer',
    role: 'customer',
  },

  operator: {
    email: 'operator@udigitrentals.com',
    password: 'operator123',
    name: 'Jane Operator',
    role: 'operator',
  },
};

// Authentication test scenarios
export const authScenarios = {
  validLogin: async (page: Page, user = testUsers.customer) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard');
  },

  invalidLogin: async (page: Page) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await page.waitForSelector('text=Invalid credentials');
  },

  logout: async (page: Page) => {
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    await page.waitForURL('**/login');
  },

  accessProtectedRoute: async (page: Page) => {
    await page.goto('/dashboard');
    // Should redirect to login if not authenticated
    await page.waitForURL('**/login');
  },
};
