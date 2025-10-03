import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Helper function to check accessibility
async function checkAccessibility(page: any) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter(
    (violation: any) => violation.impact === 'critical' || violation.impact === 'serious'
  );

  if (violations.length > 0) {
    const violationDetails = violations.map((v: any) => ({
      rule: v.id,
      description: v.description,
      impact: v.impact,
      elements: v.nodes.map((node: any) => ({
        html: node.html,
        target: node.target,
        failureSummary: node.failureSummary,
      })),
    }));

    throw new Error(
      `Accessibility violations found:\n${JSON.stringify(violationDetails, null, 2)}`
    );
  }

  return results;
}

// Define all pages to test for accessibility
const pages = [
  '/',
  '/book',
  '/getting-insurance',
  '/rider',
  '/terms',
  '/404',
  '/500'
];

// Test accessibility for all pages
pages.forEach(page => {
  test(`Accessibility: ${page}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const pageInstance = await context.newPage();

    try {
      await pageInstance.goto(page);

      // Wait for page to be fully loaded
      await pageInstance.waitForLoadState('networkidle');

      // Run accessibility checks
      await checkAccessibility(pageInstance);

      // Additional specific checks for booking page
      if (page === '/book') {
        // Check for form accessibility
        const form = pageInstance.locator('form');
        if (await form.isVisible()) {
          // Ensure form has proper labels
          const inputs = form.locator('input, select, textarea');
          const inputCount = await inputs.count();

          for (let i = 0; i < inputCount; i++) {
            const input = inputs.nth(i);
            const ariaLabel = await input.getAttribute('aria-label');
            const ariaLabelledBy = await input.getAttribute('aria-labelledby');
            const id = await input.getAttribute('id');

            if (id) {
              const label = pageInstance.locator(`label[for="${id}"]`);
              await expect(label.or(pageInstance.locator(`[aria-label*="${id}"]`))).toBeVisible();
            } else {
              await expect(ariaLabel || ariaLabelledBy).toBeTruthy();
            }
          }
        }
      }

      // Check for heading hierarchy
      const headings = pageInstance.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();

      if (headingCount > 0) {
        // Ensure there's at least one h1
        const h1Count = await pageInstance.locator('h1').count();
        expect(h1Count).toBeGreaterThan(0);

        // Check heading hierarchy doesn't skip levels
        const headingLevels: number[] = [];
        for (let i = 0; i < headingCount; i++) {
          const heading = headings.nth(i);
          const tagName = await heading.evaluate(el => el.tagName);
          const level = parseInt(tagName.replace('H', ''));
          headingLevels.push(level);
        }

        // Check that hierarchy doesn't skip levels (allowing for h1 -> h3 if h2 is missing but not recommended)
        for (let i = 1; i < headingLevels.length; i++) {
          const currentLevel = headingLevels[i];
          const previousLevel = headingLevels[i - 1];
          const skip = currentLevel - previousLevel;
          // Allow skipping but log warning for significant skips
          if (skip > 2) {
            console.warn(`Large heading level skip detected: H${previousLevel} -> H${currentLevel}`);
          }
        }
      }

      // Check for alt text on images
      const images = pageInstance.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        // Allow empty alt for decorative images, but ensure attribute exists
        expect(alt !== null).toBeTruthy();
      }

      // Check for proper link text
      const links = pageInstance.locator('a');
      const linkCount = await links.count();

      for (let i = 0; i < linkCount; i++) {
        const link = links.nth(i);
        const href = await link.getAttribute('href');
        const text = await link.textContent();

        if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          // External links should have descriptive text
          expect(text?.trim().length).toBeGreaterThan(1);
        }
      }

      // Check for proper button labeling
      const buttons = pageInstance.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const text = await button.textContent();

        // Button should have either text content or aria-label
        const hasContent = text?.trim().length > 0;
        const hasAriaLabel = ariaLabel && ariaLabel.trim().length > 0;

        expect(hasContent || hasAriaLabel).toBeTruthy();
      }

      // Check for proper focus management
      const focusableElements = pageInstance.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const focusableCount = await focusableElements.count();

      if (focusableCount > 0) {
        // Ensure focusable elements are keyboard accessible
        for (let i = 0; i < focusableCount; i++) {
          const element = focusableElements.nth(i);
          const tagName = await element.evaluate(el => el.tagName);

          if (tagName === 'BUTTON' || tagName === 'A') {
            // Buttons and links should be focusable
            const disabled = await element.getAttribute('disabled');
            const ariaHidden = await element.getAttribute('aria-hidden');

            if (!disabled && ariaHidden !== 'true') {
              await expect(element).toBeEnabled();
            }
          }
        }
      }

    } finally {
      await context.close();
    }
  });
});

// Test accessibility for dynamic content and interactions
test('Accessibility: Dynamic content and interactions', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    await page.goto('/');

    // Test modal/dialog accessibility if present
    const modalTriggers = page.locator('[data-modal-trigger], [aria-haspopup="dialog"]');
    const modalCount = await modalTriggers.count();

    if (modalCount > 0) {
      await modalTriggers.first().click();

      // Check if modal is properly announced
      await page.waitForSelector('[role="dialog"], [role="alertdialog"]');

      const modal = page.locator('[role="dialog"], [role="alertdialog"]').first();
      await expect(modal).toBeVisible();

      // Check for focus trap (focus should be within modal)
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement.locator('xpath=ancestor-or-self::*[contains(@role,"dialog")]')).toBeVisible();

      // Check for escape key handler
      await page.keyboard.press('Escape');
      // Modal should close or focus should move appropriately
    }

    // Test form interactions
    await page.goto('/book');

    const form = page.locator('form');
    if (await form.isVisible()) {
      // Test error handling
      const submitButton = form.locator('button[type="submit"], input[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Check for error announcements
        await page.waitForTimeout(1000);

        const errorElements = page.locator('[role="alert"], .error, [aria-invalid="true"]');
        const errorCount = await errorElements.count();

        if (errorCount > 0) {
          // Errors should be properly associated with form fields
          for (let i = 0; i < errorCount; i++) {
            const error = errorElements.nth(i);
            const errorId = await error.getAttribute('id');
            const ariaDescribedBy = await error.locator('xpath=../input | ../select | ../textarea').first().getAttribute('aria-describedby');

            if (errorId && ariaDescribedBy) {
              expect(ariaDescribedBy).toContain(errorId);
            }
          }
        }
      }
    }

  } finally {
    await context.close();
  }
});

// Test accessibility in different viewport sizes
test('Accessibility: Mobile viewport', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 } // iPhone size
  });
  const page = await context.newPage();

  try {
    await page.goto('/');
    await checkAccessibility(page);

    // Check touch target sizes (minimum 44px)
    const buttons = page.locator('button, a');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box && box.width > 0 && box.height > 0) {
        const size = Math.min(box.width, box.height);
        // Touch targets should be at least 44px
        expect(size).toBeGreaterThanOrEqual(44);
      }
    }

  } finally {
    await context.close();
  }
});
