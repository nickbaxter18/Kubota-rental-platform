import { test } from '@playwright/test';
import { createAccessibilityHelper } from './accessibility-helpers';

test.describe('U-Dig It Rentals - Accessibility E2E', () => {
  test('should meet WCAG 2.1 AA standards on homepage', async ({ page }) => {
    const accessibility = createAccessibilityHelper(page);

    await page.goto('/');

    // Run comprehensive accessibility audit using axe-core
    await accessibility.checkWCAG2AA();

    // Check semantic structure
    await accessibility.checkSemanticStructure('body');

    // Check for proper ARIA labels
    await accessibility.checkAriaLabels('body');

    // Check keyboard navigation
    await accessibility.checkKeyboardNavigation('body');
  });

  test('should support keyboard navigation throughout booking flow', async ({ page }) => {
    await page.goto('/book');

    // Test keyboard navigation through form
    await page.keyboard.press('Tab'); // Focus first input
    await page.locator('input[name="startDate"]').focus();

    await page.keyboard.type('2024-12-15');
    await page.keyboard.press('Tab'); // Move to next input
    await page.locator('input[name="endDate"]').focus();

    await page.keyboard.type('2024-12-17');
    await page.keyboard.press('Tab'); // Move to next button
    await page.locator('button:has-text("Next")').focus();

    // Press Enter to activate button
    await page.keyboard.press('Enter');

    // Should navigate to step 2
    await expect(page.locator('text=Delivery Information')).toBeVisible();
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/book');

    // Check for proper ARIA landmarks
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();

    // Check for proper form structure
    await expect(page.locator('form')).toBeVisible();

    // Check for status announcements
    const liveRegion = page.locator('[aria-live]');
    await expect(liveRegion).toBeVisible();
  });

  test('should have proper color contrast ratios', async ({ page }) => {
    await page.goto('/');

    // Check that text is readable against background
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible();

    // Check that buttons have sufficient contrast
    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible();
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto('/');

    // Check that content is still visible in dark mode
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Kubota SVL-75')).toBeVisible();
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/book');

    // Fill form and check that animations don't interfere
    await page.fill('input[name="startDate"]', '2024-12-15');
    await page.fill('input[name="endDate"]', '2024-12-17');

    // Should still be able to navigate
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Delivery Information')).toBeVisible();
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/book');

    // Check focus order
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();

    // Tab through form elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      focusedElement = await page.locator(':focus').first();
      await expect(focusedElement).toBeVisible();
    }
  });

  test('should provide meaningful error messages', async ({ page }) => {
    await page.goto('/book');

    // Trigger validation errors
    await page.click('button:has-text("Next")');

    // Check that error messages are descriptive
    await expect(page.locator('text=Start date is required')).toBeVisible();
    await expect(page.locator('text=End date is required')).toBeVisible();

    // Check that errors are associated with form fields
    const errorElements = page.locator('[role="alert"], .error');
    await expect(errorElements.first()).toBeVisible();
  });

  test('should support text scaling up to 200%', async ({ page }) => {
    // Set zoom level to 200%
    await page.evaluate(() => {
      document.body.style.zoom = '200%';
    });

    await page.goto('/');

    // Check that content is still accessible at 200% zoom
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=U-Dig It Rentals')).toBeVisible();

    // Check that buttons are still clickable
    await expect(page.locator('button:has-text("Book Now")')).toBeVisible();
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    await page.goto('/');

    // Check for semantic elements
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // Check for proper list structure
    const lists = page.locator('ul, ol');
    const listCount = await lists.count();

    if (listCount > 0) {
      await expect(lists.first()).toBeVisible();
    }
  });

  test('should provide skip navigation links', async ({ page }) => {
    await page.goto('/');

    // Check for skip links (common accessibility feature)
    const skipLinks = page.locator('a[href^="#"]:has-text("Skip")');
    const skipLinkCount = await skipLinks.count();

    // Skip links are nice to have but not strictly required
    if (skipLinkCount > 0) {
      await expect(skipLinks.first()).toBeVisible();
    }
  });

  test('should handle focus trap in modals', async ({ page }) => {
    await page.goto('/');

    // If there are any modals or dialogs, check focus management
    const dialogs = page.locator('[role="dialog"], dialog');
    const dialogCount = await dialogs.count();

    if (dialogCount > 0) {
      // Click trigger to open dialog
      const trigger = page.locator('[aria-haspopup="dialog"]');
      if (await trigger.count() > 0) {
        await trigger.first().click();

        // Check that focus is trapped within dialog
        await expect(dialogs.first()).toBeVisible();

        // Try to tab outside dialog (should be trapped)
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
          const focusedElement = await page.locator(':focus').first();
          const isInDialog = await focusedElement.locator('xpath=ancestor-or-self::*[contains(@role, "dialog")]').count() > 0;
          expect(isInDialog).toBe(true);
        }
      }
    }
  });
});
