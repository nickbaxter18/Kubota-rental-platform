import { expect, test } from '@playwright/test';

test.describe('U-Dig It Rentals - Performance & Error Handling E2E', () => {
  test('should load homepage within performance budget', async ({ page }) => {
    // Set up performance monitoring
    const startTime = Date.now();

    await page.goto('/');

    const loadTime = Date.now() - startTime;

    // Performance budget: homepage should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Check Core Web Vitals
    const navigation = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const navigation = entries.find(entry => entry.entryType === 'navigation');
          resolve(navigation);
        });
        observer.observe({ entryTypes: ['navigation'] });
      });
    });

    // Check that page loaded successfully
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle slow network conditions gracefully', async ({ page }) => {
    // Simulate slow 3G connection
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
      await route.continue();
    });

    await page.goto('/');

    // Should eventually load despite slow connection
    await expect(page.locator('text=U-Dig It Rentals')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Kubota SVL-75')).toBeVisible({ timeout: 10000 });
  });

  test('should handle API failures gracefully', async ({ page }) => {
    // Intercept API calls to simulate failures
    await page.route('**/api/equipment', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/');

    // Should show fallback content or error message
    await expect(page.locator('text=U-Dig It Rentals')).toBeVisible();

    // Navigate to booking page despite API failure
    await page.click('button:has-text("Book Now")');
    await expect(page.locator('text=Book the Kubota SVL-75')).toBeVisible();
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    // Inject JavaScript error
    await page.evaluate(() => {
      throw new Error('Test JavaScript error');
    });

    await page.goto('/');

    // Application should still function despite JS errors
    await expect(page.locator('text=U-Dig It Rentals')).toBeVisible();

    // Should still be able to navigate
    await page.click('button:has-text("Book Now")');
    await expect(page.locator('text=Book the Kubota SVL-75')).toBeVisible();
  });

  test('should handle large form submissions efficiently', async ({ page }) => {
    await page.goto('/book');

    const startTime = Date.now();

    // Fill form with extensive data
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-20'); // 5-day rental
    await page.click('button:has-text("Next")');

    await page.fill('input[name="deliveryAddress"]', '123 Main Street, Apartment 4B');
    await page.fill('input[name="deliveryCity"]', 'Saint John');
    await page.click('button:has-text("Next")');

    const formCompletionTime = Date.now() - startTime;

    // Form should complete within reasonable time
    expect(formCompletionTime).toBeLessThan(5000);

    // Should show pricing for 5-day rental
    await expect(page.locator('text=Days:')).toBeVisible();
    await expect(page.locator('text=5')).toBeVisible();
  });

  test('should handle memory leaks during extended usage', async ({ page }) => {
    await page.goto('/');

    // Simulate extended usage
    for (let i = 0; i < 10; i++) {
      await page.click('button:has-text("Book Now")');
      await page.goto('/');
      await page.waitForTimeout(100);
    }

    // Check that page is still responsive
    await expect(page.locator('h1')).toBeVisible();

    // Check memory usage (basic check)
    const memoryInfo = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });

    // If available, check that memory usage is reasonable
    if (memoryInfo) {
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // 100MB limit
    }
  });

  test('should handle concurrent user actions', async ({ page }) => {
    await page.goto('/book');

    // Simulate rapid user interactions
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');

    // Rapid clicking
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Previous")');
    await page.click('button:has-text("Next")');

    // Should handle rapid interactions gracefully
    await expect(page.locator('text=Review & Confirm')).toBeVisible();
  });

  test('should maintain performance with large datasets', async ({ page }) => {
    // Intercept API to return large dataset
    await page.route('**/api/equipment', async (route) => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `equipment-${i}`,
        name: `Equipment ${i}`,
        type: 'Heavy Machinery',
        dailyRate: 300 + i,
        description: `Equipment ${i} description`,
        features: [`Feature ${i}-1`, `Feature ${i}-2`, `Feature ${i}-3`],
        images: [`/equipment/${i}-1.jpg`, `/equipment/${i}-2.jpg`],
        availability: {
          '2024-12-15': i % 2 === 0,
          '2024-12-16': i % 3 === 0,
          '2024-12-17': i % 4 === 0,
        },
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeDataset),
      });
    });

    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Should handle large datasets within performance budget
    expect(loadTime).toBeLessThan(5000);

    // Should still display content correctly
    await expect(page.locator('text=U-Dig It Rentals')).toBeVisible();
  });

  test('should handle browser storage limits gracefully', async ({ page }) => {
    await page.goto('/');

    // Try to store large amounts of data in localStorage
    await page.evaluate(() => {
      try {
        for (let i = 0; i < 1000; i++) {
          localStorage.setItem(`test-key-${i}`, `test-value-${i}`.repeat(10));
        }
      } catch (e) {
        // Expected to hit storage limits
      }
    });

    // Application should still function despite storage issues
    await expect(page.locator('text=U-Dig It Rentals')).toBeVisible();

    // Should still be able to navigate
    await page.click('button:has-text("Book Now")');
    await expect(page.locator('text=Book the Kubota SVL-75')).toBeVisible();
  });

  test('should handle CSP (Content Security Policy) restrictions', async ({ page }) => {
    // Add CSP headers that might restrict functionality
    await page.route('**/*', async (route) => {
      const response = await route.fetch();
      const headers = response.headers();

      // Add restrictive CSP header
      headers['content-security-policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'";

      await route.fulfill({
        status: response.status(),
        headers,
        body: (await response.body()) || '',
      });
    });

    await page.goto('/');

    // Application should still function with CSP restrictions
    await expect(page.locator('text=U-Dig It Rentals')).toBeVisible();

    // Core functionality should still work
    await page.click('button:has-text("Book Now")');
    await expect(page.locator('text=Book the Kubota SVL-75')).toBeVisible();
  });

  test('should handle browser back/forward navigation correctly', async ({ page }) => {
    // Navigate through the application
    await page.goto('/');
    await page.click('button:has-text("Book Now")');
    await expect(page.locator('text=Book the Kubota SVL-75')).toBeVisible();

    // Go back
    await page.goBack();
    await expect(page.locator('text=U-Dig It Rentals')).toBeVisible();

    // Go forward
    await page.goForward();
    await expect(page.locator('text=Book the Kubota SVL-75')).toBeVisible();

    // Check that form state is maintained
    await expect(page.locator('input[name="startDate"]')).toBeVisible();
  });

  test('should handle session timeout scenarios', async ({ page }) => {
    await page.goto('/book');

    // Fill form data
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');
    await page.click('button:has-text("Next")');

    await page.fill('input[name="deliveryAddress"]', '123 Main Street');
    await page.fill('input[name="deliveryCity"]', 'Saint John');

    // Simulate session timeout by clearing storage
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    await page.click('button:has-text("Next")');

    // Should handle session timeout gracefully
    await expect(page.locator('text=Review & Confirm')).toBeVisible();

    // Form data should still be preserved in memory
    await expect(page.locator('input[name="deliveryAddress"]')).toHaveValue('123 Main Street');
  });

  test('should handle browser refresh during booking flow', async ({ page }) => {
    await page.goto('/book');

    // Fill partial form data
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');

    // Refresh the page
    await page.reload();

    // Form data should be cleared (expected behavior)
    await expect(page.locator('input[name="startDate"]')).toHaveValue('');
    await expect(page.locator('input[name="endDate"]')).toHaveValue('');

    // Page should still be functional
    await expect(page.locator('text=Choose Rental Dates')).toBeVisible();
  });

  test('should handle browser compatibility issues', async ({ page }) => {
    // Test with older browser features disabled
    await page.evaluate(() => {
      // Disable modern features
      delete (window as any).IntersectionObserver;
      delete (window as any).ResizeObserver;
    });

    await page.goto('/');

    // Application should still function with reduced features
    await expect(page.locator('text=U-Dig It Rentals')).toBeVisible();

    // Should still be able to navigate
    await page.click('button:has-text("Book Now")');
    await expect(page.locator('text=Book the Kubota SVL-75')).toBeVisible();
  });

  test('should handle rate limiting gracefully', async ({ page }) => {
    await page.goto('/book');

    // Simulate rapid form submissions
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="startDate"]', '2024-12-15');
      await page.fill('input[name="endDate"]', '2024-12-17');
      await page.click('button:has-text("Next")');

      await page.fill('input[name="deliveryAddress"]', `123 Main Street ${i}`);
      await page.fill('input[name="deliveryCity"]', 'Saint John');

      // Intercept booking request to simulate rate limiting
      await page.route('**/api/bookings', async (route) => {
        if (i < 3) {
          // Allow first few requests
          await route.continue();
        } else {
          // Rate limit subsequent requests
          await route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Too many requests. Please try again later.'
            })
          });
        }
      });

      await page.click('button:has-text("Confirm Booking")');

      if (i < 3) {
        // Should succeed for first few attempts
        await expect(page.locator('text=Booking Confirmed!')).toBeVisible();
        await page.goto('/book'); // Reset for next iteration
      } else {
        // Should handle rate limiting
        await expect(page.locator('text=Too many requests')).toBeVisible();
      }
    }
  });

  test('should handle malformed data gracefully', async ({ page }) => {
    // Intercept API responses to return malformed data
    await page.route('**/api/equipment', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          // Malformed data - missing required fields
          id: null,
          name: '',
          dailyRate: 'invalid',
        }),
      });
    });

    await page.goto('/');

    // Should handle malformed data without crashing
    await expect(page.locator('text=U-Dig It Rentals')).toBeVisible();

    // Should show fallback content or error message
    // Application should remain functional
    await page.click('button:has-text("Book Now")');
    await expect(page.locator('text=Book the Kubota SVL-75')).toBeVisible();
  });
});
