#!/usr/bin/env node

/**
 * Factory Relationships Verification Script
 *
 * Tests the enhanced test factory system to ensure all relationships work correctly
 */

import { factory, scenarioBuilder } from '../backend/src/test/factories/index.js';

class FactoryVerificationSystem {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * Record test result
   */
  recordTest(testName, passed, error = null, duration = 0) {
    this.results.tests.push({
      name: testName,
      passed,
      error: error?.message || null,
      duration
    });

    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
  }

  /**
   * Test basic factory creation
   */
  async testBasicFactoryCreation() {
    const startTime = Date.now();

    try {
      console.log('🧪 Testing basic factory creation...');

      // Test individual factory creation
      const user = await factory.users.create();
      const equipment = await factory.equipment.create();
      const booking = await factory.bookings.create();

      // Verify entities have required fields
      if (!user.id || !user.email) {
        throw new Error('User factory missing required fields');
      }

      if (!equipment.id || !equipment.unitId) {
        throw new Error('Equipment factory missing required fields');
      }

      if (!booking.id || !booking.bookingNumber) {
        throw new Error('Booking factory missing required fields');
      }

      console.log('✅ Basic factory creation test passed');
      this.recordTest('Basic Factory Creation', true, null, Date.now() - startTime);
    } catch (error) {
      console.error('❌ Basic factory creation test failed:', error.message);
      this.recordTest('Basic Factory Creation', false, error, Date.now() - startTime);
    }
  }

  /**
   * Test factory relationships
   */
  async testFactoryRelationships() {
    const startTime = Date.now();

    try {
      console.log('🧪 Testing factory relationships...');

      // Test user with bookings relationship
      const { user, bookings } = await factory.createUserWithBookings(2);

      if (!user.id) {
        throw new Error('User not created in relationship test');
      }

      if (bookings.length !== 2) {
        throw new Error(`Expected 2 bookings, got ${bookings.length}`);
      }

      // Verify all bookings reference the user
      bookings.forEach(booking => {
        if (booking.customerId !== user.id) {
          throw new Error('Booking customerId does not match user id');
        }
      });

      console.log('✅ Factory relationships test passed');
      this.recordTest('Factory Relationships', true, null, Date.now() - startTime);
    } catch (error) {
      console.error('❌ Factory relationships test failed:', error.message);
      this.recordTest('Factory Relationships', false, error, Date.now() - startTime);
    }
  }

  /**
   * Test complex scenario creation
   */
  async testComplexScenarioCreation() {
    const startTime = Date.now();

    try {
      console.log('🧪 Testing complex scenario creation...');

      const scenario = await factory.createBookingWithRelatedEntities();

      // Verify all entities are created
      if (!scenario.user?.id) {
        throw new Error('User not created in complex scenario');
      }

      if (!scenario.equipment?.id) {
        throw new Error('Equipment not created in complex scenario');
      }

      if (!scenario.booking?.id) {
        throw new Error('Booking not created in complex scenario');
      }

      if (!scenario.contract?.id) {
        throw new Error('Contract not created in complex scenario');
      }

      if (!scenario.payment?.id) {
        throw new Error('Payment not created in complex scenario');
      }

      if (!scenario.insuranceDocument?.id) {
        throw new Error('Insurance document not created in complex scenario');
      }

      // Verify relationships
      if (scenario.booking.customerId !== scenario.user.id) {
        throw new Error('Booking does not reference correct user');
      }

      if (scenario.booking.equipmentId !== scenario.equipment.id) {
        throw new Error('Booking does not reference correct equipment');
      }

      if (scenario.contract.bookingId !== scenario.booking.id) {
        throw new Error('Contract does not reference correct booking');
      }

      if (scenario.payment.bookingId !== scenario.booking.id) {
        throw new Error('Payment does not reference correct booking');
      }

      if (scenario.insuranceDocument.bookingId !== scenario.booking.id) {
        throw new Error('Insurance document does not reference correct booking');
      }

      console.log('✅ Complex scenario creation test passed');
      this.recordTest('Complex Scenario Creation', true, null, Date.now() - startTime);
    } catch (error) {
      console.error('❌ Complex scenario creation test failed:', error.message);
      this.recordTest('Complex Scenario Creation', false, error, Date.now() - startTime);
    }
  }

  /**
   * Test GDPR compliance
   */
  async testGDPRCompliance() {
    const startTime = Date.now();

    try {
      console.log('🧪 Testing GDPR compliance...');

      // Clear any existing data
      factory.gdprGenerator.clear();

      // Generate multiple users
      const users = [];
      for (let i = 0; i < 5; i++) {
        const userData = factory.gdprGenerator.generatePersonalInfo();
        users.push(userData);
      }

      // Verify all emails are unique and GDPR-compliant
      const emails = users.map(u => u.email);
      const uniqueEmails = new Set(emails);

      if (uniqueEmails.size !== emails.length) {
        throw new Error('Duplicate emails generated - GDPR compliance violated');
      }

      // Verify email format
      emails.forEach(email => {
        if (!email.endsWith('@test.local')) {
          throw new Error(`Invalid GDPR email format: ${email}`);
        }
      });

      // Verify phone format
      const phones = users.map(u => u.phone);
      phones.forEach(phone => {
        if (!phone.startsWith('+1-')) {
          throw new Error(`Invalid phone format: ${phone}`);
        }
      });

      console.log('✅ GDPR compliance test passed');
      this.recordTest('GDPR Compliance', true, null, Date.now() - startTime);
    } catch (error) {
      console.error('❌ GDPR compliance test failed:', error.message);
      this.recordTest('GDPR Compliance', false, error, Date.now() - startTime);
    }
  }

