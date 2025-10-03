import { Page, expect } from '@playwright/test';

/**
 * Visual regression testing helpers for Playwright tests
 * Provides utilities for snapshot testing and visual comparison
 */

export class VisualRegressionHelper {
  constructor(private page: Page) {}

  /**
   * Take a screenshot and compare with baseline
   * @param name - Name of the screenshot for comparison
   * @param options - Screenshot options
   */
  async compareScreenshot(name: string, options?: { fullPage?: boolean; clip?: any }) {
    const screenshot = await this.page.screenshot({
      fullPage: options?.fullPage ?? true,
      ...options,
    });

    expect(screenshot).toMatchSnapshot(`${name}.png`);
  }

  /**
   * Take screenshot of specific element
   * @param selector - CSS selector for element to screenshot
   * @param name - Name of the screenshot for comparison
   */
  async compareElementScreenshot(selector: string, name: string) {
    const element = await this.page.locator(selector);
    await expect(element).toBeVisible();

    await expect(element).toHaveScreenshot(`${name}.png`);
  }

  /**
   * Take screenshot in different viewport sizes
   * @param name - Base name for screenshots
   * @param viewports - Array of viewport configurations
   */
  async compareResponsiveScreenshots(name: string, viewports: Array<{ width: number; height: number; name: string }>) {
    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.compareScreenshot(`${name}-${viewport.name}`, { fullPage: true });
    }
  }

  /**
   * Take screenshot of modal or dialog
   * @param modalSelector - CSS selector for modal container
   * @param name - Name of the screenshot for comparison
   */
  async compareModalScreenshot(modalSelector: string, name: string) {
    const modal = await this.page.locator(modalSelector);
    await expect(modal).toBeVisible();

    // Wait for modal animation to complete
    await this.page.waitForTimeout(500);

    await expect(modal).toHaveScreenshot(`${name}.png`);
  }

  /**
   * Take screenshot of form with different states
   * @param formSelector - CSS selector for form container
   * @param name - Base name for screenshots
   * @param states - Array of form states to capture
   */
  async compareFormStates(formSelector: string, name: string, states: string[]) {
    for (const state of states) {
      // Reset form to specific state if needed
      await this.page.reload(); // Simple approach - reset form state

      if (state === 'empty') {
        // Form should be empty
      } else if (state === 'filled') {
        // Fill form fields
        await this.fillTestData(formSelector);
      } else if (state === 'errors') {
        // Trigger validation errors
        await this.triggerValidationErrors(formSelector);
      }

      await this.compareElementScreenshot(formSelector, `${name}-${state}`);
    }
  }

  /**
   * Take screenshot of loading states
   * @param name - Name of the screenshot for comparison
   */
  async compareLoadingState(name: string) {
    // Wait for loading indicators to appear
    await this.page.waitForSelector('[data-loading="true"], .loading, .spinner', { timeout: 5000 });

    await this.compareScreenshot(`${name}-loading`);
  }

  /**
   * Take screenshot of error states
   * @param name - Name of the screenshot for comparison
   */
  async compareErrorState(name: string) {
    // Wait for error indicators to appear
    await this.page.waitForSelector('[data-error="true"], .error, .alert', { timeout: 5000 });

    await this.compareScreenshot(`${name}-error`);
  }

  /**
   * Take screenshot of empty states
   * @param name - Name of the screenshot for comparison
   */
  async compareEmptyState(name: string) {
    // Wait for empty state indicators
    await this.page.waitForSelector('[data-empty="true"], .empty-state', { timeout: 5000 });

    await this.compareScreenshot(`${name}-empty`);
  }

  /**
   * Take screenshot with hover effects
   * @param selector - CSS selector for element to hover
   * @param name - Name of the screenshot for comparison
   */
  async compareHoverState(selector: string, name: string) {
    const element = await this.page.locator(selector);
    await element.hover();

    // Wait for hover effects to apply
    await this.page.waitForTimeout(300);

    await this.compareElementScreenshot(selector, `${name}-hover`);
  }

  /**
   * Take screenshot with focus effects
   * @param selector - CSS selector for element to focus
   * @param name - Name of the screenshot for comparison
   */
  async compareFocusState(selector: string, name: string) {
    const element = await this.page.locator(selector);
    await element.focus();

    // Wait for focus effects to apply
    await this.page.waitForTimeout(300);

    await this.compareElementScreenshot(selector, `${name}-focus`);
  }

  /**
   * Take screenshot of component in different themes
   * @param name - Base name for screenshots
   * @param themes - Array of theme classes or data attributes
   */
  async compareThemeVariations(name: string, themes: Array<{ name: string; selector: string }>) {
    for (const theme of themes) {
      // Apply theme
      if (theme.selector.startsWith('[data-theme')) {
        await this.page.evaluate((themeSelector) => {
          document.documentElement.setAttribute('data-theme', themeSelector.replace('[data-theme="', '').replace('"]', ''));
        }, theme.selector);
      } else {
        await this.page.addStyleTag({ content: `body { ${theme.selector} }` });
      }

      await this.page.waitForTimeout(500); // Wait for theme to apply

      await this.compareScreenshot(`${name}-${theme.name}`);
    }
  }

  /**
   * Helper method to fill form with test data
   * @param formSelector - CSS selector for form container
   */
  private async fillTestData(formSelector: string) {
    const inputs = await this.page.locator(`${formSelector} input, ${formSelector} textarea, ${formSelector} select`);

    for (let i = 0; i < await inputs.count(); i++) {
      const input = inputs.nth(i);
      const type = await input.getAttribute('type');
      const tagName = await input.evaluate(el => el.tagName.toLowerCase());

      if (tagName === 'select') {
        // Select first option for select elements
        await input.selectOption({ index: 1 });
      } else if (type === 'checkbox') {
        await input.check();
      } else if (type === 'radio') {
        await input.check();
      } else {
        // Fill text inputs with test data
        await input.fill(`Test data ${i + 1}`);
      }
    }
  }

  /**
   * Helper method to trigger validation errors
   * @param formSelector - CSS selector for form container
   */
  private async triggerValidationErrors(formSelector: string) {
    // Submit form without filling required fields
    const submitButton = await this.page.locator(`${formSelector} button[type="submit"], ${formSelector} input[type="submit"]`);
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await this.page.waitForTimeout(500); // Wait for validation to trigger
    }
  }

  /**
   * Take screenshot of specific component states
   * @param componentSelector - CSS selector for component
   * @param states - Array of states to capture
   * @param baseName - Base name for screenshots
   */
  async compareComponentStates(componentSelector: string, states: string[], baseName: string) {
    for (const state of states) {
      // Apply state-specific styling or trigger state
      if (state === 'disabled') {
        await this.page.addStyleTag({
          content: `${componentSelector} { opacity: 0.5; pointer-events: none; }`
        });
      } else if (state === 'active') {
        await this.page.locator(componentSelector).click();
      }

      await this.page.waitForTimeout(300);
      await this.compareElementScreenshot(componentSelector, `${baseName}-${state}`);
    }
  }

  /**
   * Take screenshot with different content densities
   * @param name - Base name for screenshots
   * @param densities - Array of content density configurations
   */
  async compareContentDensity(name: string, densities: Array<{ name: string; content: string }>) {
    for (const density of densities) {
      // This would require modifying the page content - simplified for demo
      await this.compareScreenshot(`${name}-${density.name}`);
    }
  }
}

/**
 * Helper function to create visual regression helper instance
 * @param page - Playwright page instance
 * @returns VisualRegressionHelper instance
 */
export function createVisualRegressionHelper(page: Page): VisualRegressionHelper {
  return new VisualRegressionHelper(page);
}

/**
 * Common viewport configurations for responsive testing
 */
export const COMMON_VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'mobile' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  desktop: { width: 1280, height: 720, name: 'desktop' },
  desktopLarge: { width: 1920, height: 1080, name: 'desktop-large' },
};

/**
 * Common form states for testing
 */
export const FORM_STATES = ['empty', 'filled', 'errors'];

/**
 * Common component states for testing
 */
export const COMPONENT_STATES = ['default', 'hover', 'focus', 'active', 'disabled'];
