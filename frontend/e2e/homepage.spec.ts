import { expect, test } from '@playwright/test';

test.describe('U-Dig It Rentals - Homepage E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage with correct branding', async ({ page }) => {
    // Check main heading
    await expect(page.locator('h1')).toContainText('U-Dig It Rentals');

    // Check tagline
    await expect(page.locator('text=Professional Equipment Rentals')).toBeVisible();

    // Check main CTA button
    await expect(page.locator('text=Book Now')).toBeVisible();
    await expect(page.locator('button:has-text("Book Now")')).toBeVisible();
  });

  test('should display equipment showcase', async ({ page }) => {
    // Check equipment information
    await expect(page.locator('text=Kubota SVL-75')).toBeVisible();
    await expect(page.locator('text=Compact Track Loader')).toBeVisible();
    await expect(page.locator('text=$350')).toBeVisible(); // Daily rate

    // Check equipment features
    await expect(page.locator('text=Turbocharged engine')).toBeVisible();
    await expect(page.locator('text=Hydraulic quick coupler')).toBeVisible();
    await expect(page.locator('text=Enclosed cab')).toBeVisible();
  });

  test('should display trust indicators on homepage', async ({ page }) => {
    // Check trust badges
    await expect(page.locator('text=Licensed & Insured')).toBeVisible();
    await expect(page.locator('text=24/7 Support')).toBeVisible();
    await expect(page.locator('text=Professional Service')).toBeVisible();
  });

  test('should navigate to booking page from homepage', async ({ page }) => {
    // Click the Book Now button
    await page.click('button:has-text("Book Now")');

    // Should navigate to booking page
    await expect(page).toHaveURL(/.*book/);
    await expect(page.locator('text=Book the Kubota SVL-75')).toBeVisible();
  });

  test('should display service area information', async ({ page }) => {
    // Check service area details
    await expect(page.locator('text=Saint John')).toBeVisible();
    await expect(page.locator('text=Rothesay')).toBeVisible();
    await expect(page.locator('text=Quispamsis')).toBeVisible();
    await expect(page.locator('text=Grand Bay-Westfield')).toBeVisible();
  });

  test('should display contact information', async ({ page }) => {
    // Check contact details
    await expect(page.locator('text=Phone:')).toBeVisible();
    await expect(page.locator('text=Email:')).toBeVisible();
    await expect(page.locator('text=Address:')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check mobile layout
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=U-Dig It Rentals')).toBeVisible();

    // Check that mobile navigation works
    await expect(page.locator('button:has-text("Book Now")')).toBeVisible();
  });

  test('should display insurance requirements', async ({ page }) => {
    // Check insurance information
    await expect(page.locator('text=Certificate of Insurance')).toBeVisible();
    await expect(page.locator('text=$2 Million Liability')).toBeVisible();
    await expect(page.locator('text=Equipment Coverage')).toBeVisible();
  });

  test('should display rental terms highlights', async ({ page }) => {
    // Check key rental terms
    await expect(page.locator('text=Instant Booking')).toBeVisible();
    await expect(page.locator('text=Secure Payment')).toBeVisible();
    await expect(page.locator('text=Professional Delivery')).toBeVisible();
  });

  test('should handle navigation to different sections', async ({ page }) => {
    // Check if navigation links exist and work
    const bookNowButton = page.locator('button:has-text("Book Now")');
    await expect(bookNowButton).toBeVisible();

    await bookNowButton.click();

    // Should navigate to booking page
    await expect(page).toHaveURL(/.*book/);
  });

  test('should display loading states properly', async ({ page }) => {
    // Intercept API calls to simulate loading
    await page.route('**/api/equipment', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/');

    // Should eventually load content
    await expect(page.locator('text=Kubota SVL-75')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Intercept API calls to simulate error
    await page.route('**/api/equipment', async route => {
      await route.abort('failed');
    });

    await page.goto('/');

    // Should show error message or fallback content
    await expect(page.locator('text=U-Dig It Rentals')).toBeVisible();
  });
});
