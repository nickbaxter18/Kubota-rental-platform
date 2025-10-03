import { expect, test } from '@playwright/test';

test.describe('U-Dig It Rentals - Complete Booking Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the booking page
    await page.goto('/book');
  });

  test('should display booking page with correct content', async ({ page }) => {
    // Check page title and header
    await expect(page.locator('h1')).toContainText('Book the Kubota SVL-75');
    await expect(page.locator('text=Instant Booking Available')).toBeVisible();

    // Check trust indicators
    await expect(page.locator('text=Secure Booking')).toBeVisible();
    await expect(page.locator('text=Instant Confirmation')).toBeVisible();
    await expect(page.locator('text=SSL Encrypted')).toBeVisible();
  });

  test('should complete full booking flow successfully', async ({ page }) => {
    // Step 1: Select dates
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');

    // Navigate to step 2
    await page.click('button:has-text("Next")');

    // Step 2: Enter delivery information
    await page.fill('input[name="deliveryAddress"]', '123 Main Street');
    await page.fill('input[name="deliveryCity"]', 'Saint John');

    // Navigate to step 3
    await page.click('button:has-text("Next")');

    // Step 3: Review and confirm booking
    await expect(page.locator('text=Booking Summary')).toBeVisible();
    await expect(page.locator('text=Pricing Breakdown')).toBeVisible();

    // Confirm booking
    await page.click('button:has-text("Confirm Booking")');

    // Step 4: Verify success page
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible();
    await expect(page.locator('text=Booking Number:')).toBeVisible();
    await expect(page.locator('text=Next Steps:')).toBeVisible();

    // Check next steps are displayed
    await expect(page.locator('text=Upload Certificate of Insurance')).toBeVisible();
    await expect(page.locator('text=Complete payment')).toBeVisible();
    await expect(page.locator('text=Sign rental agreement')).toBeVisible();
    await expect(page.locator('text=Receive equipment delivery')).toBeVisible();
  });

  test('should show validation errors for invalid dates', async ({ page }) => {
    // Try to proceed without selecting dates
    await page.click('button:has-text("Next")');

    // Check validation errors
    await expect(page.locator('text=Start date is required')).toBeVisible();
    await expect(page.locator('text=End date is required')).toBeVisible();
  });

  test('should show validation errors for end date before start date', async ({ page }) => {
    // Select invalid date range
    await page.fill('input[name="startDate"]', '2024-12-17');
    await page.fill('input[name="endDate"]', '2024-12-15');

    await page.click('button:has-text("Next")');

    // Check validation error
    await expect(page.locator('text=End date must be after start date')).toBeVisible();
  });

  test('should show validation errors for missing delivery information', async ({ page }) => {
    // Navigate to step 2
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');
    await page.click('button:has-text("Next")');

    // Try to proceed without filling delivery info
    await page.click('button:has-text("Next")');

    // Check validation errors
    await expect(page.locator('text=Delivery address is required')).toBeVisible();
    await expect(page.locator('text=City is required')).toBeVisible();
  });

  test('should allow navigation back to previous steps', async ({ page }) => {
    // Navigate to step 2
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');
    await page.click('button:has-text("Next")');

    // Navigate back to step 1
    await page.click('button:has-text("Previous")');

    // Verify we're back at step 1
    await expect(page.locator('text=Choose Rental Dates')).toBeVisible();
    await expect(page.locator('input[name="startDate"]')).toHaveValue('2024-12-15');
    await expect(page.locator('input[name="endDate"]')).toHaveValue('2024-12-17');
  });

  test('should display correct pricing calculation', async ({ page }) => {
    // Navigate through steps with valid data
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');
    await page.click('button:has-text("Next")');

    await page.fill('input[name="deliveryAddress"]', '123 Main Street');
    await page.fill('input[name="deliveryCity"]', 'Saint John');
    await page.click('button:has-text("Next")');

    // Check pricing breakdown
    await expect(page.locator('text=Daily Rate:')).toBeVisible();
    await expect(page.locator('text=$350.00')).toBeVisible();
    await expect(page.locator('text=Days:')).toBeVisible();
    await expect(page.locator('text=2')).toBeVisible(); // 2 days rental
    await expect(page.locator('text=Subtotal:')).toBeVisible();
    await expect(page.locator('text=$700.00')).toBeVisible();
    await expect(page.locator('text=Taxes (15%):')).toBeVisible();
    await expect(page.locator('text=$105.00')).toBeVisible();
    await expect(page.locator('text=Float Fee:')).toBeVisible();
    await expect(page.locator('text=$150.00')).toBeVisible(); // Delivery fee for Saint John
    await expect(page.locator('text=Total:')).toBeVisible();
    await expect(page.locator('text=$955.00')).toBeVisible(); // 700 + 105 + 150
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/book');

    // Check that mobile layout works
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Instant Booking Available')).toBeVisible();

    // Check that form elements are accessible on mobile
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');

    // Should be able to tap next button
    await page.click('button:has-text("Next")');

    // Check that step 2 is accessible
    await expect(page.locator('text=Delivery Information')).toBeVisible();
  });

  test('should handle different rental durations correctly', async ({ page }) => {
    // Test 1-day rental
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-16');
    await page.click('button:has-text("Next")');

    await page.fill('input[name="deliveryAddress"]', '123 Main Street');
    await page.fill('input[name="deliveryCity"]', 'Saint John');
    await page.click('button:has-text("Next")');

    // Check 1-day pricing
    await expect(page.locator('text=Days:')).toBeVisible();
    await expect(page.locator('text=1')).toBeVisible();
    await expect(page.locator('text=$350.00')).toBeVisible(); // Daily rate
    await expect(page.locator('text=$52.50')).toBeVisible(); // 15% tax
    await expect(page.locator('text=$552.50')).toBeVisible(); // Total with delivery
  });

  test('should handle booking errors gracefully', async ({ page }) => {
    // Mock a server error scenario by testing with invalid data that might cause server-side validation
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');
    await page.click('button:has-text("Next")');

    await page.fill('input[name="deliveryAddress"]', '123 Main Street');
    await page.fill('input[name="deliveryCity"]', 'Saint John');
    await page.click('button:has-text("Next")');

    // Intercept the booking request to simulate an error
    await page.route('**/api/bookings', async route => {
      await route.abort('failed');
    });

    await page.click('button:has-text("Confirm Booking")');

    // Should handle the error gracefully
    await expect(page.locator('text=Failed to create booking')).toBeVisible();
  });

  test('should clear validation errors when user starts typing', async ({ page }) => {
    // Trigger validation errors
    await page.click('button:has-text("Next")');

    await expect(page.locator('text=Start date is required')).toBeVisible();

    // Start typing in the field
    await page.fill('input[name="startDate"]', '2024-12-15');

    // Error should be cleared
    await expect(page.locator('text=Start date is required')).not.toBeVisible();
  });

  test('should display equipment information correctly', async ({ page }) => {
    // Check equipment details are displayed
    await expect(page.locator('text=Kubota SVL-75')).toBeVisible();
    await expect(page.locator('text=Compact Track Loader')).toBeVisible();
    await expect(page.locator('text=$350.00')).toBeVisible(); // Daily rate

    // Check equipment features
    await expect(page.locator('text=Turbocharged engine')).toBeVisible();
    await expect(page.locator('text=Hydraulic quick coupler')).toBeVisible();
    await expect(page.locator('text=Enclosed cab')).toBeVisible();
  });

  test('should handle keyboard navigation properly', async ({ page }) => {
    // Test keyboard navigation through the form
    await page.keyboard.press('Tab');
    await page.keyboard.type('2024-12-15');

    await page.keyboard.press('Tab');
    await page.keyboard.type('2024-12-17');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Should trigger Next button

    // Should navigate to step 2
    await expect(page.locator('text=Delivery Information')).toBeVisible();
  });

  test('should persist form data during step navigation', async ({ page }) => {
    // Fill step 1
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');

    // Navigate to step 2
    await page.click('button:has-text("Next")');

    // Fill step 2
    await page.fill('input[name="deliveryAddress"]', '123 Main Street');
    await page.fill('input[name="deliveryCity"]', 'Saint John');

    // Navigate to step 3
    await page.click('button:has-text("Next")');

    // Navigate back to step 2
    await page.click('button:has-text("Previous")');

    // Verify data is preserved
    await expect(page.locator('input[name="deliveryAddress"]')).toHaveValue('123 Main Street');
    await expect(page.locator('input[name="deliveryCity"]')).toHaveValue('Saint John');

    // Navigate back to step 1
    await page.click('button:has-text("Previous")');

    // Verify step 1 data is preserved
    await expect(page.locator('input[name="startDate"]')).toHaveValue('2024-12-15');
    await expect(page.locator('input[name="endDate"]')).toHaveValue('2024-12-17');
  });

  test('should show loading state during booking submission', async ({ page }) => {
    // Navigate through all steps
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');
    await page.click('button:has-text("Next")');

    await page.fill('input[name="deliveryAddress"]', '123 Main Street');
    await page.fill('input[name="deliveryCity"]', 'Saint John');
    await page.click('button:has-text("Next")');

    // Intercept the booking request to add a delay
    await page.route('**/api/bookings', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    // Submit booking
    await page.click('button:has-text("Confirm Booking")');

    // Should show loading state
    await expect(page.locator('text=Creating Booking...')).toBeVisible();
    await expect(page.locator('button[disabled]')).toBeVisible();

    // Should eventually show success
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible();
  });

  test('should handle network connectivity issues', async ({ page }) => {
    // Navigate through steps
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');
    await page.click('button:has-text("Next")');

    await page.fill('input[name="deliveryAddress"]', '123 Main Street');
    await page.fill('input[name="deliveryCity"]', 'Saint John');
    await page.click('button:has-text("Next")');

    // Simulate network failure
    await page.context().setOffline(true);

    await page.click('button:has-text("Confirm Booking")');

    // Should handle offline state gracefully
    await expect(page.locator('text=Network error')).toBeVisible();

    // Restore connection and retry
    await page.context().setOffline(false);
    await page.click('button:has-text("Try Again")');

    // Should eventually succeed
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible();
  });

  test('should validate minimum rental duration', async ({ page }) => {
    // Try to book for same day (assuming minimum is 1 day)
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-15');

    await page.click('button:has-text("Next")');

    // Should show minimum duration error
    await expect(page.locator('text=minimum rental period')).toBeVisible();
  });

  test('should validate maximum rental duration', async ({ page }) => {
    // Try to book for more than 1 year
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2025-12-20'); // Over 1 year

    await page.click('button:has-text("Next")');

    // Should show maximum duration error
    await expect(page.locator('text=Maximum rental period')).toBeVisible();
  });

  test('should handle date availability checking', async ({ page }) => {
    // Select dates that might be unavailable
    await page.fill('input[name="startDate"]', '2024-12-25');
    await page.fill('input[name="endDate"]', '2024-12-27');

    await page.click('button:has-text("Next")');

    await page.fill('input[name="deliveryAddress"]', '123 Main Street');
    await page.fill('input[name="deliveryCity"]', 'Saint John');
    await page.click('button:has-text("Next")');

    // Intercept booking request to simulate unavailability
    await page.route('**/api/bookings', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Equipment not available for selected dates'
        })
      });
    });

    await page.click('button:has-text("Confirm Booking")');

    // Should show availability error
    await expect(page.locator('text=Equipment not available for selected dates')).toBeVisible();
  });

  test('should display trust indicators and security features', async ({ page }) => {
    // Check for security badges and trust indicators
    await expect(page.locator('text=Secure Booking')).toBeVisible();
    await expect(page.locator('text=SSL Encrypted')).toBeVisible();
    await expect(page.locator('text=Instant Confirmation')).toBeVisible();

    // Check for contact information
    await expect(page.locator('text=24/7 Support')).toBeVisible();
    await expect(page.locator('text=Licensed & Insured')).toBeVisible();
  });

  test('should handle form submission with Enter key', async ({ page }) => {
    // Fill form using keyboard only
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');

    // Use Enter key instead of clicking Next
    await page.keyboard.press('Enter');

    // Should navigate to step 2
    await expect(page.locator('text=Delivery Information')).toBeVisible();
  });

  test('should show delivery fee information correctly', async ({ page }) => {
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');
    await page.click('button:has-text("Next")');

    // Check delivery fee information
    await expect(page.locator('text=Delivery Fee:')).toBeVisible();
    await expect(page.locator('text=$150 each way')).toBeVisible();
    await expect(page.locator('text=for service areas')).toBeVisible();
  });

  test('should handle postal code validation', async ({ page }) => {
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');
    await page.click('button:has-text("Next")');

    // Fill delivery information
    await page.fill('input[name="deliveryAddress"]', '123 Main Street');
    await page.fill('input[name="deliveryCity"]', 'Saint John');

    // Try with invalid postal code format
    await page.fill('input[name="postalCode"]', '12345'); // Invalid format

    await page.click('button:has-text("Next")');

    // Should show postal code validation if implemented
    // This test will need to be updated based on actual validation rules
  });
});