  /**
   * Test scenario builders
   */
  async testScenarioBuilders() {
    const startTime = Date.now();

    try {
      console.log('🧪 Testing scenario builders...');

      // Test booking flow scenario
      const bookingScenario = await scenarioBuilder.createBookingFlowScenario();

      if (!bookingScenario.customer?.id) {
        throw new Error('Customer not created in booking scenario');
      }

      if (!bookingScenario.equipment?.id) {
        throw new Error('Equipment not created in booking scenario');
      }

      if (!bookingScenario.booking?.id) {
        throw new Error('Booking not created in booking scenario');
      }

      if (!bookingScenario.contract?.id) {
        throw new Error('Contract not created in booking scenario');
      }

      if (!bookingScenario.payment?.id) {
        throw new Error('Payment not created in booking scenario');
      }

      // Test payment failure scenario
      const failureScenario = await scenarioBuilder.createPaymentFailureScenario();

      if (!failureScenario.customer?.id) {
        throw new Error('Customer not created in failure scenario');
      }

      if (!failureScenario.booking?.id) {
        throw new Error('Booking not created in failure scenario');
      }

      if (!failureScenario.failedPayment?.id) {
        throw new Error('Failed payment not created in failure scenario');
      }

      if (failureScenario.failedPayment.status !== 'failed') {
        throw new Error('Payment status not set to failed');
      }

      console.log('✅ Scenario builders test passed');
      this.recordTest('Scenario Builders', true, null, Date.now() - startTime);
    } catch (error) {
      console.error('❌ Scenario builders test failed:', error.message);
      this.recordTest('Scenario Builders', false, error, Date.now() - startTime);
    }
  }

  /**
   * Test factory context management
   */
  async testFactoryContextManagement() {
    const startTime = Date.now();

    try {
      console.log('🧪 Testing factory context management...');

      // Test context setting
      const mockContext = {
        dataSource: {},
        cleanup: async () => {}
      };

      factory.setContext(mockContext);

      if (factory.getContext() !== mockContext) {
        throw new Error('Factory context not set correctly');
      }

      // Test context propagation to individual factories
      if (factory.users.getContext() !== mockContext) {
        throw new Error('Context not propagated to user factory');
      }

      if (factory.equipment.getContext() !== mockContext) {
        throw new Error('Context not propagated to equipment factory');
      }

      console.log('✅ Factory context management test passed');
      this.recordTest('Factory Context Management', true, null, Date.now() - startTime);
    } catch (error) {
      console.error('❌ Factory context management test failed:', error.message);
      this.recordTest('Factory Context Management', false, error, Date.now() - startTime);
    }
  }

  /**
   * Test complete booking scenario
   */
  async testCompleteBookingScenario() {
    const startTime = Date.now();

    try {
      console.log('🧪 Testing complete booking scenario...');

      const scenario = await factory.createCompleteBookingScenario({
        user: { role: 'customer' },
        equipment: { status: 'available' },
        booking: { status: 'confirmed' }
      });

      // Verify all entities exist and are properly linked
      if (!scenario.user?.id) {
        throw new Error('User not created in complete scenario');
      }

      if (!scenario.equipment?.id) {
        throw new Error('Equipment not created in complete scenario');
      }

      if (!scenario.booking?.id) {
        throw new Error('Booking not created in complete scenario');
      }

      if (!scenario.contract?.id) {
        throw new Error('Contract not created in complete scenario');
      }

      if (!scenario.payment?.id) {
        throw new Error('Payment not created in complete scenario');
      }

      if (!scenario.insuranceDocument?.id) {
        throw new Error('Insurance document not created in complete scenario');
      }

      // Verify role override worked
      if (scenario.user.role !== 'customer') {
        throw new Error('User role override not applied');
      }

      // Verify status override worked
      if (scenario.equipment.status !== 'available') {
        throw new Error('Equipment status override not applied');
      }

      if (scenario.booking.status !== 'confirmed') {
        throw new Error('Booking status override not applied');
      }

      console.log('✅ Complete booking scenario test passed');
      this.recordTest('Complete Booking Scenario', true, null, Date.now() - startTime);
    } catch (error) {
      console.error('❌ Complete booking scenario test failed:', error.message);
      this.recordTest('Complete Booking Scenario', false, error, Date.now() - startTime);
    }
  }

  /**
   * Run all factory tests
   */
  async runAllTests() {
    console.log('🚀 Starting Factory Relationships Verification...\n');

    await this.testBasicFactoryCreation();
    await this.testFactoryRelationships();
    await this.testComplexScenarioCreation();
    await this.testGDPRCompliance();
    await this.testScenarioBuilders();
    await this.testFactoryContextManagement();
    await this.testCompleteBookingScenario();

    this.displayResults();
    return this.results;
  }

  /**
   * Display test results
   */
  displayResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🏭 FACTORY RELATIONSHIPS VERIFICATION RESULTS');
    console.log('='.repeat(60));

    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(2)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.tests.filter(t => !t.passed).forEach(test => {
        console.log(`  • ${test.name}: ${test.error}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new FactoryVerificationSystem();
  verifier.runAllTests().then(() => {
    process.exit(verifier.results.failed > 0 ? 1 : 0);
  });
}

export default FactoryVerificationSystem;
