// Test data factories and cleanup utilities for Playwright tests

// Equipment test data
export const equipmentData = {
  kubotaSVL75: {
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
      '2024-12-17': true,
      '2024-12-18': true,
      '2024-12-19': true,
    },
  },

  kubotaKX040: {
    id: 'kubota-kx040',
    name: 'Kubota KX-040',
    type: 'Mini Excavator',
    dailyRate: 275,
    description: 'Versatile mini excavator ideal for tight spaces and precision work.',
    features: ['Zero tail swing', 'Hydraulic thumb', 'Quick attach coupler'],
    images: ['/equipment/kx040-1.jpg', '/equipment/kx040-2.jpg'],
    availability: {
      '2024-12-15': true,
      '2024-12-16': true,
      '2024-12-17': true,
      '2024-12-18': false,
      '2024-12-19': false,
    },
  },
};

// Customer test data
export const customerData = {
  johnDoe: {
    id: 'customer-123',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '555-0123',
    address: '123 Main Street',
    city: 'Saint John',
    postalCode: 'E2K 1A1',
    company: 'Doe Construction Ltd.',
  },

  janeSmith: {
    id: 'customer-456',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '555-0456',
    address: '456 Oak Avenue',
    city: 'Fredericton',
    postalCode: 'E3B 1A1',
    company: 'Smith Landscaping Inc.',
  },

  bobWilson: {
    id: 'customer-789',
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    phone: '555-0789',
    address: '789 Pine Road',
    city: 'Moncton',
    postalCode: 'E1C 1A1',
    company: 'Wilson Developments',
  },
};

// Booking test data
export const bookingData = {
  standardBooking: {
    id: 'booking-123',
    startDate: '2024-12-15',
    endDate: '2024-12-17',
    equipmentId: 'kubota-svl75',
    customerId: 'customer-123',
    deliveryAddress: '123 Main Street',
    deliveryCity: 'Saint John',
    status: 'confirmed',
    pricing: {
      dailyRate: 350,
      days: 2,
      subtotal: 700,
      taxes: 105,
      floatFee: 150,
      total: 955,
    },
  },

  oneDayBooking: {
    id: 'booking-456',
    startDate: '2024-12-18',
    endDate: '2024-12-19',
    equipmentId: 'kubota-kx040',
    customerId: 'customer-456',
    deliveryAddress: '456 Oak Avenue',
    deliveryCity: 'Fredericton',
    status: 'confirmed',
    pricing: {
      dailyRate: 275,
      days: 1,
      subtotal: 275,
      taxes: 41.25,
      floatFee: 125,
      total: 441.25,
    },
  },

  longTermBooking: {
    id: 'booking-789',
    startDate: '2024-12-20',
    endDate: '2024-12-30',
    equipmentId: 'kubota-svl75',
    customerId: 'customer-789',
    deliveryAddress: '789 Pine Road',
    deliveryCity: 'Moncton',
    status: 'confirmed',
    pricing: {
      dailyRate: 350,
      days: 10,
      subtotal: 3500,
      taxes: 525,
      floatFee: 200,
      total: 4225,
    },
  },
};

// Test data factory class
export class TestDataFactory {
  private createdBookings: string[] = [];
  private createdCustomers: string[] = [];

  // Create a booking with optional overrides
  createBooking(overrides = {}) {
    const baseBooking = { ...bookingData.standardBooking };
    const booking = {
      ...baseBooking,
      id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...overrides,
    };

    this.createdBookings.push(booking.id);
    return booking;
  }

  // Create a customer with optional overrides
  createCustomer(overrides = {}) {
    const customers = Object.values(customerData);
    const baseCustomer = customers[Math.floor(Math.random() * customers.length)];
    const customer = {
      ...baseCustomer,
      id: `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...overrides,
    };

    this.createdCustomers.push(customer.id);
    return customer;
  }

  // Create multiple bookings
  createBookings(count: number, overrides = {}) {
    return Array.from({ length: count }, () => this.createBooking(overrides));
  }

  // Create multiple customers
  createCustomers(count: number, overrides = {}) {
    return Array.from({ length: count }, () => this.createCustomer(overrides));
  }

  // Get all created booking IDs
  getCreatedBookingIds() {
    return [...this.createdBookings];
  }

  // Get all created customer IDs
  getCreatedCustomerIds() {
    return [...this.createdCustomers];
  }

  // Clear tracking arrays (but don't delete actual data)
  reset() {
    this.createdBookings = [];
    this.createdCustomers = [];
  }
}

// Cleanup utilities
export class TestCleanup {
  private factory: TestDataFactory;

  constructor(factory: TestDataFactory) {
    this.factory = factory;
  }

  // Clean up test data after tests
  async cleanup() {
    const bookingIds = this.factory.getCreatedBookingIds();
    const customerIds = this.factory.getCreatedCustomerIds();

    console.log(`🧹 Cleaning up ${bookingIds.length} bookings and ${customerIds.length} customers`);

    // In a real implementation, you would:
    // - Delete test bookings from the database
    // - Delete test customers from the database
    // - Clean up uploaded files
    // - Clear test emails from email service
    // - Reset external API states

    // For now, just reset the factory tracking
    this.factory.reset();
  }

  // Clean up specific booking
  async cleanupBooking(bookingId: string) {
    console.log(`🧹 Cleaning up booking ${bookingId}`);
    // Implementation would delete the specific booking
  }

  // Clean up specific customer
  async cleanupCustomer(customerId: string) {
    console.log(`🧹 Cleaning up customer ${customerId}`);
    // Implementation would delete the specific customer
  }
}

// Database seeding utilities
export class DatabaseSeeder {
  private factory: TestDataFactory;

  constructor(factory: TestDataFactory) {
    this.factory = factory;
  }

  // Seed equipment data
  async seedEquipment() {
    console.log('🌱 Seeding equipment data');
    // In a real implementation, this would insert equipment records
    return Object.values(equipmentData);
  }

  // Seed customer data
  async seedCustomers(count = 3) {
    console.log(`🌱 Seeding ${count} customers`);
    const customers = this.factory.createCustomers(count);
    // In a real implementation, this would insert customer records
    return customers;
  }

  // Seed booking data
  async seedBookings(count = 2) {
    console.log(`🌱 Seeding ${count} bookings`);
    const bookings = this.factory.createBookings(count);
    // In a real implementation, this would insert booking records
    return bookings;
  }

  // Seed complete test dataset
  async seedAll() {
    const equipment = await this.seedEquipment();
    const customers = await this.seedCustomers();
    const bookings = await this.seedBookings();

    return {
      equipment,
      customers,
      bookings,
    };
  }
}

// Helper functions for creating test data factories
export const createTestDataFactory = () => new TestDataFactory();
export const createTestCleanup = (factory: TestDataFactory) => new TestCleanup(factory);
export const createDatabaseSeeder = (factory: TestDataFactory) => new DatabaseSeeder(factory);

// Common test data scenarios
export const testDataScenarios = {
  withExistingCustomer: (factory: TestDataFactory) => {
    const customer = factory.createCustomer();
    const booking = factory.createBooking({ customerId: customer.id });
    return { customer, booking };
  },

  withMultipleBookings: (factory: TestDataFactory) => {
    const customer = factory.createCustomer();
    const bookings = factory.createBookings(3, { customerId: customer.id });
    return { customer, bookings };
  },

  withUnavailableEquipment: (factory: TestDataFactory) => {
    const booking = factory.createBooking({
      startDate: '2024-12-15',
      endDate: '2024-12-17',
      // This would conflict with existing availability
    });
    return booking;
  },
};
