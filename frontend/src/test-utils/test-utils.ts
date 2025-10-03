
// Test data factories
import { expect } from 'vitest';

// Custom matchers
export const customMatchers = {
  toBeValidDate: (received: string) => {
    const date = new Date(received);
    const isValid = !isNaN(date.getTime());
    return {
      message: () => `expected ${received} to be a valid date`,
      pass: isValid,
    };
  },

  toBeInDateRange: (received: string, startDate: string, endDate: string) => {
    const date = new Date(received);
    const start = new Date(startDate);
    const end = new Date(endDate);

    const isInRange = date >= start && date <= end;
    return {
      message: () => `expected ${received} to be between ${startDate} and ${endDate}`,
      pass: isInRange,
    };
  },
};

export const createMockBooking = (overrides: Record<string, unknown> = {}) => ({
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
});

export const createMockEquipment = (overrides = {}) => ({
  id: 'kubota-svl75',
  name: 'Kubota SVL-75',
  type: 'Compact Track Loader',
  dailyRate: 350,
  description: 'High-performance compact track loader perfect for construction and landscaping.',
  features: ['Turbocharged engine', 'Hydraulic quick coupler', 'Enclosed cab'],
  images: ['/equipment/svl75-1.jpg', '/equipment/svl75-2.jpg'],
  availability: {
    '2024-12-15': false,
    '2024-12-16': false,
    '2024-12-17': true
  },
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'customer',
  phone: '555-0123',
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Mock API responses
export const mockApiResponse = <T>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const mockApiError = (message: string, status = 400) => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return Promise.reject(error);
};

// Date helpers for testing
export const formatDateForInput = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

export const addDays = (date: Date | string, days: number) => {
  const result = new Date(typeof date === 'string' ? date : date);
  result.setDate(result.getDate() + days);
  return result;
};

// Extend Vitest matchers using module augmentation
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidDate(): T;
    toBeInDateRange(startDate: string, endDate: string): T;
  }
}

// Setup custom matchers
export const setupCustomMatchers = () => {
  expect.extend(customMatchers);
};
