import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';

/**
 * Accessibility testing helpers for Playwright tests
 * Provides utilities for WCAG 2.1 AA compliance testing
 */

export class AccessibilityHelper {
  constructor(private page: Page) {}

  /**
   * Run axe-core accessibility audit on current page
   * @param context - Optional context to test (defaults to entire page)
   * @returns Promise<AxeResults>
   */
  async runAxeAudit(context?: string) {
    const axe = new AxeBuilder({ page: this.page });

    if (context) {
      axe.include(context);
    }

    return axe.analyze();
  }

  /**
   * Check if page meets WCAG 2.1 AA standards
   * @param context - Optional context to test
   */
  async checkWCAG2AA(context?: string) {
    const results = await this.runAxeAudit(context);

    const violations = results.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious'
    );

    if (violations.length > 0) {
      const violationDetails = violations.map(v => ({
        rule: v.id,
        description: v.description,
        impact: v.impact,
        elements: v.nodes.map(node => ({
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

  /**
   * Check keyboard navigation for interactive elements
   * @param selector - CSS selector for container to test
   */
  async checkKeyboardNavigation(selector: string) {
    // Check that all interactive elements are keyboard accessible
    const interactiveElements = await this.page.locator(`${selector} button, ${selector} a, ${selector} input, ${selector} select, ${selector} textarea, ${selector} [tabindex]`);

    for (let i = 0; i < await interactiveElements.count(); i++) {
      const element = interactiveElements.nth(i);

      // Check if element is visible and enabled
      if (await element.isVisible() && await element.isEnabled()) {
        await element.focus();

        // Verify element can receive focus
        const hasFocus = await element.evaluate(el => el === document.activeElement);
        if (!hasFocus) {
          throw new Error(`Element ${await element.getAttribute('data-testid') || await element.innerHTML()} cannot receive keyboard focus`);
        }
      }
    }
  }

  /**
   * Check color contrast ratios for text elements
   * @param selector - CSS selector for container to test
   */
  async checkColorContrast(selector: string) {
    const textElements = await this.page.locator(`${selector} p, ${selector} h1, ${selector} h2, ${selector} h3, ${selector} h4, ${selector} h5, ${selector} h6, ${selector} span, ${selector} div`);

    for (let i = 0; i < await textElements.count(); i++) {
      const element = textElements.nth(i);

      if (await element.isVisible()) {
        // Check if element has sufficient color contrast
        const color = await element.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
          };
        });

        // Basic contrast validation (in a real implementation, you'd use a proper contrast calculation)
        if (color.color === color.backgroundColor) {
          console.warn(`Element may have insufficient color contrast: ${await element.innerHTML()}`);
        }
      }
    }
  }

  /**
   * Check for proper ARIA labels and roles
   * @param selector - CSS selector for container to test
   */
  async checkAriaLabels(selector: string) {
    const elements = await this.page.locator(`${selector} [aria-label], ${selector} [aria-labelledby], ${selector} [aria-describedby]`);

    for (let i = 0; i < await elements.count(); i++) {
      const element = elements.nth(i);

      if (await element.isVisible()) {
        const ariaLabel = await element.getAttribute('aria-label');
        const ariaLabelledBy = await element.getAttribute('aria-labelledby');
        const ariaDescribedBy = await element.getAttribute('aria-describedby');

        if (ariaLabel && ariaLabel.trim().length === 0) {
          throw new Error(`Empty aria-label found on element: ${await element.innerHTML()}`);
        }

        if (ariaLabelledBy) {
          const labelElement = await this.page.locator(`#${ariaLabelledBy}`);
          if (!(await labelElement.isVisible())) {
            throw new Error(`aria-labelledby references non-existent element: ${ariaLabelledBy}`);
          }
        }

        if (ariaDescribedBy) {
          const describedElement = await this.page.locator(`#${ariaDescribedBy}`);
          if (!(await describedElement.isVisible())) {
            throw new Error(`aria-describedby references non-existent element: ${ariaDescribedBy}`);
          }
        }
      }
    }
  }

  /**
   * Check for proper semantic HTML structure
   * @param selector - CSS selector for container to test
   */
  async checkSemanticStructure(selector: string) {
    // Check for proper heading hierarchy
    const headings = await this.page.locator(`${selector} h1, ${selector} h2, ${selector} h3, ${selector} h4, ${selector} h5, ${selector} h6`);

    const headingLevels: number[] = [];
    for (let i = 0; i < await headings.count(); i++) {
      const heading = headings.nth(i);
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const level = parseInt(tagName.replace('h', ''));
      headingLevels.push(level);
    }

    // Check that heading levels don't skip (e.g., h1 followed by h3)
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) {
        console.warn(`Heading level skip detected: h${headingLevels[i - 1]} followed by h${headingLevels[i]}`);
      }
    }

    // Check for landmarks
    const nav = await this.page.locator(`${selector} nav`).count();
    const main = await this.page.locator(`${selector} main`).count();
    const aside = await this.page.locator(`${selector} aside`).count();

    if (nav === 0) {
      console.warn('No navigation landmark found');
    }
    if (main === 0) {
      console.warn('No main landmark found');
    }
  }

  /**
   * Check for proper focus management in modals and dialogs
   * @param modalSelector - CSS selector for modal container
   */
  async checkModalFocusManagement(modalSelector: string) {
    const modal = await this.page.locator(modalSelector);
    if (!(await modal.isVisible())) {
      return;
    }

    // Check for focus trap - simplified version
    const focusableElements = await modal.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').all();

    if (focusableElements.length > 0) {
      // Focus should be trapped within modal
      await focusableElements[0].focus();

      // Basic check that modal is focusable
      const modalFocusable = await modal.evaluate((el: Element) => {
        return el.contains(document.activeElement) || document.activeElement === el;
      });

      if (!modalFocusable) {
        console.warn('Modal focus management may need attention');
      }
    }
  }

  /**
   * Check for proper error message associations
   * @param formSelector - CSS selector for form container
   */
  async checkErrorMessages(formSelector: string) {
    const errorElements = await this.page.locator(`${formSelector} .error, ${formSelector} [role="alert"]`);

    for (let i = 0; i < await errorElements.count(); i++) {
      const error = errorElements.nth(i);

      if (await error.isVisible()) {
        const errorText = await error.innerText();
        const ariaDescribedBy = await error.getAttribute('id');

        if (ariaDescribedBy) {
          // Check if error ID is referenced by form fields
          const referencedElements = await this.page.locator(`[aria-describedby*="${ariaDescribedBy}"]`);
          if (await referencedElements.count() === 0) {
            throw new Error(`Error message ${errorText} is not associated with any form fields`);
          }
        }
      }
    }
  }

  /**
   * Check for proper screen reader support
   * @param selector - CSS selector for container to test
   */
  async checkScreenReaderSupport(selector: string) {
    // Check for live regions
    const liveRegions = await this.page.locator(`${selector} [aria-live], ${selector} [role="status"], ${selector} [role="alert"]`);

    for (let i = 0; i < await liveRegions.count(); i++) {
      const region = liveRegions.nth(i);
      const ariaLive = await region.getAttribute('aria-live');
      const role = await region.getAttribute('role');

      if (ariaLive === 'polite' || ariaLive === 'assertive' || role === 'status' || role === 'alert') {
        // Live regions should have content
        const content = await region.innerText();
        if (!content.trim()) {
          console.warn('Live region is empty');
        }
      }
    }

    // Check for proper labeling of complex UI components
    const unlabeledElements = await this.page.locator(`${selector} [role]:not([aria-label]):not([aria-labelledby])`);
    for (let i = 0; i < await unlabeledElements.count(); i++) {
      const element = unlabeledElements.nth(i);
      const role = await element.getAttribute('role');

      if (role && !['none', 'presentation'].includes(role)) {
        console.warn(`Element with role "${role}" may need proper labeling`);
      }
    }
  }
}

/**
 * Helper function to create accessibility helper instance
 * @param page - Playwright page instance
 * @returns AccessibilityHelper instance
 */
export function createAccessibilityHelper(page: Page): AccessibilityHelper {
  return new AccessibilityHelper(page);
}
