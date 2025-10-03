import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * These tests ensure UI components don't have unintended visual changes
 */

// Test homepage visual consistency
test.describe('Homepage Visual Regression', () => {
  test('homepage should match baseline', async ({ page }) => {
    await page.goto('/');

    // Wait for all content to load
    await page.waitForLoadState('networkidle');

    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
    });
  });

  test('homepage hero section should match baseline', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot specific hero section
    const heroSection = page.locator('[data-testid="hero-section"], main > section:first-child').first();
    await expect(heroSection).toBeVisible();

    await expect(heroSection).toHaveScreenshot('homepage-hero.png', {
      animations: 'disabled',
    });
  });

  test('homepage equipment showcase should match baseline', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for equipment showcase to load
    await page.waitForSelector('[data-testid="equipment-showcase"], .equipment-grid, .showcase');

    const showcase = page.locator('[data-testid="equipment-showcase"], .equipment-grid, .showcase').first();
    await expect(showcase).toBeVisible();

    await expect(showcase).toHaveScreenshot('homepage-equipment-showcase.png');
  });
});

// Test booking flow visual consistency
test.describe('Booking Flow Visual Regression', () => {
  test('booking page should match baseline', async ({ page }) => {
    await page.goto('/book');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('booking-page-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('booking form should match baseline', async ({ page }) => {
    await page.goto('/book');
    await page.waitForLoadState('networkidle');

    // Wait for form to be fully rendered
    await page.waitForSelector('form');

    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    await expect(form).toHaveScreenshot('booking-form.png', {
      animations: 'disabled',
    });
  });

  test('equipment selection should match baseline', async ({ page }) => {
    await page.goto('/book');
    await page.waitForLoadState('networkidle');

    // Look for equipment selection UI
    const equipmentSelector = page.locator('[data-testid="equipment-selector"], .equipment-list, .equipment-cards').first();

    if (await equipmentSelector.isVisible()) {
      await expect(equipmentSelector).toHaveScreenshot('equipment-selection.png');
    }
  });
});

// Test responsive design visual consistency
test.describe('Responsive Design Visual Regression', () => {
  const viewports = [
    { name: 'mobile-small', width: 375, height: 667 },
    { name: 'mobile-large', width: 414, height: 896 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop-small', width: 1024, height: 768 },
    { name: 'desktop-large', width: 1920, height: 1080 },
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`homepage responsive - ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(`homepage-responsive-${name}.png`, {
        animations: 'disabled',
        caret: 'hide',
      });
    });
  });
});

// Test component states visual consistency
test.describe('Component States Visual Regression', () => {
  test('buttons in different states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test button hover states
    const buttons = page.locator('button').first();
    if (await buttons.isVisible()) {
      await buttons.hover();
      await page.waitForTimeout(100);

      await expect(buttons).toHaveScreenshot('button-hover-state.png');
    }
  });

  test('form validation states', async ({ page }) => {
    await page.goto('/book');
    await page.waitForLoadState('networkidle');

    const form = page.locator('form').first();
    if (await form.isVisible()) {
      // Try to submit empty form to trigger validation
      const submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(500);

        // Screenshot form with validation errors
        await expect(form).toHaveScreenshot('form-validation-errors.png');
      }
    }
  });

  test('loading states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for loading indicators
    const loadingElements = page.locator('[data-testid="loading"], .loading, .spinner, [aria-busy="true"]');

    if (await loadingElements.count() > 0) {
      await expect(loadingElements.first()).toHaveScreenshot('loading-state.png');
    }
  });
});

// Test theme variations
test.describe('Theme Visual Regression', () => {
  test('dark mode theme', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to find dark mode toggle
    const darkModeToggle = page.locator('[data-testid="theme-toggle"], [aria-label*="dark"], [aria-label*="theme"]').first();

    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
        animations: 'disabled',
      });
    }
  });
});

// Test error states visual consistency
test.describe('Error States Visual Regression', () => {
  test('404 page should match baseline', async ({ page }) => {
    await page.goto('/404');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('404-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('500 page should match baseline', async ({ page }) => {
    await page.goto('/500');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('500-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('network error state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Simulate network error by going offline
    await page.context().setOffline(true);
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('network-error-state.png');
  });
});

// Test dynamic content visual consistency
test.describe('Dynamic Content Visual Regression', () => {
  test('toast notifications', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for toast trigger or simulate toast
    const toastTriggers = page.locator('[data-testid="toast-trigger"], [aria-label*="notification"]').first();

    if (await toastTriggers.isVisible()) {
      await toastTriggers.click();
      await page.waitForTimeout(300);

      // Screenshot with toast visible
      await expect(page).toHaveScreenshot('with-toast-notification.png');
    }
  });

  test('modal dialogs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for modal triggers
    const modalTriggers = page.locator('[data-modal-trigger], [aria-haspopup="dialog"], [data-testid*="modal"]').first();

    if (await modalTriggers.isVisible()) {
      await modalTriggers.click();
      await page.waitForTimeout(300);

      // Wait for modal to be fully visible
      await page.waitForSelector('[role="dialog"], [role="alertdialog"], .modal, .dialog');

      const modal = page.locator('[role="dialog"], [role="alertdialog"], .modal, .dialog').first();
      await expect(modal).toBeVisible();

      await expect(modal).toHaveScreenshot('modal-dialog.png');
    }
  });
});

// Test form interactions visual consistency
test.describe('Form Interactions Visual Regression', () => {
  test('focused form elements', async ({ page }) => {
    await page.goto('/book');
    await page.waitForLoadState('networkidle');

    const form = page.locator('form').first();
    if (await form.isVisible()) {
      // Focus on first input
      const firstInput = form.locator('input, select, textarea').first();
      if (await firstInput.isVisible()) {
        await firstInput.focus();

        await expect(form).toHaveScreenshot('form-focused-state.png');
      }
    }
  });

  test('filled form elements', async ({ page }) => {
    await page.goto('/book');
    await page.waitForLoadState('networkidle');

    const form = page.locator('form').first();
    if (await form.isVisible()) {
      // Fill first input if possible
      const firstInput = form.locator('input, select, textarea').first();
      if (await firstInput.isVisible()) {
        await firstInput.fill('Test input value');

        await expect(form).toHaveScreenshot('form-filled-state.png');
      }
    }
  });
});

// Test animations and transitions
test.describe('Animation Visual Regression', () => {
  test('hover animations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Hover over interactive elements
    const interactiveElements = page.locator('button, a, [role="button"]').first();
    if (await interactiveElements.isVisible()) {
      await interactiveElements.hover();
      await page.waitForTimeout(200);

      await expect(interactiveElements).toHaveScreenshot('hover-animation.png');
    }
  });
});

// Test print styles
test.describe('Print Styles Visual Regression', () => {
  test('print version should match baseline', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Emulate print media
    await page.emulateMedia({ media: 'print' });

    await expect(page).toHaveScreenshot('print-version.png', {
      fullPage: true,
    });
  });
});

// Test high contrast mode
test.describe('Accessibility Visual Regression', () => {
  test('high contrast mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Enable high contrast media query
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            outline: 2px solid currentColor !important;
          }
        }
      `
    });

    await expect(page).toHaveScreenshot('high-contrast-mode.png');
  });
});

// Test reduced motion preferences
test.describe('Motion Preferences Visual Regression', () => {
  test('reduced motion version', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await expect(page).toHaveScreenshot('reduced-motion.png');
  });
});

// Test zoom levels
test.describe('Zoom Level Visual Regression', () => {
  const zoomLevels = [50, 75, 125, 150, 200];

  zoomLevels.forEach(zoom => {
    test(`zoom level ${zoom}%`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Set zoom level
      await page.evaluate((zoomLevel) => {
        document.body.style.zoom = `${zoomLevel}%`;
      }, zoom);

      await expect(page).toHaveScreenshot(`zoom-${zoom}-percent.png`);
    });
  });
});

// Test different font sizes
test.describe('Font Size Visual Regression', () => {
  const fontSizes = ['small', 'large', 'x-large'];

  fontSizes.forEach(size => {
    test(`font size ${size}`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Set font size
      await page.evaluate((fontSize) => {
        document.body.style.fontSize = fontSize;
      }, size);

      await expect(page).toHaveScreenshot(`font-size-${size}.png`);
    });
  });
});

// Test critical user journeys
test.describe('Critical User Journey Visual Regression', () => {
  test('complete booking flow', async ({ page }) => {
    await page.goto('/book');
    await page.waitForLoadState('networkidle');

    // Take screenshot at each step of the booking process
    await expect(page).toHaveScreenshot('booking-step-1-initial.png');

    // If form is interactive, fill it out
    const form = page.locator('form').first();
    if (await form.isVisible()) {
      const inputs = form.locator('input, select, textarea');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i);
        if (await input.isVisible() && await input.isEnabled()) {
          await input.fill(`Test value ${i + 1}`);
        }
      }

      await expect(page).toHaveScreenshot('booking-step-2-filled.png');

      // Try to proceed to next step
      const nextButton = form.locator('button[type="submit"], [data-testid="next-step"]').first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot('booking-step-3-next.png');
      }
    }
  });
});

// Test component library consistency
test.describe('Component Library Visual Regression', () => {
  test('button variants', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find all button variants
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    if (buttonCount > 1) {
      // Group buttons by variant/type
      const buttonVariants = new Map<string, any[]>();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const className = await button.getAttribute('class') || '';
        const variant = className.split(' ').find(cls => cls.includes('btn') || cls.includes('button')) || 'default';

        if (!buttonVariants.has(variant)) {
          buttonVariants.set(variant, []);
        }
        buttonVariants.get(variant)!.push(button);
      }

      // Screenshot each variant
      for (const [variant, variantButtons] of buttonVariants) {
        if (variantButtons.length > 0) {
          const container = page.locator('body');
          await expect(container).toHaveScreenshot(`button-variant-${variant}.png`);
          break; // Just test first variant for now
        }
      }
    }
  });
});

// Test data visualization components
test.describe('Data Visualization Visual Regression', () => {
  test('charts and graphs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for charts, graphs, or data visualizations
    const charts = page.locator('canvas, svg, [data-testid*="chart"], [data-testid*="graph"]').first();

    if (await charts.isVisible()) {
      await expect(charts).toHaveScreenshot('data-visualization.png');
    }
  });
});

// Test carousel/slider components
test.describe('Carousel Visual Regression', () => {
  test('carousel states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for carousel/slider components
    const carousel = page.locator('[data-testid*="carousel"], [data-testid*="slider"], .carousel, .slider').first();

    if (await carousel.isVisible()) {
      // Test initial state
      await expect(carousel).toHaveScreenshot('carousel-initial.png');

      // Look for navigation controls
      const nextButton = carousel.locator('[data-testid*="next"], [aria-label*="next"], .next').first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        await expect(carousel).toHaveScreenshot('carousel-next-state.png');
      }
    }
  });
});

// Test dropdown/menu components
test.describe('Dropdown Visual Regression', () => {
  test('dropdown states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for dropdown triggers
    const dropdownTriggers = page.locator('[data-testid*="dropdown"], [aria-haspopup="listbox"], [aria-haspopup="menu"]').first();

    if (await dropdownTriggers.isVisible()) {
      // Click to open dropdown
      await dropdownTriggers.click();
      await page.waitForTimeout(300);

      // Screenshot with dropdown open
      await expect(page).toHaveScreenshot('dropdown-open-state.png');
    }
  });
});

// Test tabbed interfaces
test.describe('Tabbed Interface Visual Regression', () => {
  test('tab navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for tabbed interfaces
    const tabList = page.locator('[role="tablist"], [data-testid*="tabs"]').first();

    if (await tabList.isVisible()) {
      // Screenshot initial state
      await expect(page).toHaveScreenshot('tabs-initial.png');

      // Click second tab if available
      const secondTab = tabList.locator('[role="tab"]').nth(1);
      if (await secondTab.isVisible()) {
        await secondTab.click();
        await page.waitForTimeout(300);

        await expect(page).toHaveScreenshot('tabs-second-active.png');
      }
    }
  });
});

// Test search functionality
test.describe('Search Visual Regression', () => {
  test('search states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for search inputs
    const searchInput = page.locator('input[type="search"], [data-testid*="search"], [aria-label*="search"]').first();

    if (await searchInput.isVisible()) {
      // Focus on search input
      await searchInput.focus();
      await expect(page).toHaveScreenshot('search-focused.png');

      // Type in search input
      await searchInput.fill('test search');
      await expect(page).toHaveScreenshot('search-filled.png');

      // Look for search results
      await page.waitForTimeout(500);
      const searchResults = page.locator('[data-testid*="results"], .search-results').first();
      if (await searchResults.isVisible()) {
        await expect(page).toHaveScreenshot('search-with-results.png');
      }
    }
  });
});

// Test pagination components
test.describe('Pagination Visual Regression', () => {
  test('pagination states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for pagination components
    const pagination = page.locator('[data-testid*="pagination"], [role="navigation"] .pagination, nav[aria-label*="page"]').first();

    if (await pagination.isVisible()) {
      await expect(pagination).toHaveScreenshot('pagination-initial.png');

      // Click next page if available
      const nextPage = pagination.locator('[aria-label*="next"], .next, [data-testid*="next"]').first();
      if (await nextPage.isVisible()) {
        await nextPage.click();
        await page.waitForTimeout(300);

        await expect(pagination).toHaveScreenshot('pagination-next-page.png');
      }
    }
  });
});

// Test tooltip/popover components
test.describe('Tooltip Visual Regression', () => {
  test('tooltip visibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for elements with tooltips
    const tooltipTriggers = page.locator('[data-testid*="tooltip"], [aria-describedby], [title]').first();

    if (await tooltipTriggers.isVisible()) {
      // Hover to show tooltip
      await tooltipTriggers.hover();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('with-tooltip.png');
    }
  });
});

// Test badge/notification components
test.describe('Badge Visual Regression', () => {
  test('badge variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for badge components
    const badges = page.locator('[data-testid*="badge"], .badge, [class*="badge"]').first();

    if (await badges.isVisible()) {
      await expect(badges).toHaveScreenshot('badge-component.png');
    }
  });
});

// Test card components
test.describe('Card Visual Regression', () => {
  test('card layouts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for card components
    const cards = page.locator('[data-testid*="card"], .card, [class*="card"]').first();

    if (await cards.isVisible()) {
      await expect(cards).toHaveScreenshot('card-component.png');
    }
  });
});

// Test navigation components
test.describe('Navigation Visual Regression', () => {
  test('navigation states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for navigation components
    const nav = page.locator('nav, [role="navigation"]').first();

    if (await nav.isVisible()) {
      await expect(nav).toHaveScreenshot('navigation-component.png');

      // Test mobile menu if available
      const mobileMenuButton = page.locator('[data-testid*="menu"], [aria-label*="menu"], .hamburger').first();
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await page.waitForTimeout(300);

        await expect(nav).toHaveScreenshot('navigation-mobile-open.png');
      }
    }
  });
});

// Test footer components
test.describe('Footer Visual Regression', () => {
  test('footer layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for footer
    const footer = page.locator('footer').first();

    if (await footer.isVisible()) {
      await expect(footer).toHaveScreenshot('footer-component.png');
    }
  });
});

// Test breadcrumb components
test.describe('Breadcrumb Visual Regression', () => {
  test('breadcrumb navigation', async ({ page }) => {
    await page.goto('/book');
    await page.waitForLoadState('networkidle');

    // Look for breadcrumb components
    const breadcrumbs = page.locator('[data-testid*="breadcrumb"], nav[aria-label*="breadcrumb"], .breadcrumb').first();

    if (await breadcrumbs.isVisible()) {
      await expect(breadcrumbs).toHaveScreenshot('breadcrumb-component.png');
    }
  });
});

// Test progress indicators
test.describe('Progress Visual Regression', () => {
  test('progress indicators', async ({ page }) => {
    await page.goto('/book');
    await page.waitForLoadState('networkidle');

    // Look for progress indicators
    const progress = page.locator('[data-testid*="progress"], [role="progressbar"], .progress').first();

    if (await progress.isVisible()) {
      await expect(progress).toHaveScreenshot('progress-indicator.png');
    }
  });
});

// Test alert/notification components
test.describe('Alert Visual Regression', () => {
  test('alert variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for alert components
    const alerts = page.locator('[data-testid*="alert"], [role="alert"], .alert').first();

    if (await alerts.isVisible()) {
      await expect(alerts).toHaveScreenshot('alert-component.png');
    }
  });
});

// Test avatar/profile components
test.describe('Avatar Visual Regression', () => {
  test('avatar components', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for avatar components
    const avatars = page.locator('[data-testid*="avatar"], .avatar, img[alt*="avatar"]').first();

    if (await avatars.isVisible()) {
      await expect(avatars).toHaveScreenshot('avatar-component.png');
    }
  });
});

// Test icon consistency
test.describe('Icon Visual Regression', () => {
  test('icon consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for icon elements
    const icons = page.locator('svg, [data-testid*="icon"], .icon').first();

    if (await icons.isVisible()) {
      await expect(icons).toHaveScreenshot('icon-component.png');
    }
  });
});

// Test typography consistency
test.describe('Typography Visual Regression', () => {
  test('heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for heading elements
    const headings = page.locator('h1, h2, h3, h4, h5, h6').first();

    if (await headings.isVisible()) {
      await expect(headings).toHaveScreenshot('typography-headings.png');
    }
  });

  test('text elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for paragraph and text elements
    const textElements = page.locator('p, span, div').filter({ hasText: /./ }).first();

    if (await textElements.isVisible()) {
      await expect(textElements).toHaveScreenshot('typography-text.png');
    }
  });
});

// Test spacing and layout consistency
test.describe('Layout Visual Regression', () => {
  test('spacing consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take screenshot focusing on layout and spacing
    await expect(page).toHaveScreenshot('layout-spacing.png');
  });

  test('grid layouts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for grid layouts
    const grids = page.locator('[data-testid*="grid"], .grid, [class*="grid"]').first();

    if (await grids.isVisible()) {
      await expect(grids).toHaveScreenshot('grid-layout.png');
    }
  });

  test('flex layouts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for flex layouts
    const flexLayouts = page.locator('[data-testid*="flex"], .flex, [class*="flex"]').first();

    if (await flexLayouts.isVisible()) {
      await expect(flexLayouts).toHaveScreenshot('flex-layout.png');
    }
  });
});

// Test color consistency
test.describe('Color Visual Regression', () => {
  test('color scheme consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take screenshot to verify color consistency
    await expect(page).toHaveScreenshot('color-scheme.png');
  });

  test('brand colors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for brand-specific colored elements
    const brandElements = page.locator('[class*="brand"], [class*="primary"], [data-testid*="brand"]').first();

    if (await brandElements.isVisible()) {
      await expect(brandElements).toHaveScreenshot('brand-colors.png');
    }
  });
});

// Test shadow and elevation consistency
test.describe('Shadow Visual Regression', () => {
  test('shadow consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for elements with shadows
    const shadowedElements = page.locator('[data-testid*="shadow"], [class*="shadow"], [style*="box-shadow"]').first();

    if (await shadowedElements.isVisible()) {
      await expect(shadowedElements).toHaveScreenshot('shadow-effects.png');
    }
  });
});

// Test border and outline consistency
test.describe('Border Visual Regression', () => {
  test('border consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for elements with borders
    const borderedElements = page.locator('[data-testid*="border"], [class*="border"], [style*="border"]').first();

    if (await borderedElements.isVisible()) {
      await expect(borderedElements).toHaveScreenshot('border-styles.png');
    }
  });
});

// Test focus states
test.describe('Focus Visual Regression', () => {
  test('focus indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Focus on first focusable element
    const focusableElement = page.locator('button, a, input').first();
    if (await focusableElement.isVisible()) {
      await focusableElement.focus();

      await expect(page).toHaveScreenshot('focus-indicators.png');
    }
  });
});

// Test selection states
test.describe('Selection Visual Regression', () => {
  test('selection indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for selectable elements
    const selectableElements = page.locator('[data-testid*="select"], [class*="select"], [aria-selected]').first();

    if (await selectableElements.isVisible()) {
      await selectableElements.click();

      await expect(page).toHaveScreenshot('selection-states.png');
    }
  });
});

// Test disabled states
test.describe('Disabled Visual Regression', () => {
  test('disabled elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for disabled elements
    const disabledElements = page.locator(':disabled, [aria-disabled="true"]').first();

    if (await disabledElements.isVisible()) {
      await expect(disabledElements).toHaveScreenshot('disabled-states.png');
    }
  });
});

// Test skeleton loading states
test.describe('Skeleton Visual Regression', () => {
  test('skeleton loading', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for skeleton loading elements
    const skeletons = page.locator('[data-testid*="skeleton"], .skeleton, [class*="skeleton"]').first();

    if (await skeletons.isVisible()) {
      await expect(skeletons).toHaveScreenshot('skeleton-loading.png');
    }
  });
});

// Test empty states
test.describe('Empty State Visual Regression', () => {
  test('empty states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for empty state indicators
    const emptyStates = page.locator('[data-testid*="empty"], .empty, [class*="empty"]').first();

    if (await emptyStates.isVisible()) {
      await expect(emptyStates).toHaveScreenshot('empty-state.png');
    }
  });
});

// Test error states visual consistency
test.describe('Error State Visual Regression', () => {
  test('error boundaries', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for error state indicators
    const errorStates = page.locator('[data-testid*="error"], .error, [class*="error"]').first();

    if (await errorStates.isVisible()) {
      await expect(errorStates).toHaveScreenshot('error-state.png');
    }
  });
});

// Test success states
test.describe('Success State Visual Regression', () => {
  test('success indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for success state indicators
    const successStates = page.locator('[data-testid*="success"], .success, [class*="success"]').first();

    if (await successStates.isVisible()) {
      await expect(successStates).toHaveScreenshot('success-state.png');
    }
  });
});

// Test warning states
test.describe('Warning State Visual Regression', () => {
  test('warning indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for warning state indicators
    const warningStates = page.locator('[data-testid*="warning"], .warning, [class*="warning"]').first();

    if (await warningStates.isVisible()) {
      await expect(warningStates).toHaveScreenshot('warning-state.png');
    }
  });
});

// Test info states
test.describe('Info State Visual Regression', () => {
  test('info indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for info state indicators
    const infoStates = page.locator('[data-testid*="info"], .info, [class*="info"]').first();

    if (await infoStates.isVisible()) {
      await expect(infoStates).toHaveScreenshot('info-state.png');
    }
  });
});

// Test critical performance paths
test.describe('Performance Path Visual Regression', () => {
  test('fast loading states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Screenshot at DOM ready (before full load)
    await expect(page).toHaveScreenshot('dom-ready-state.png');
  });

  test('fully loaded states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot at full load
    await expect(page).toHaveScreenshot('fully-loaded-state.png');
  });
});

// Test internationalization
test.describe('Internationalization Visual Regression', () => {
  test('RTL layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Add RTL styles
    await page.addStyleTag({
      content: `
        body {
          direction: rtl;
          text-align: right;
        }
      `
    });

    await expect(page).toHaveScreenshot('rtl-layout.png');
  });
});

// Test different browsers for consistency
test.describe('Cross-Browser Visual Regression', () => {
  test('chromium rendering', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('chromium-rendering.png');
  });

  test('firefox rendering', async ({ browserName, page }) => {
    test.skip(browserName !== 'firefox', 'Firefox only test');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('firefox-rendering.png');
  });

  test('webkit rendering', async ({ browserName, page }) => {
    test.skip(browserName !== 'webkit', 'WebKit only test');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('webkit-rendering.png');
  });
});

// Test different operating systems
test.describe('Cross-Platform Visual Regression', () => {
  test('font rendering consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test text rendering
    const textElements = page.locator('h1, h2, p').first();
    if (await textElements.isVisible()) {
      await expect(textElements).toHaveScreenshot('font-rendering.png');
    }
  });
});

// Test different screen densities
test.describe('Screen Density Visual Regression', () => {
  test('high DPI rendering', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Emulate high DPI screen
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.evaluate(() => {
      Object.defineProperty(window.screen, 'devicePixelRatio', {
        get: () => 2
      });
    });

    await expect(page).toHaveScreenshot('high-dpi-rendering.png');
  });
});

// Test different color gamuts
test.describe('Color Gamut Visual Regression', () => {
  test('wide color gamut', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Emulate wide color gamut display
    await page.emulateMedia({ colorGamut: 'p3' });

    await expect(page).toHaveScreenshot('wide-color-gamut.png');
  });
});

// Test different orientations
test.describe('Orientation Visual Regression', () => {
  test('landscape orientation', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('landscape-orientation.png');
  });

  test('portrait orientation', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('portrait-orientation.png');
  });
});

// Test different interaction modes
test.describe('Interaction Mode Visual Regression', () => {
  test('touch interaction mode', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Emulate touch device
    await page.emulateMedia({ pointer: 'coarse' });

    await expect(page).toHaveScreenshot('touch-interaction-mode.png');
  });

  test('mouse interaction mode', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Emulate mouse device
    await page.emulateMedia({ pointer: 'fine' });

    await expect(page).toHaveScreenshot('mouse-interaction-mode.png');
  });
});

// Test different user preferences
test.describe('User Preference Visual Regression', () => {
  test('prefers-reduced-motion', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await expect(page).toHaveScreenshot('prefers-reduced-motion.png');
  });

  test('prefers-color-scheme-dark', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Emulate dark color scheme preference
    await page.emulateMedia({ colorScheme: 'dark' });

    await expect(page).toHaveScreenshot('prefers-color-scheme-dark.png');
  });

  test('prefers-contrast-high', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Emulate high contrast preference
    await page.emulateMedia({ forcedColors: 'active' });

    await expect(page).toHaveScreenshot('prefers-contrast-high.png');
  });
});

// Test different viewport sizes for responsive design
test.describe('Viewport Size Visual Regression', () => {
  const viewports = [
    { name: 'xs', width: 320, height: 568 },
    { name: 'sm', width: 576, height: 768 },
    { name: 'md', width: 768, height: 1024 },
    { name: 'lg', width: 992, height: 768 },
    { name: 'xl', width: 1200, height: 800 },
    { name: 'xxl', width: 1400, height: 900 },
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`viewport ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(`viewport-${name}.png`);
    });
  });
});

// Test different zoom levels for accessibility
test.describe('Zoom Level Visual Regression', () => {
  const zoomLevels = [100, 125, 150, 200];

  zoomLevels.forEach(zoom => {
    test(`zoom ${zoom}%`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Set zoom level
      await page.evaluate((zoomLevel) => {
        document.body.style.zoom = `${zoomLevel}%`;
      }, zoom);

      await expect(page).toHaveScreenshot(`zoom-${zoom}%.png`);
    });
  });
});

// Test different font sizes for accessibility
test.describe('Font Size Visual Regression', () => {
  const fontSizes = ['medium', 'large', 'x-large'];

  fontSizes.forEach(size => {
    test(`font size ${size}`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Set font size
      await page.evaluate((fontSize) => {
        document.body.style.fontSize = fontSize;
      }, size);

      await expect(page).toHaveScreenshot(`font-size-${size}.png`);
    });
  });
});

// Test different line heights
test.describe('Line Height Visual Regression', () => {
  test('line height variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different line heights
    const lineHeights = ['1.2', '1.5', '1.8'];

    for (const lineHeight of lineHeights) {
      await page.evaluate((lh) => {
        document.body.style.lineHeight = lh;
      }, lineHeight);

      await expect(page).toHaveScreenshot(`line-height-${lineHeight}.png`);
    }
  });
});

// Test different letter spacings
test.describe('Letter Spacing Visual Regression', () => {
  test('letter spacing variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different letter spacings
    const letterSpacings = ['normal', '0.05em', '0.1em'];

    for (const letterSpacing of letterSpacings) {
      await page.evaluate((ls) => {
        document.body.style.letterSpacing = ls;
      }, letterSpacing);

      await expect(page).toHaveScreenshot(`letter-spacing-${letterSpacing}.png`);
    }
  });
});

// Test different text alignments
test.describe('Text Alignment Visual Regression', () => {
  test('text alignment variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text alignments
    const textAligns = ['left', 'center', 'right'];

    for (const textAlign of textAligns) {
      await page.evaluate((ta) => {
        document.body.style.textAlign = ta;
      }, textAlign);

      await expect(page).toHaveScreenshot(`text-align-${textAlign}.png`);
    }
  });
});

// Test different text decorations
test.describe('Text Decoration Visual Regression', () => {
  test('text decoration variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text decorations
    const textDecorations = ['none', 'underline', 'overline', 'line-through'];

    for (const textDecoration of textDecorations) {
      await page.evaluate((td) => {
        document.body.style.textDecoration = td;
      }, textDecoration);

      await expect(page).toHaveScreenshot(`text-decoration-${textDecoration}.png`);
    }
  });
});

// Test different text transforms
test.describe('Text Transform Visual Regression', () => {
  test('text transform variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text transforms
    const textTransforms = ['none', 'uppercase', 'lowercase', 'capitalize'];

    for (const textTransform of textTransforms) {
      await page.evaluate((tt) => {
        document.body.style.textTransform = tt;
      }, textTransform);

      await expect(page).toHaveScreenshot(`text-transform-${textTransform}.png`);
    }
  });
});

// Test different font weights
test.describe('Font Weight Visual Regression', () => {
  test('font weight variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different font weights
    const fontWeights = ['normal', 'bold', '100', '900'];

    for (const fontWeight of fontWeights) {
      await page.evaluate((fw) => {
        document.body.style.fontWeight = fw;
      }, fontWeight);

      await expect(page).toHaveScreenshot(`font-weight-${fontWeight}.png`);
    }
  });
});

// Test different font families
test.describe('Font Family Visual Regression', () => {
  test('font family variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different font families
    const fontFamilies = [
      'system-ui, sans-serif',
      'serif',
      'monospace',
      'cursive',
      'fantasy'
    ];

    for (const fontFamily of fontFamilies) {
      await page.evaluate((ff) => {
        document.body.style.fontFamily = ff;
      }, fontFamily);

      await expect(page).toHaveScreenshot(`font-family-${fontFamily.replace(/,\s*/g, '-')}.png`);
    }
  });
});

// Test different writing modes
test.describe('Writing Mode Visual Regression', () => {
  test('writing mode variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different writing modes
    const writingModes = ['horizontal-tb', 'vertical-rl', 'vertical-lr'];

    for (const writingMode of writingModes) {
      await page.evaluate((wm) => {
        document.body.style.writingMode = wm;
      }, writingMode);

      await expect(page).toHaveScreenshot(`writing-mode-${writingMode}.png`);
    }
  });
});

// Test different text orientations
test.describe('Text Orientation Visual Regression', () => {
  test('text orientation variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text orientations
    const textOrientations = ['mixed', 'upright', 'sideways'];

    for (const textOrientation of textOrientations) {
      await page.evaluate((to) => {
        document.body.style.textOrientation = to;
      }, textOrientation);

      await expect(page).toHaveScreenshot(`text-orientation-${textOrientation}.png`);
    }
  });
});

// Test different unicode bidi settings
test.describe('Unicode Bidi Visual Regression', () => {
  test('unicode bidi variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different unicode bidi settings
    const unicodeBidis = ['normal', 'embed', 'bidi-override'];

    for (const unicodeBidi of unicodeBidis) {
      await page.evaluate((ub) => {
        document.body.style.unicodeBidi = ub;
      }, unicodeBidi);

      await expect(page).toHaveScreenshot(`unicode-bidi-${unicodeBidi}.png`);
    }
  });
});

// Test different direction settings
test.describe('Direction Visual Regression', () => {
  test('direction variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different direction settings
    const directions = ['ltr', 'rtl'];

    for (const direction of directions) {
      await page.evaluate((dir) => {
        document.body.style.direction = dir;
      }, direction);

      await expect(page).toHaveScreenshot(`direction-${direction}.png`);
    }
  });
});

// Test different text combines
test.describe('Text Combine Visual Regression', () => {
  test('text combine variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text combine settings
    const textCombines = ['none', 'horizontal'];

    for (const textCombine of textCombines) {
      await page.evaluate((tc) => {
        document.body.style.textCombineUpright = tc;
      }, textCombine);

      await expect(page).toHaveScreenshot(`text-combine-${textCombine}.png`);
    }
  });
});

// Test different ruby positions
test.describe('Ruby Position Visual Regression', () => {
  test('ruby position variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different ruby position settings
    const rubyPositions = ['over', 'under', 'alternate'];

    for (const rubyPosition of rubyPositions) {
      await page.evaluate((rp) => {
        document.body.style.rubyPosition = rp;
      }, rubyPosition);

      await expect(page).toHaveScreenshot(`ruby-position-${rubyPosition}.png`);
    }
  });
});

// Test different ruby alignments
test.describe('Ruby Alignment Visual Regression', () => {
  test('ruby alignment variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different ruby alignment settings
    const rubyAligns = ['start', 'center', 'space-between', 'space-around'];

    for (const rubyAlign of rubyAligns) {
      await page.evaluate((ra) => {
        document.body.style.rubyAlign = ra;
      }, rubyAlign);

      await expect(page).toHaveScreenshot(`ruby-align-${rubyAlign}.png`);
    }
  });
});

// Test different ruby merges
test.describe('Ruby Merge Visual Regression', () => {
  test('ruby merge variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different ruby merge settings
    const rubyMerges = ['separate', 'collapse'];

    for (const rubyMerge of rubyMerges) {
      await page.evaluate((rm) => {
        document.body.style.rubyMerge = rm;
      }, rubyMerge);

      await expect(page).toHaveScreenshot(`ruby-merge-${rubyMerge}.png`);
    }
  });
});

// Test different list styles
test.describe('List Style Visual Regression', () => {
  test('list style variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different list style settings
    const listStyles = ['disc', 'circle', 'square', 'decimal', 'lower-alpha'];

    for (const listStyle of listStyles) {
      await page.evaluate((ls) => {
        document.body.style.listStyle = ls;
      }, listStyle);

      await expect(page).toHaveScreenshot(`list-style-${listStyle}.png`);
    }
  });
});

// Test different list positions
test.describe('List Position Visual Regression', () => {
  test('list position variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different list position settings
    const listPositions = ['outside', 'inside'];

    for (const listPosition of listPositions) {
      await page.evaluate((lp) => {
        document.body.style.listStylePosition = lp;
      }, listPosition);

      await expect(page).toHaveScreenshot(`list-position-${listPosition}.png`);
    }
  });
});

// Test different table layouts
test.describe('Table Layout Visual Regression', () => {
  test('table layout variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different table layout settings
    const tableLayouts = ['auto', 'fixed'];

    for (const tableLayout of tableLayouts) {
      await page.evaluate((tl) => {
        document.body.style.tableLayout = tl;
      }, tableLayout);

      await expect(page).toHaveScreenshot(`table-layout-${tableLayout}.png`);
    }
  });
});

// Test different border collapses
test.describe('Border Collapse Visual Regression', () => {
  test('border collapse variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different border collapse settings
    const borderCollapses = ['collapse', 'separate'];

    for (const borderCollapse of borderCollapses) {
      await page.evaluate((bc) => {
        document.body.style.borderCollapse = bc;
      }, borderCollapse);

      await expect(page).toHaveScreenshot(`border-collapse-${borderCollapse}.png`);
    }
  });
});

// Test different border spacings
test.describe('Border Spacing Visual Regression', () => {
  test('border spacing variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different border spacing settings
    const borderSpacings = ['0', '2px', '4px 8px'];

    for (const borderSpacing of borderSpacings) {
      await page.evaluate((bs) => {
        document.body.style.borderSpacing = bs;
      }, borderSpacing);

      await expect(page).toHaveScreenshot(`border-spacing-${borderSpacing.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different caption sides
test.describe('Caption Side Visual Regression', () => {
  test('caption side variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different caption side settings
    const captionSides = ['top', 'bottom'];

    for (const captionSide of captionSides) {
      await page.evaluate((cs) => {
        document.body.style.captionSide = cs;
      }, captionSide);

      await expect(page).toHaveScreenshot(`caption-side-${captionSide}.png`);
    }
  });
});

// Test different empty cells
test.describe('Empty Cells Visual Regression', () => {
  test('empty cells variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different empty cells settings
    const emptyCells = ['show', 'hide'];

    for (const emptyCell of emptyCells) {
      await page.evaluate((ec) => {
        document.body.style.emptyCells = ec;
      }, emptyCell);

      await expect(page).toHaveScreenshot(`empty-cells-${emptyCell}.png`);
    }
  });
});

// Test different column fills
test.describe('Column Fill Visual Regression', () => {
  test('column fill variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different column fill settings
    const columnFills = ['auto', 'balance'];

    for (const columnFill of columnFills) {
      await page.evaluate((cf) => {
        document.body.style.columnFill = cf;
      }, columnFill);

      await expect(page).toHaveScreenshot(`column-fill-${columnFill}.png`);
    }
  });
});

// Test different column gaps
test.describe('Column Gap Visual Regression', () => {
  test('column gap variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different column gap settings
    const columnGaps = ['normal', '0', '1em'];

    for (const columnGap of columnGaps) {
      await page.evaluate((cg) => {
        document.body.style.columnGap = cg;
      }, columnGap);

      await expect(page).toHaveScreenshot(`column-gap-${columnGap}.png`);
    }
  });
});

// Test different column rules
test.describe('Column Rule Visual Regression', () => {
  test('column rule variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different column rule settings
    const columnRules = ['none', 'solid', 'dotted', 'dashed'];

    for (const columnRule of columnRules) {
      await page.evaluate((cr) => {
        document.body.style.columnRule = cr;
      }, columnRule);

      await expect(page).toHaveScreenshot(`column-rule-${columnRule}.png`);
    }
  });
});

// Test different column spans
test.describe('Column Span Visual Regression', () => {
  test('column span variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different column span settings
    const columnSpans = ['none', 'all'];

    for (const columnSpan of columnSpans) {
      await page.evaluate((cs) => {
        document.body.style.columnSpan = cs;
      }, columnSpan);

      await expect(page).toHaveScreenshot(`column-span-${columnSpan}.png`);
    }
  });
});

// Test different break befores
test.describe('Break Before Visual Regression', () => {
  test('break before variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different break before settings
    const breakBefores = ['auto', 'always', 'avoid', 'left', 'right', 'page', 'column', 'avoid-page', 'avoid-column'];

    for (const breakBefore of breakBefores) {
      await page.evaluate((bb) => {
        document.body.style.breakBefore = bb;
      }, breakBefore);

      await expect(page).toHaveScreenshot(`break-before-${breakBefore}.png`);
    }
  });
});

// Test different break afters
test.describe('Break After Visual Regression', () => {
  test('break after variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different break after settings
    const breakAfters = ['auto', 'always', 'avoid', 'left', 'right', 'page', 'column', 'avoid-page', 'avoid-column'];

    for (const breakAfter of breakAfters) {
      await page.evaluate((ba) => {
        document.body.style.breakAfter = ba;
      }, breakAfter);

      await expect(page).toHaveScreenshot(`break-after-${breakAfter}.png`);
    }
  });
});

// Test different break insides
test.describe('Break Inside Visual Regression', () => {
  test('break inside variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different break inside settings
    const breakInsides = ['auto', 'avoid', 'avoid-page', 'avoid-column'];

    for (const breakInside of breakInsides) {
      await page.evaluate((bi) => {
        document.body.style.breakInside = bi;
      }, breakInside);

      await expect(page).toHaveScreenshot(`break-inside-${breakInside}.png`);
    }
  });
});

// Test different orphans
test.describe('Orphan Visual Regression', () => {
  test('orphan variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different orphan settings
    const orphans = ['1', '2', '3'];

    for (const orphan of orphans) {
      await page.evaluate((o) => {
        document.body.style.orphans = o;
      }, orphan);

      await expect(page).toHaveScreenshot(`orphans-${orphan}.png`);
    }
  });
});

// Test different widows
test.describe('Widow Visual Regression', () => {
  test('widow variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different widow settings
    const widows = ['1', '2', '3'];

    for (const widow of widows) {
      await page.evaluate((w) => {
        document.body.style.widows = w;
      }, widow);

      await expect(page).toHaveScreenshot(`widows-${widow}.png`);
    }
  });
});

// Test different page break befores
test.describe('Page Break Before Visual Regression', () => {
  test('page break before variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different page break before settings
    const pageBreakBefores = ['auto', 'always', 'avoid', 'left', 'right'];

    for (const pageBreakBefore of pageBreakBefores) {
      await page.evaluate((pbb) => {
        document.body.style.pageBreakBefore = pbb;
      }, pageBreakBefore);

      await expect(page).toHaveScreenshot(`page-break-before-${pageBreakBefore}.png`);
    }
  });
});

// Test different page break afters
test.describe('Page Break After Visual Regression', () => {
  test('page break after variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different page break after settings
    const pageBreakAfters = ['auto', 'always', 'avoid', 'left', 'right'];

    for (const pageBreakAfter of pageBreakAfters) {
      await page.evaluate((pba) => {
        document.body.style.pageBreakAfter = pba;
      }, pageBreakAfter);

      await expect(page).toHaveScreenshot(`page-break-after-${pageBreakAfter}.png`);
    }
  });
});

// Test different page break insides
test.describe('Page Break Inside Visual Regression', () => {
  test('page break inside variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different page break inside settings
    const pageBreakInsides = ['auto', 'avoid'];

    for (const pageBreakInside of pageBreakInsides) {
      await page.evaluate((pbi) => {
        document.body.style.pageBreakInside = pbi;
      }, pageBreakInside);

      await expect(page).toHaveScreenshot(`page-break-inside-${pageBreakInside}.png`);
    }
  });
});

// Test different box decorations
test.describe('Box Decoration Visual Regression', () => {
  test('box decoration variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different box decoration settings
    const boxDecorations = ['slice', 'clone'];

    for (const boxDecoration of boxDecorations) {
      await page.evaluate((bd) => {
        document.body.style.boxDecorationBreak = bd;
      }, boxDecoration);

      await expect(page).toHaveScreenshot(`box-decoration-${boxDecoration}.png`);
    }
  });
});

// Test different box sizings
test.describe('Box Sizing Visual Regression', () => {
  test('box sizing variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different box sizing settings
    const boxSizings = ['content-box', 'border-box'];

    for (const boxSizing of boxSizings) {
      await page.evaluate((bs) => {
        document.body.style.boxSizing = bs;
      }, boxSizing);

      await expect(page).toHaveScreenshot(`box-sizing-${boxSizing}.png`);
    }
  });
});

// Test different object fits
test.describe('Object Fit Visual Regression', () => {
  test('object fit variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different object fit settings
    const objectFits = ['fill', 'contain', 'cover', 'none', 'scale-down'];

    for (const objectFit of objectFits) {
      await page.evaluate((of) => {
        document.body.style.objectFit = of;
      }, objectFit);

      await expect(page).toHaveScreenshot(`object-fit-${objectFit}.png`);
    }
  });
});

// Test different object positions
test.describe('Object Position Visual Regression', () => {
  test('object position variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different object position settings
    const objectPositions = ['left top', 'center', 'right bottom', '10px 20px'];

    for (const objectPosition of objectPositions) {
      await page.evaluate((op) => {
        document.body.style.objectPosition = op;
      }, objectPosition);

      await expect(page).toHaveScreenshot(`object-position-${objectPosition.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different overscroll behaviors
test.describe('Overscroll Behavior Visual Regression', () => {
  test('overscroll behavior variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different overscroll behavior settings
    const overscrollBehaviors = ['auto', 'contain', 'none'];

    for (const overscrollBehavior of overscrollBehaviors) {
      await page.evaluate((ob) => {
        document.body.style.overscrollBehavior = ob;
      }, overscrollBehavior);

      await expect(page).toHaveScreenshot(`overscroll-behavior-${overscrollBehavior}.png`);
    }
  });
});

// Test different overscroll behavior x
test.describe('Overscroll Behavior X Visual Regression', () => {
  test('overscroll behavior x variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different overscroll behavior x settings
    const overscrollBehaviorXs = ['auto', 'contain', 'none'];

    for (const overscrollBehaviorX of overscrollBehaviorXs) {
      await page.evaluate((obx) => {
        document.body.style.overscrollBehaviorX = obx;
      }, overscrollBehaviorX);

      await expect(page).toHaveScreenshot(`overscroll-behavior-x-${overscrollBehaviorX}.png`);
    }
  });
});

// Test different overscroll behavior y
test.describe('Overscroll Behavior Y Visual Regression', () => {
  test('overscroll behavior y variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different overscroll behavior y settings
    const overscrollBehaviorYs = ['auto', 'contain', 'none'];

    for (const overscrollBehaviorY of overscrollBehaviorYs) {
      await page.evaluate((oby) => {
        document.body.style.overscrollBehaviorY = oby;
      }, overscrollBehaviorY);

      await expect(page).toHaveScreenshot(`overscroll-behavior-y-${overscrollBehaviorY}.png`);
    }
  });
});

// Test different scroll behaviors
test.describe('Scroll Behavior Visual Regression', () => {
  test('scroll behavior variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scroll behavior settings
    const scrollBehaviors = ['auto', 'smooth'];

    for (const scrollBehavior of scrollBehaviors) {
      await page.evaluate((sb) => {
        document.body.style.scrollBehavior = sb;
      }, scrollBehavior);

      await expect(page).toHaveScreenshot(`scroll-behavior-${scrollBehavior}.png`);
    }
  });
});

// Test different scroll margins
test.describe('Scroll Margin Visual Regression', () => {
  test('scroll margin variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scroll margin settings
    const scrollMargins = ['0', '10px', '20px 30px'];

    for (const scrollMargin of scrollMargins) {
      await page.evaluate((sm) => {
        document.body.style.scrollMargin = sm;
      }, scrollMargin);

      await expect(page).toHaveScreenshot(`scroll-margin-${scrollMargin.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different scroll margins top
test.describe('Scroll Margin Top Visual Regression', () => {
  test('scroll margin top variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scroll margin top settings
    const scrollMarginTops = ['0', '10px', '20px'];

    for (const scrollMarginTop of scrollMarginTops) {
      await page.evaluate((smt) => {
        document.body.style.scrollMarginTop = smt;
      }, scrollMarginTop);

      await expect(page).toHaveScreenshot(`scroll-margin-top-${scrollMarginTop}.png`);
    }
  });
});

// Test different scroll margins right
test.describe('Scroll Margin Right Visual Regression', () => {
  test('scroll margin right variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scroll margin right settings
    const scrollMarginRights = ['0', '10px', '20px'];

    for (const scrollMarginRight of scrollMarginRights) {
      await page.evaluate((smr) => {
        document.body.style.scrollMarginRight = smr;
      }, scrollMarginRight);

      await expect(page).toHaveScreenshot(`scroll-margin-right-${scrollMarginRight}.png`);
    }
  });
});

// Test different scroll margins bottom
test.describe('Scroll Margin Bottom Visual Regression', () => {
  test('scroll margin bottom variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scroll margin bottom settings
    const scrollMarginBottoms = ['0', '10px', '20px'];

    for (const scrollMarginBottom of scrollMarginBottoms) {
      await page.evaluate((smb) => {
        document.body.style.scrollMarginBottom = smb;
      }, scrollMarginBottom);

      await expect(page).toHaveScreenshot(`scroll-margin-bottom-${scrollMarginBottom}.png`);
    }
  });
});

// Test different scroll margins left
test.describe('Scroll Margin Left Visual Regression', () => {
  test('scroll margin left variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scroll margin left settings
    const scrollMarginLefts = ['0', '10px', '20px'];

    for (const scrollMarginLeft of scrollMarginLefts) {
      await page.evaluate((sml) => {
        document.body.style.scrollMarginLeft = sml;
      }, scrollMarginLeft);

      await expect(page).toHaveScreenshot(`scroll-margin-left-${scrollMarginLeft}.png`);
    }
  });
});

// Test different scroll paddings
test.describe('Scroll Padding Visual Regression', () => {
  test('scroll padding variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scroll padding settings
    const scrollPaddings = ['0', '10px', '20px 30px'];

    for (const scrollPadding of scrollPaddings) {
      await page.evaluate((sp) => {
        document.body.style.scrollPadding = sp;
      }, scrollPadding);

      await expect(page).toHaveScreenshot(`scroll-padding-${scrollPadding.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different scroll paddings top
test.describe('Scroll Padding Top Visual Regression', () => {
  test('scroll padding top variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scroll padding top settings
    const scrollPaddingTops = ['0', '10px', '20px'];

    for (const scrollPaddingTop of scrollPaddingTops) {
      await page.evaluate((spt) => {
        document.body.style.scrollPaddingTop = spt;
      }, scrollPaddingTop);

      await expect(page).toHaveScreenshot(`scroll-padding-top-${scrollPaddingTop}.png`);
    }
  });
});

// Test different scroll paddings right
test.describe('Scroll Padding Right Visual Regression', () => {
  test('scroll padding right variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scroll padding right settings
    const scrollPaddingRights = ['0', '10px', '20px'];

    for (const scrollPaddingRight of scrollPaddingRights) {
      await page.evaluate((spr) => {
        document.body.style.scrollPaddingRight = spr;
      }, scrollPaddingRight);

      await expect(page).toHaveScreenshot(`scroll-padding-right-${scrollPaddingRight}.png`);
    }
  });
});

// Test different scroll paddings bottom
test.describe('Scroll Padding Bottom Visual Regression', () => {
  test('scroll padding bottom variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scroll padding bottom settings
    const scrollPaddingBottoms = ['0', '10px', '20px'];

    for (const scrollPaddingBottom of scrollPaddingBottoms) {
      await page.evaluate((spb) => {
        document.body.style.scrollPaddingBottom = spb;
      }, scrollPaddingBottom);

      await expect(page).toHaveScreenshot(`scroll-padding-bottom-${scrollPaddingBottom}.png`);
    }
  });
});

// Test different scroll paddings left
test.describe('Scroll Padding Left Visual Regression', () => {
  test('scroll padding left variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scroll padding left settings
    const scrollPaddingLefts = ['0', '10px', '20px'];

    for (const scrollPaddingLeft of scrollPaddingLefts) {
      await page.evaluate((spl) => {
        document.body.style.scrollPaddingLeft = spl;
      }, scrollPaddingLeft);

      await expect(page).toHaveScreenshot(`scroll-padding-left-${scrollPaddingLeft}.png`);
    }
  });
});

// Test different scroll snap types
test.describe('Scroll Snap Type Visual Regression', () => {
  test('scroll snap type variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scroll snap type settings
    const scrollSnapTypes = ['none', 'x', 'y', 'block', 'inline', 'both'];

    for (const scrollSnapType of scrollSnapTypes) {
      await page.evaluate((sst) => {
        document.body.style.scrollSnapType = sst;
      }, scrollSnapType);

      await expect(page).toHaveScreenshot(`scroll-snap-type-${scrollSnapType}.png`);
    }
  });
});

// Test different scroll snap aligns
test.describe('Scroll Snap Align Visual Regression', () => {
  test('scroll snap align variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scroll snap align settings
    const scrollSnapAligns = ['none', 'start', 'end', 'center'];

    for (const scrollSnapAlign of scrollSnapAligns) {
      await page.evaluate((ssa) => {
        document.body.style.scrollSnapAlign = ssa;
      }, scrollSnapAlign);

      await expect(page).toHaveScreenshot(`scroll-snap-align-${scrollSnapAlign}.png`);
    }
  });
});

// Test different scroll snap stops
test.describe('Scroll Snap Stop Visual Regression', () => {
  test('scroll snap stop variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scroll snap stop settings
    const scrollSnapStops = ['normal', 'always'];

    for (const scrollSnapStop of scrollSnapStops) {
      await page.evaluate((sss) => {
        document.body.style.scrollSnapStop = sss;
      }, scrollSnapStop);

      await expect(page).toHaveScreenshot(`scroll-snap-stop-${scrollSnapStop}.png`);
    }
  });
});

// Test different touch action
test.describe('Touch Action Visual Regression', () => {
  test('touch action variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different touch action settings
    const touchActions = ['auto', 'none', 'pan-x', 'pan-y', 'pinch-zoom', 'manipulation'];

    for (const touchAction of touchActions) {
      await page.evaluate((ta) => {
        document.body.style.touchAction = ta;
      }, touchAction);

      await expect(page).toHaveScreenshot(`touch-action-${touchAction}.png`);
    }
  });
});

// Test different user selects
test.describe('User Select Visual Regression', () => {
  test('user select variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different user select settings
    const userSelects = ['none', 'auto', 'text', 'all'];

    for (const userSelect of userSelects) {
      await page.evaluate((us) => {
        document.body.style.userSelect = us;
      }, userSelect);

      await expect(page).toHaveScreenshot(`user-select-${userSelect}.png`);
    }
  });
});

// Test different caret colors
test.describe('Caret Color Visual Regression', () => {
  test('caret color variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different caret color settings
    const caretColors = ['auto', 'red', 'transparent'];

    for (const caretColor of caretColors) {
      await page.evaluate((cc) => {
        document.body.style.caretColor = cc;
      }, caretColor);

      await expect(page).toHaveScreenshot(`caret-color-${caretColor}.png`);
    }
  });
});

// Test different accent colors
test.describe('Accent Color Visual Regression', () => {
  test('accent color variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different accent color settings
    const accentColors = ['auto', 'red', 'blue'];

    for (const accentColor of accentColors) {
      await page.evaluate((ac) => {
        document.body.style.accentColor = ac;
      }, accentColor);

      await expect(page).toHaveScreenshot(`accent-color-${accentColor}.png`);
    }
  });
});

// Test different appearance
test.describe('Appearance Visual Regression', () => {
  test('appearance variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different appearance settings
    const appearances = ['none', 'auto', 'button', 'textfield'];

    for (const appearance of appearances) {
      await page.evaluate((a) => {
        document.body.style.appearance = a;
      }, appearance);

      await expect(page).toHaveScreenshot(`appearance-${appearance}.png`);
    }
  });
});

// Test different cursor
test.describe('Cursor Visual Regression', () => {
  test('cursor variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different cursor settings
    const cursors = ['auto', 'default', 'none', 'pointer', 'text', 'grab', 'grabbing'];

    for (const cursor of cursors) {
      await page.evaluate((c) => {
        document.body.style.cursor = c;
      }, cursor);

      await expect(page).toHaveScreenshot(`cursor-${cursor}.png`);
    }
  });
});

// Test different pointer events
test.describe('Pointer Events Visual Regression', () => {
  test('pointer events variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different pointer events settings
    const pointerEvents = ['none', 'auto', 'all'];

    for (const pointerEvent of pointerEvents) {
      await page.evaluate((pe) => {
        document.body.style.pointerEvents = pe;
      }, pointerEvent);

      await expect(page).toHaveScreenshot(`pointer-events-${pointerEvent}.png`);
    }
  });
});

// Test different resize
test.describe('Resize Visual Regression', () => {
  test('resize variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different resize settings
    const resizes = ['none', 'both', 'horizontal', 'vertical'];

    for (const resize of resizes) {
      await page.evaluate((r) => {
        document.body.style.resize = r;
      }, resize);

      await expect(page).toHaveScreenshot(`resize-${resize}.png`);
    }
  });
});

// Test different outline styles
test.describe('Outline Style Visual Regression', () => {
  test('outline style variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different outline style settings
    const outlineStyles = ['none', 'solid', 'dotted', 'dashed', 'double', 'groove', 'ridge', 'inset', 'outset'];

    for (const outlineStyle of outlineStyles) {
      await page.evaluate((os) => {
        document.body.style.outlineStyle = os;
      }, outlineStyle);

      await expect(page).toHaveScreenshot(`outline-style-${outlineStyle}.png`);
    }
  });
});

// Test different outline widths
test.describe('Outline Width Visual Regression', () => {
  test('outline width variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different outline width settings
    const outlineWidths = ['thin', 'medium', 'thick', '1px', '5px'];

    for (const outlineWidth of outlineWidths) {
      await page.evaluate((ow) => {
        document.body.style.outlineWidth = ow;
      }, outlineWidth);

      await expect(page).toHaveScreenshot(`outline-width-${outlineWidth}.png`);
    }
  });
});

// Test different outline colors
test.describe('Outline Color Visual Regression', () => {
  test('outline color variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different outline color settings
    const outlineColors = ['red', 'blue', 'transparent', 'currentColor'];

    for (const outlineColor of outlineColors) {
      await page.evaluate((oc) => {
        document.body.style.outlineColor = oc;
      }, outlineColor);

      await expect(page).toHaveScreenshot(`outline-color-${outlineColor}.png`);
    }
  });
});

// Test different outline offsets
test.describe('Outline Offset Visual Regression', () => {
  test('outline offset variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different outline offset settings
    const outlineOffsets = ['0', '5px', '10px'];

    for (const outlineOffset of outlineOffsets) {
      await page.evaluate((oo) => {
        document.body.style.outlineOffset = oo;
      }, outlineOffset);

      await expect(page).toHaveScreenshot(`outline-offset-${outlineOffset}.png`);
    }
  });
});

// Test different visibility
test.describe('Visibility Visual Regression', () => {
  test('visibility variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different visibility settings
    const visibilities = ['visible', 'hidden', 'collapse'];

    for (const visibility of visibilities) {
      await page.evaluate((v) => {
        document.body.style.visibility = v;
      }, visibility);

      await expect(page).toHaveScreenshot(`visibility-${visibility}.png`);
    }
  });
});

// Test different opacity
test.describe('Opacity Visual Regression', () => {
  test('opacity variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different opacity settings
    const opacities = ['0.1', '0.5', '1'];

    for (const opacity of opacities) {
      await page.evaluate((o) => {
        document.body.style.opacity = o;
      }, opacity);

      await expect(page).toHaveScreenshot(`opacity-${opacity}.png`);
    }
  });
});

// Test different z-index
test.describe('Z-Index Visual Regression', () => {
  test('z-index variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different z-index settings
    const zIndexes = ['auto', '0', '10', '100'];

    for (const zIndex of zIndexes) {
      await page.evaluate((zi) => {
        document.body.style.zIndex = zi;
      }, zIndex);

      await expect(page).toHaveScreenshot(`z-index-${zIndex}.png`);
    }
  });
});

// Test different overflow
test.describe('Overflow Visual Regression', () => {
  test('overflow variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different overflow settings
    const overflows = ['visible', 'hidden', 'scroll', 'auto'];

    for (const overflow of overflows) {
      await page.evaluate((o) => {
        document.body.style.overflow = o;
      }, overflow);

      await expect(page).toHaveScreenshot(`overflow-${overflow}.png`);
    }
  });
});

// Test different overflow x
test.describe('Overflow X Visual Regression', () => {
  test('overflow x variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different overflow x settings
    const overflowXs = ['visible', 'hidden', 'scroll', 'auto'];

    for (const overflowX of overflowXs) {
      await page.evaluate((ox) => {
        document.body.style.overflowX = ox;
      }, overflowX);

      await expect(page).toHaveScreenshot(`overflow-x-${overflowX}.png`);
    }
  });
});

// Test different overflow y
test.describe('Overflow Y Visual Regression', () => {
  test('overflow y variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different overflow y settings
    const overflowYs = ['visible', 'hidden', 'scroll', 'auto'];

    for (const overflowY of overflowYs) {
      await page.evaluate((oy) => {
        document.body.style.overflowY = oy;
      }, overflowY);

      await expect(page).toHaveScreenshot(`overflow-y-${overflowY}.png`);
    }
  });
});

// Test different clip
test.describe('Clip Visual Regression', () => {
  test('clip variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different clip settings
    const clips = ['auto', 'rect(10px, 20px, 30px, 40px)'];

    for (const clip of clips) {
      await page.evaluate((c) => {
        document.body.style.clip = c;
      }, clip);

      await expect(page).toHaveScreenshot(`clip-${clip.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
    }
  });
});

// Test different clip path
test.describe('Clip Path Visual Regression', () => {
  test('clip path variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different clip path settings
    const clipPaths = ['none', 'circle(50%)', 'polygon(50% 0%, 0% 100%, 100% 100%)'];

    for (const clipPath of clipPaths) {
      await page.evaluate((cp) => {
        document.body.style.clipPath = cp;
      }, clipPath);

      await expect(page).toHaveScreenshot(`clip-path-${clipPath.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
    }
  });
});

// Test different mask
test.describe('Mask Visual Regression', () => {
  test('mask variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different mask settings
    const masks = ['none', 'url(#mask)'];

    for (const mask of masks) {
      await page.evaluate((m) => {
        document.body.style.mask = m;
      }, mask);

      await expect(page).toHaveScreenshot(`mask-${mask.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
    }
  });
});

// Test different mask type
test.describe('Mask Type Visual Regression', () => {
  test('mask type variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different mask type settings
    const maskTypes = ['luminance', 'alpha'];

    for (const maskType of maskTypes) {
      await page.evaluate((mt) => {
        document.body.style.maskType = mt;
      }, maskType);

      await expect(page).toHaveScreenshot(`mask-type-${maskType}.png`);
    }
  });
});

// Test different mask mode
test.describe('Mask Mode Visual Regression', () => {
  test('mask mode variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different mask mode settings
    const maskModes = ['match-source', 'alpha', 'luminance'];

    for (const maskMode of maskModes) {
      await page.evaluate((mm) => {
        document.body.style.maskMode = mm;
      }, maskMode);

      await expect(page).toHaveScreenshot(`mask-mode-${maskMode}.png`);
    }
  });
});

// Test different mask composite
test.describe('Mask Composite Visual Regression', () => {
  test('mask composite variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different mask composite settings
    const maskComposites = ['add', 'subtract', 'intersect', 'exclude'];

    for (const maskComposite of maskComposites) {
      await page.evaluate((mc) => {
        document.body.style.maskComposite = mc;
      }, maskComposite);

      await expect(page).toHaveScreenshot(`mask-composite-${maskComposite}.png`);
    }
  });
});

// Test different mask position
test.describe('Mask Position Visual Regression', () => {
  test('mask position variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different mask position settings
    const maskPositions = ['0% 0%', '50% 50%', '100% 100%'];

    for (const maskPosition of maskPositions) {
      await page.evaluate((mp) => {
        document.body.style.maskPosition = mp;
      }, maskPosition);

      await expect(page).toHaveScreenshot(`mask-position-${maskPosition.replace(/%\s*/g, '-')}.png`);
    }
  });
});

// Test different mask size
test.describe('Mask Size Visual Regression', () => {
  test('mask size variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different mask size settings
    const maskSizes = ['auto', 'contain', 'cover', '10px 20px'];

    for (const maskSize of maskSizes) {
      await page.evaluate((ms) => {
        document.body.style.maskSize = ms;
      }, maskSize);

      await expect(page).toHaveScreenshot(`mask-size-${maskSize.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different mask repeat
test.describe('Mask Repeat Visual Regression', () => {
  test('mask repeat variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different mask repeat settings
    const maskRepeats = ['no-repeat', 'repeat', 'repeat-x', 'repeat-y', 'space', 'round'];

    for (const maskRepeat of maskRepeats) {
      await page.evaluate((mr) => {
        document.body.style.maskRepeat = mr;
      }, maskRepeat);

      await expect(page).toHaveScreenshot(`mask-repeat-${maskRepeat}.png`);
    }
  });
});

// Test different mask origin
test.describe('Mask Origin Visual Regression', () => {
  test('mask origin variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different mask origin settings
    const maskOrigins = ['border-box', 'padding-box', 'content-box'];

    for (const maskOrigin of maskOrigins) {
      await page.evaluate((mo) => {
        document.body.style.maskOrigin = mo;
      }, maskOrigin);

      await expect(page).toHaveScreenshot(`mask-origin-${maskOrigin}.png`);
    }
  });
});

// Test different mask clip
test.describe('Mask Clip Visual Regression', () => {
  test('mask clip variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different mask clip settings
    const maskClips = ['border-box', 'padding-box', 'content-box', 'no-clip'];

    for (const maskClip of maskClips) {
      await page.evaluate((mc) => {
        document.body.style.maskClip = mc;
      }, maskClip);

      await expect(page).toHaveScreenshot(`mask-clip-${maskClip}.png`);
    }
  });
});

// Test different filter
test.describe('Filter Visual Regression', () => {
  test('filter variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different filter settings
    const filters = ['none', 'blur(2px)', 'brightness(1.5)', 'contrast(2)', 'grayscale(1)', 'sepia(1)'];

    for (const filter of filters) {
      await page.evaluate((f) => {
        document.body.style.filter = f;
      }, filter);

      await expect(page).toHaveScreenshot(`filter-${filter.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
    }
  });
});

// Test different backdrop filter
test.describe('Backdrop Filter Visual Regression', () => {
  test('backdrop filter variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different backdrop filter settings
    const backdropFilters = ['none', 'blur(2px)', 'brightness(1.5)', 'contrast(2)'];

    for (const backdropFilter of backdropFilters) {
      await page.evaluate((bf) => {
        document.body.style.backdropFilter = bf;
      }, backdropFilter);

      await expect(page).toHaveScreenshot(`backdrop-filter-${backdropFilter.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
    }
  });
});

// Test different mix blend mode
test.describe('Mix Blend Mode Visual Regression', () => {
  test('mix blend mode variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different mix blend mode settings
    const mixBlendModes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];

    for (const mixBlendMode of mixBlendModes) {
      await page.evaluate((mbm) => {
        document.body.style.mixBlendMode = mbm;
      }, mixBlendMode);

      await expect(page).toHaveScreenshot(`mix-blend-mode-${mixBlendMode}.png`);
    }
  });
});

// Test different background blend mode
test.describe('Background Blend Mode Visual Regression', () => {
  test('background blend mode variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different background blend mode settings
    const backgroundBlendModes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];

    for (const backgroundBlendMode of backgroundBlendModes) {
      await page.evaluate((bbm) => {
        document.body.style.backgroundBlendMode = bbm;
      }, backgroundBlendMode);

      await expect(page).toHaveScreenshot(`background-blend-mode-${backgroundBlendMode}.png`);
    }
  });
});

// Test different isolation
test.describe('Isolation Visual Regression', () => {
  test('isolation variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different isolation settings
    const isolations = ['auto', 'isolate'];

    for (const isolation of isolations) {
      await page.evaluate((i) => {
        document.body.style.isolation = i;
      }, isolation);

      await expect(page).toHaveScreenshot(`isolation-${isolation}.png`);
    }
  });
});

// Test different transform
test.describe('Transform Visual Regression', () => {
  test('transform variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different transform settings
    const transforms = ['none', 'translate(10px, 20px)', 'rotate(45deg)', 'scale(1.2)', 'skew(10deg, 20deg)'];

    for (const transform of transforms) {
      await page.evaluate((t) => {
        document.body.style.transform = t;
      }, transform);

      await expect(page).toHaveScreenshot(`transform-${transform.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
    }
  });
});

// Test different transform origin
test.describe('Transform Origin Visual Regression', () => {
  test('transform origin variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different transform origin settings
    const transformOrigins = ['center', 'top left', '50% 50%', '10px 20px'];

    for (const transformOrigin of transformOrigins) {
      await page.evaluate((to) => {
        document.body.style.transformOrigin = to;
      }, transformOrigin);

      await expect(page).toHaveScreenshot(`transform-origin-${transformOrigin.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different transform style
test.describe('Transform Style Visual Regression', () => {
  test('transform style variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different transform style settings
    const transformStyles = ['flat', 'preserve-3d'];

    for (const transformStyle of transformStyles) {
      await page.evaluate((ts) => {
        document.body.style.transformStyle = ts;
      }, transformStyle);

      await expect(page).toHaveScreenshot(`transform-style-${transformStyle}.png`);
    }
  });
});

// Test different perspective
test.describe('Perspective Visual Regression', () => {
  test('perspective variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different perspective settings
    const perspectives = ['none', '500px', '1000px'];

    for (const perspective of perspectives) {
      await page.evaluate((p) => {
        document.body.style.perspective = p;
      }, perspective);

      await expect(page).toHaveScreenshot(`perspective-${perspective}.png`);
    }
  });
});

// Test different perspective origin
test.describe('Perspective Origin Visual Regression', () => {
  test('perspective origin variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different perspective origin settings
    const perspectiveOrigins = ['center', 'top left', '50% 50%'];

    for (const perspectiveOrigin of perspectiveOrigins) {
      await page.evaluate((po) => {
        document.body.style.perspectiveOrigin = po;
      }, perspectiveOrigin);

      await expect(page).toHaveScreenshot(`perspective-origin-${perspectiveOrigin.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different backface visibility
test.describe('Backface Visibility Visual Regression', () => {
  test('backface visibility variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different backface visibility settings
    const backfaceVisibilities = ['visible', 'hidden'];

    for (const backfaceVisibility of backfaceVisibilities) {
      await page.evaluate((bv) => {
        document.body.style.backfaceVisibility = bv;
      }, backfaceVisibility);

      await expect(page).toHaveScreenshot(`backface-visibility-${backfaceVisibility}.png`);
    }
  });
});

// Test different rotate
test.describe('Rotate Visual Regression', () => {
  test('rotate variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different rotate settings
    const rotates = ['0deg', '45deg', '90deg', '180deg'];

    for (const rotate of rotates) {
      await page.evaluate((r) => {
        document.body.style.rotate = r;
      }, rotate);

      await expect(page).toHaveScreenshot(`rotate-${rotate}.png`);
    }
  });
});

// Test different scale
test.describe('Scale Visual Regression', () => {
  test('scale variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scale settings
    const scales = ['none', '1.2', '0.8'];

    for (const scale of scales) {
      await page.evaluate((s) => {
        document.body.style.scale = s;
      }, scale);

      await expect(page).toHaveScreenshot(`scale-${scale}.png`);
    }
  });
});

// Test different translate
test.describe('Translate Visual Regression', () => {
  test('translate variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different translate settings
    const translates = ['none', '10px 20px', '50% -50%'];

    for (const translate of translates) {
      await page.evaluate((t) => {
        document.body.style.translate = t;
      }, translate);

      await expect(page).toHaveScreenshot(`translate-${translate.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different skew
test.describe('Skew Visual Regression', () => {
  test('skew variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different skew settings
    const skews = ['0deg', '10deg 20deg', '45deg'];

    for (const skew of skews) {
      await page.evaluate((s) => {
        document.body.style.transform = `skew(${s})`;
      }, skew);

      await expect(page).toHaveScreenshot(`skew-${skew.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different matrix
test.describe('Matrix Visual Regression', () => {
  test('matrix variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different matrix settings
    const matrixes = ['none', 'matrix(1, 0, 0, 1, 10, 20)', 'matrix(1.2, 0.2, -0.2, 1.2, 0, 0)'];

    for (const matrix of matrixes) {
      await page.evaluate((m) => {
        document.body.style.transform = m;
      }, matrix);

      await expect(page).toHaveScreenshot(`matrix-${matrix.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
    }
  });
});

// Test different matrix 3d
test.describe('Matrix 3D Visual Regression', () => {
  test('matrix 3d variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different matrix 3d settings
    const matrix3ds = ['none', 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 20, 30, 1)'];

    for (const matrix3d of matrix3ds) {
      await page.evaluate((m3d) => {
        document.body.style.transform = m3d;
      }, matrix3d);

      await expect(page).toHaveScreenshot(`matrix3d-${matrix3d.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
    }
  });
});

// Test different rotate x
test.describe('Rotate X Visual Regression', () => {
  test('rotate x variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different rotate x settings
    const rotateXs = ['0deg', '45deg', '90deg'];

    for (const rotateX of rotateXs) {
      await page.evaluate((rx) => {
        document.body.style.transform = `rotateX(${rx})`;
      }, rotateX);

      await expect(page).toHaveScreenshot(`rotate-x-${rotateX}.png`);
    }
  });
});

// Test different rotate y
test.describe('Rotate Y Visual Regression', () => {
  test('rotate y variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different rotate y settings
    const rotateYs = ['0deg', '45deg', '90deg'];

    for (const rotateY of rotateYs) {
      await page.evaluate((ry) => {
        document.body.style.transform = `rotateY(${ry})`;
      }, rotateY);

      await expect(page).toHaveScreenshot(`rotate-y-${rotateY}.png`);
    }
  });
});

// Test different rotate z
test.describe('Rotate Z Visual Regression', () => {
  test('rotate z variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different rotate z settings
    const rotateZs = ['0deg', '45deg', '90deg'];

    for (const rotateZ of rotateZs) {
      await page.evaluate((rz) => {
        document.body.style.transform = `rotateZ(${rz})`;
      }, rotateZ);

      await expect(page).toHaveScreenshot(`rotate-z-${rotateZ}.png`);
    }
  });
});

// Test different scale x
test.describe('Scale X Visual Regression', () => {
  test('scale x variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scale x settings
    const scaleXs = ['1', '1.2', '0.8'];

    for (const scaleX of scaleXs) {
      await page.evaluate((sx) => {
        document.body.style.transform = `scaleX(${sx})`;
      }, scaleX);

      await expect(page).toHaveScreenshot(`scale-x-${scaleX}.png`);
    }
  });
});

// Test different scale y
test.describe('Scale Y Visual Regression', () => {
  test('scale y variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scale y settings
    const scaleYs = ['1', '1.2', '0.8'];

    for (const scaleY of scaleYs) {
      await page.evaluate((sy) => {
        document.body.style.transform = `scaleY(${sy})`;
      }, scaleY);

      await expect(page).toHaveScreenshot(`scale-y-${scaleY}.png`);
    }
  });
});

// Test different scale z
test.describe('Scale Z Visual Regression', () => {
  test('scale z variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different scale z settings
    const scaleZs = ['1', '1.2', '0.8'];

    for (const scaleZ of scaleZs) {
      await page.evaluate((sz) => {
        document.body.style.transform = `scaleZ(${sz})`;
      }, scaleZ);

      await expect(page).toHaveScreenshot(`scale-z-${scaleZ}.png`);
    }
  });
});

// Test different translate x
test.describe('Translate X Visual Regression', () => {
  test('translate x variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different translate x settings
    const translateXs = ['0px', '10px', '50%'];

    for (const translateX of translateXs) {
      await page.evaluate((tx) => {
        document.body.style.transform = `translateX(${tx})`;
      }, translateX);

      await expect(page).toHaveScreenshot(`translate-x-${translateX}.png`);
    }
  });
});

// Test different translate y
test.describe('Translate Y Visual Regression', () => {
  test('translate y variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different translate y settings
    const translateYs = ['0px', '10px', '50%'];

    for (const translateY of translateYs) {
      await page.evaluate((ty) => {
        document.body.style.transform = `translateY(${ty})`;
      }, translateY);

      await expect(page).toHaveScreenshot(`translate-y-${translateY}.png`);
    }
  });
});

// Test different translate z
test.describe('Translate Z Visual Regression', () => {
  test('translate z variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different translate z settings
    const translateZs = ['0px', '10px', '50px'];

    for (const translateZ of translateZs) {
      await page.evaluate((tz) => {
        document.body.style.transform = `translateZ(${tz})`;
      }, translateZ);

      await expect(page).toHaveScreenshot(`translate-z-${translateZ}.png`);
    }
  });
});

// Test different skew x
test.describe('Skew X Visual Regression', () => {
  test('skew x variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different skew x settings
    const skewXs = ['0deg', '10deg', '45deg'];

    for (const skewX of skewXs) {
      await page.evaluate((sx) => {
        document.body.style.transform = `skewX(${sx})`;
      }, skewX);

      await expect(page).toHaveScreenshot(`skew-x-${skewX}.png`);
    }
  });
});

// Test different skew y
test.describe('Skew Y Visual Regression', () => {
  test('skew y variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different skew y settings
    const skewYs = ['0deg', '10deg', '45deg'];

    for (const skewY of skewYs) {
      await page.evaluate((sy) => {
        document.body.style.transform = `skewY(${sy})`;
      }, skewY);

      await expect(page).toHaveScreenshot(`skew-y-${skewY}.png`);
    }
  });
});

// Test different perspective
test.describe('Perspective Visual Regression', () => {
  test('perspective variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different perspective settings
    const perspectives = ['500px', '1000px', '2000px'];

    for (const perspective of perspectives) {
      await page.evaluate((p) => {
        document.body.style.perspective = p;
      }, perspective);

      await expect(page).toHaveScreenshot(`perspective-${perspective}.png`);
    }
  });
});

// Test different perspective origin
test.describe('Perspective Origin Visual Regression', () => {
  test('perspective origin variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different perspective origin settings
    const perspectiveOrigins = ['center', 'top left', '50% 50%'];

    for (const perspectiveOrigin of perspectiveOrigins) {
      await page.evaluate((po) => {
        document.body.style.perspectiveOrigin = po;
      }, perspectiveOrigin);

      await expect(page).toHaveScreenshot(`perspective-origin-${perspectiveOrigin.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different transform style
test.describe('Transform Style Visual Regression', () => {
  test('transform style variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different transform style settings
    const transformStyles = ['flat', 'preserve-3d'];

    for (const transformStyle of transformStyles) {
      await page.evaluate((ts) => {
        document.body.style.transformStyle = ts;
      }, transformStyle);

      await expect(page).toHaveScreenshot(`transform-style-${transformStyle}.png`);
    }
  });
});

// Test different backface visibility
test.describe('Backface Visibility Visual Regression', () => {
  test('backface visibility variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different backface visibility settings
    const backfaceVisibilities = ['visible', 'hidden'];

    for (const backfaceVisibility of backfaceVisibilities) {
      await page.evaluate((bv) => {
        document.body.style.backfaceVisibility = bv;
      }, backfaceVisibility);

      await expect(page).toHaveScreenshot(`backface-visibility-${backfaceVisibility}.png`);
    }
  });
});

// Test different animation
test.describe('Animation Visual Regression', () => {
  test('animation variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different animation settings
    const animations = ['none', 'slideIn 1s ease-in-out'];

    for (const animation of animations) {
      await page.evaluate((a) => {
        document.body.style.animation = a;
      }, animation);

      await expect(page).toHaveScreenshot(`animation-${animation.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different animation name
test.describe('Animation Name Visual Regression', () => {
  test('animation name variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different animation name settings
    const animationNames = ['none', 'slideIn', 'fadeIn'];

    for (const animationName of animationNames) {
      await page.evaluate((an) => {
        document.body.style.animationName = an;
      }, animationName);

      await expect(page).toHaveScreenshot(`animation-name-${animationName}.png`);
    }
  });
});

// Test different animation duration
test.describe('Animation Duration Visual Regression', () => {
  test('animation duration variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different animation duration settings
    const animationDurations = ['0s', '1s', '2s'];

    for (const animationDuration of animationDurations) {
      await page.evaluate((ad) => {
        document.body.style.animationDuration = ad;
      }, animationDuration);

      await expect(page).toHaveScreenshot(`animation-duration-${animationDuration}.png`);
    }
  });
});

// Test different animation timing function
test.describe('Animation Timing Function Visual Regression', () => {
  test('animation timing function variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different animation timing function settings
    const animationTimingFunctions = ['ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out'];

    for (const animationTimingFunction of animationTimingFunctions) {
      await page.evaluate((atf) => {
        document.body.style.animationTimingFunction = atf;
      }, animationTimingFunction);

      await expect(page).toHaveScreenshot(`animation-timing-function-${animationTimingFunction}.png`);
    }
  });
});

// Test different animation delay
test.describe('Animation Delay Visual Regression', () => {
  test('animation delay variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different animation delay settings
    const animationDelays = ['0s', '0.5s', '1s'];

    for (const animationDelay of animationDelays) {
      await page.evaluate((ad) => {
        document.body.style.animationDelay = ad;
      }, animationDelay);

      await expect(page).toHaveScreenshot(`animation-delay-${animationDelay}.png`);
    }
  });
});

// Test different animation iteration count
test.describe('Animation Iteration Count Visual Regression', () => {
  test('animation iteration count variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different animation iteration count settings
    const animationIterationCounts = ['infinite', '1', '2'];

    for (const animationIterationCount of animationIterationCounts) {
      await page.evaluate((aic) => {
        document.body.style.animationIterationCount = aic;
      }, animationIterationCount);

      await expect(page).toHaveScreenshot(`animation-iteration-count-${animationIterationCount}.png`);
    }
  });
});

// Test different animation direction
test.describe('Animation Direction Visual Regression', () => {
  test('animation direction variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different animation direction settings
    const animationDirections = ['normal', 'reverse', 'alternate', 'alternate-reverse'];

    for (const animationDirection of animationDirections) {
      await page.evaluate((ad) => {
        document.body.style.animationDirection = ad;
      }, animationDirection);

      await expect(page).toHaveScreenshot(`animation-direction-${animationDirection}.png`);
    }
  });
});

// Test different animation fill mode
test.describe('Animation Fill Mode Visual Regression', () => {
  test('animation fill mode variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different animation fill mode settings
    const animationFillModes = ['none', 'forwards', 'backwards', 'both'];

    for (const animationFillMode of animationFillModes) {
      await page.evaluate((afm) => {
        document.body.style.animationFillMode = afm;
      }, animationFillMode);

      await expect(page).toHaveScreenshot(`animation-fill-mode-${animationFillMode}.png`);
    }
  });
});

// Test different animation play state
test.describe('Animation Play State Visual Regression', () => {
  test('animation play state variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different animation play state settings
    const animationPlayStates = ['running', 'paused'];

    for (const animationPlayState of animationPlayStates) {
      await page.evaluate((aps) => {
        document.body.style.animationPlayState = aps;
      }, animationPlayState);

      await expect(page).toHaveScreenshot(`animation-play-state-${animationPlayState}.png`);
    }
  });
});

// Test different transition
test.describe('Transition Visual Regression', () => {
  test('transition variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different transition settings
    const transitions = ['all 0.3s ease', 'opacity 0.5s linear', 'transform 0.2s ease-in-out'];

    for (const transition of transitions) {
      await page.evaluate((t) => {
        document.body.style.transition = t;
      }, transition);

      await expect(page).toHaveScreenshot(`transition-${transition.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different transition property
test.describe('Transition Property Visual Regression', () => {
  test('transition property variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different transition property settings
    const transitionProperties = ['all', 'opacity', 'transform', 'background-color'];

    for (const transitionProperty of transitionProperties) {
      await page.evaluate((tp) => {
        document.body.style.transitionProperty = tp;
      }, transitionProperty);

      await expect(page).toHaveScreenshot(`transition-property-${transitionProperty}.png`);
    }
  });
});

// Test different transition duration
test.describe('Transition Duration Visual Regression', () => {
  test('transition duration variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different transition duration settings
    const transitionDurations = ['0s', '0.3s', '1s'];

    for (const transitionDuration of transitionDurations) {
      await page.evaluate((td) => {
        document.body.style.transitionDuration = td;
      }, transitionDuration);

      await expect(page).toHaveScreenshot(`transition-duration-${transitionDuration}.png`);
    }
  });
});

// Test different transition timing function
test.describe('Transition Timing Function Visual Regression', () => {
  test('transition timing function variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different transition timing function settings
    const transitionTimingFunctions = ['ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out'];

    for (const transitionTimingFunction of transitionTimingFunctions) {
      await page.evaluate((ttf) => {
        document.body.style.transitionTimingFunction = ttf;
      }, transitionTimingFunction);

      await expect(page).toHaveScreenshot(`transition-timing-function-${transitionTimingFunction}.png`);
    }
  });
});

// Test different transition delay
test.describe('Transition Delay Visual Regression', () => {
  test('transition delay variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different transition delay settings
    const transitionDelays = ['0s', '0.1s', '0.5s'];

    for (const transitionDelay of transitionDelays) {
      await page.evaluate((td) => {
        document.body.style.transitionDelay = td;
      }, transitionDelay);

      await expect(page).toHaveScreenshot(`transition-delay-${transitionDelay}.png`);
    }
  });
});

// Test different will change
test.describe('Will Change Visual Regression', () => {
  test('will change variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different will change settings
    const willChanges = ['auto', 'scroll-position', 'contents', 'transform'];

    for (const willChange of willChanges) {
      await page.evaluate((wc) => {
        document.body.style.willChange = wc;
      }, willChange);

      await expect(page).toHaveScreenshot(`will-change-${willChange}.png`);
    }
  });
});

// Test different contain
test.describe('Contain Visual Regression', () => {
  test('contain variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different contain settings
    const contains = ['none', 'strict', 'content', 'size', 'layout', 'style', 'paint'];

    for (const contain of contains) {
      await page.evaluate((c) => {
        document.body.style.contain = c;
      }, contain);

      await expect(page).toHaveScreenshot(`contain-${contain}.png`);
    }
  });
});

// Test different contain intrinsic size
test.describe('Contain Intrinsic Size Visual Regression', () => {
  test('contain intrinsic size variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different contain intrinsic size settings
    const containIntrinsicSizes = ['none', '100px', '200px 300px'];

    for (const containIntrinsicSize of containIntrinsicSizes) {
      await page.evaluate((cis) => {
        document.body.style.containIntrinsicSize = cis;
      }, containIntrinsicSize);

      await expect(page).toHaveScreenshot(`contain-intrinsic-size-${containIntrinsicSize.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different contain intrinsic width
test.describe('Contain Intrinsic Width Visual Regression', () => {
  test('contain intrinsic width variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different contain intrinsic width settings
    const containIntrinsicWidths = ['none', '100px', '200px'];

    for (const containIntrinsicWidth of containIntrinsicWidths) {
      await page.evaluate((ciw) => {
        document.body.style.containIntrinsicWidth = ciw;
      }, containIntrinsicWidth);

      await expect(page).toHaveScreenshot(`contain-intrinsic-width-${containIntrinsicWidth}.png`);
    }
  });
});

// Test different contain intrinsic height
test.describe('Contain Intrinsic Height Visual Regression', () => {
  test('contain intrinsic height variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different contain intrinsic height settings
    const containIntrinsicHeights = ['none', '100px', '200px'];

    for (const containIntrinsicHeight of containIntrinsicHeights) {
      await page.evaluate((cih) => {
        document.body.style.containIntrinsicHeight = cih;
      }, containIntrinsicHeight);

      await expect(page).toHaveScreenshot(`contain-intrinsic-height-${containIntrinsicHeight}.png`);
    }
  });
});

// Test different contain intrinsic block size
test.describe('Contain Intrinsic Block Size Visual Regression', () => {
  test('contain intrinsic block size variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different contain intrinsic block size settings
    const containIntrinsicBlockSizes = ['none', '100px', '200px'];

    for (const containIntrinsicBlockSize of containIntrinsicBlockSizes) {
      await page.evaluate((cibs) => {
        document.body.style.containIntrinsicBlockSize = cibs;
      }, containIntrinsicBlockSize);

      await expect(page).toHaveScreenshot(`contain-intrinsic-block-size-${containIntrinsicBlockSize}.png`);
    }
  });
});

// Test different contain intrinsic inline size
test.describe('Contain Intrinsic Inline Size Visual Regression', () => {
  test('contain intrinsic inline size variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different contain intrinsic inline size settings
    const containIntrinsicInlineSizes = ['none', '100px', '200px'];

    for (const containIntrinsicInlineSize of containIntrinsicInlineSizes) {
      await page.evaluate((ciis) => {
        document.body.style.containIntrinsicInlineSize = ciis;
      }, containIntrinsicInlineSize);

      await expect(page).toHaveScreenshot(`contain-intrinsic-inline-size-${containIntrinsicInlineSize}.png`);
    }
  });
});

// Test different content visibility
test.describe('Content Visibility Visual Regression', () => {
  test('content visibility variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different content visibility settings
    const contentVisibilities = ['visible', 'hidden', 'auto'];

    for (const contentVisibility of contentVisibilities) {
      await page.evaluate((cv) => {
        document.body.style.contentVisibility = cv;
      }, contentVisibility);

      await expect(page).toHaveScreenshot(`content-visibility-${contentVisibility}.png`);
    }
  });
});

// Test different contain layout
test.describe('Contain Layout Visual Regression', () => {
  test('contain layout variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different contain layout settings
    const containLayouts = ['none', 'size', 'inline-size'];

    for (const containLayout of containLayouts) {
      await page.evaluate((cl) => {
        document.body.style.containLayout = cl;
      }, containLayout);

      await expect(page).toHaveScreenshot(`contain-layout-${containLayout}.png`);
    }
  });
});

// Test different contain paint
test.describe('Contain Paint Visual Regression', () => {
  test('contain paint variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different contain paint settings
    const containPaints = ['none', 'layout', 'style', 'paint', 'size'];

    for (const containPaint of containPaints) {
      await page.evaluate((cp) => {
        document.body.style.containPaint = cp;
      }, containPaint);

      await expect(page).toHaveScreenshot(`contain-paint-${containPaint}.png`);
    }
  });
});

// Test different contain size
test.describe('Contain Size Visual Regression', () => {
  test('contain size variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different contain size settings
    const containSizes = ['none', 'strict', 'content'];

    for (const containSize of containSizes) {
      await page.evaluate((cs) => {
        document.body.style.containSize = cs;
      }, containSize);

      await expect(page).toHaveScreenshot(`contain-size-${containSize}.png`);
    }
  });
});

// Test different contain style
test.describe('Contain Style Visual Regression', () => {
  test('contain style variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different contain style settings
    const containStyles = ['none', 'layout', 'style', 'paint', 'size'];

    for (const containStyle of containStyles) {
      await page.evaluate((cs) => {
        document.body.style.containStyle = cs;
      }, containStyle);

      await expect(page).toHaveScreenshot(`contain-style-${containStyle}.png`);
    }
  });
});

// Test different container type
test.describe('Container Type Visual Regression', () => {
  test('container type variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different container type settings
    const containerTypes = ['normal', 'size', 'inline-size'];

    for (const containerType of containerTypes) {
      await page.evaluate((ct) => {
        document.body.style.containerType = ct;
      }, containerType);

      await expect(page).toHaveScreenshot(`container-type-${containerType}.png`);
    }
  });
});

// Test different container name
test.describe('Container Name Visual Regression', () => {
  test('container name variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different container name settings
    const containerNames = ['none', 'sidebar', 'main'];

    for (const containerName of containerNames) {
      await page.evaluate((cn) => {
        document.body.style.containerName = cn;
      }, containerName);

      await expect(page).toHaveScreenshot(`container-name-${containerName}.png`);
    }
  });
});

// Test different container
test.describe('Container Visual Regression', () => {
  test('container variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different container settings
    const containers = ['none', 'sidebar / size', 'main / inline-size'];

    for (const container of containers) {
      await page.evaluate((c) => {
        document.body.style.container = c;
      }, container);

      await expect(page).toHaveScreenshot(`container-${container.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different columns
test.describe('Columns Visual Regression', () => {
  test('columns variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different columns settings
    const columns = ['auto', '100px', '3', '100px 3'];

    for (const column of columns) {
      await page.evaluate((c) => {
        document.body.style.columns = c;
      }, column);

      await expect(page).toHaveScreenshot(`columns-${column.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different column width
test.describe('Column Width Visual Regression', () => {
  test('column width variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different column width settings
    const columnWidths = ['auto', '100px', '200px'];

    for (const columnWidth of columnWidths) {
      await page.evaluate((cw) => {
        document.body.style.columnWidth = cw;
      }, columnWidth);

      await expect(page).toHaveScreenshot(`column-width-${columnWidth}.png`);
    }
  });
});

// Test different column count
test.describe('Column Count Visual Regression', () => {
  test('column count variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different column count settings
    const columnCounts = ['auto', '2', '3'];

    for (const columnCount of columnCounts) {
      await page.evaluate((cc) => {
        document.body.style.columnCount = cc;
      }, columnCount);

      await expect(page).toHaveScreenshot(`column-count-${columnCount}.png`);
    }
  });
});

// Test different column span
test.describe('Column Span Visual Regression', () => {
  test('column span variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different column span settings
    const columnSpans = ['none', '1', 'all'];

    for (const columnSpan of columnSpans) {
      await page.evaluate((cs) => {
        document.body.style.columnSpan = cs;
      }, columnSpan);

      await expect(page).toHaveScreenshot(`column-span-${columnSpan}.png`);
    }
  });
});

// Test different column fill
test.describe('Column Fill Visual Regression', () => {
  test('column fill variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different column fill settings
    const columnFills = ['auto', 'balance'];

    for (const columnFill of columnFills) {
      await page.evaluate((cf) => {
        document.body.style.columnFill = cf;
      }, columnFill);

      await expect(page).toHaveScreenshot(`column-fill-${columnFill}.png`);
    }
  });
});

// Test different column rule
test.describe('Column Rule Visual Regression', () => {
  test('column rule variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different column rule settings
    const columnRules = ['none', 'solid', 'dotted', 'dashed'];

    for (const columnRule of columnRules) {
      await page.evaluate((cr) => {
        document.body.style.columnRule = cr;
      }, columnRule);

      await expect(page).toHaveScreenshot(`column-rule-${columnRule}.png`);
    }
  });
});

// Test different column rule width
test.describe('Column Rule Width Visual Regression', () => {
  test('column rule width variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different column rule width settings
    const columnRuleWidths = ['thin', 'medium', 'thick', '1px'];

    for (const columnRuleWidth of columnRuleWidths) {
      await page.evaluate((crw) => {
        document.body.style.columnRuleWidth = crw;
      }, columnRuleWidth);

      await expect(page).toHaveScreenshot(`column-rule-width-${columnRuleWidth}.png`);
    }
  });
});

// Test different column rule style
test.describe('Column Rule Style Visual Regression', () => {
  test('column rule style variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different column rule style settings
    const columnRuleStyles = ['none', 'solid', 'dotted', 'dashed', 'double'];

    for (const columnRuleStyle of columnRuleStyles) {
      await page.evaluate((crs) => {
        document.body.style.columnRuleStyle = crs;
      }, columnRuleStyle);

      await expect(page).toHaveScreenshot(`column-rule-style-${columnRuleStyle}.png`);
    }
  });
});

// Test different column rule color
test.describe('Column Rule Color Visual Regression', () => {
  test('column rule color variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different column rule color settings
    const columnRuleColors = ['red', 'blue', 'currentColor'];

    for (const columnRuleColor of columnRuleColors) {
      await page.evaluate((crc) => {
        document.body.style.columnRuleColor = crc;
      }, columnRuleColor);

      await expect(page).toHaveScreenshot(`column-rule-color-${columnRuleColor}.png`);
    }
  });
});

// Test different break before
test.describe('Break Before Visual Regression', () => {
  test('break before variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different break before settings
    const breakBefores = ['auto', 'always', 'avoid', 'left', 'right', 'page', 'column'];

    for (const breakBefore of breakBefores) {
      await page.evaluate((bb) => {
        document.body.style.breakBefore = bb;
      }, breakBefore);

      await expect(page).toHaveScreenshot(`break-before-${breakBefore}.png`);
    }
  });
});

// Test different break after
test.describe('Break After Visual Regression', () => {
  test('break after variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different break after settings
    const breakAfters = ['auto', 'always', 'avoid', 'left', 'right', 'page', 'column'];

    for (const breakAfter of breakAfters) {
      await page.evaluate((ba) => {
        document.body.style.breakAfter = ba;
      }, breakAfter);

      await expect(page).toHaveScreenshot(`break-after-${breakAfter}.png`);
    }
  });
});

// Test different break inside
test.describe('Break Inside Visual Regression', () => {
  test('break inside variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different break inside settings
    const breakInsides = ['auto', 'avoid', 'avoid-page', 'avoid-column'];

    for (const breakInside of breakInsides) {
      await page.evaluate((bi) => {
        document.body.style.breakInside = bi;
      }, breakInside);

      await expect(page).toHaveScreenshot(`break-inside-${breakInside}.png`);
    }
  });
});

// Test different page break before
test.describe('Page Break Before Visual Regression', () => {
  test('page break before variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different page break before settings
    const pageBreakBefores = ['auto', 'always', 'avoid', 'left', 'right'];

    for (const pageBreakBefore of pageBreakBefores) {
      await page.evaluate((pbb) => {
        document.body.style.pageBreakBefore = pbb;
      }, pageBreakBefore);

      await expect(page).toHaveScreenshot(`page-break-before-${pageBreakBefore}.png`);
    }
  });
});

// Test different page break after
test.describe('Page Break After Visual Regression', () => {
  test('page break after variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different page break after settings
    const pageBreakAfters = ['auto', 'always', 'avoid', 'left', 'right'];

    for (const pageBreakAfter of pageBreakAfters) {
      await page.evaluate((pba) => {
        document.body.style.pageBreakAfter = pba;
      }, pageBreakAfter);

      await expect(page).toHaveScreenshot(`page-break-after-${pageBreakAfter}.png`);
    }
  });
});

// Test different page break inside
test.describe('Page Break Inside Visual Regression', () => {
  test('page break inside variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different page break inside settings
    const pageBreakInsides = ['auto', 'avoid'];

    for (const pageBreakInside of pageBreakInsides) {
      await page.evaluate((pbi) => {
        document.body.style.pageBreakInside = pbi;
      }, pageBreakInside);

      await expect(page).toHaveScreenshot(`page-break-inside-${pageBreakInside}.png`);
    }
  });
});

// Test different orphans
test.describe('Orphans Visual Regression', () => {
  test('orphans variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different orphans settings
    const orphans = ['1', '2', '3'];

    for (const orphan of orphans) {
      await page.evaluate((o) => {
        document.body.style.orphans = o;
      }, orphan);

      await expect(page).toHaveScreenshot(`orphans-${orphan}.png`);
    }
  });
});

// Test different widows
test.describe('Widows Visual Regression', () => {
  test('widows variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different widows settings
    const widows = ['1', '2', '3'];

    for (const widow of widows) {
      await page.evaluate((w) => {
        document.body.style.widows = w;
      }, widow);

      await expect(page).toHaveScreenshot(`widows-${widow}.png`);
    }
  });
});

// Test different box decoration break
test.describe('Box Decoration Break Visual Regression', () => {
  test('box decoration break variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different box decoration break settings
    const boxDecorationBreaks = ['slice', 'clone'];

    for (const boxDecorationBreak of boxDecorationBreaks) {
      await page.evaluate((bdb) => {
        document.body.style.boxDecorationBreak = bdb;
      }, boxDecorationBreak);

      await expect(page).toHaveScreenshot(`box-decoration-break-${boxDecorationBreak}.png`);
    }
  });
});

// Test different box shadow
test.describe('Box Shadow Visual Regression', () => {
  test('box shadow variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different box shadow settings
    const boxShadows = ['none', '10px 10px 20px rgba(0,0,0,0.1)', 'inset 5px 5px 10px rgba(0,0,0,0.2)'];

    for (const boxShadow of boxShadows) {
      await page.evaluate((bs) => {
        document.body.style.boxShadow = bs;
      }, boxShadow);

      await expect(page).toHaveScreenshot(`box-shadow-${boxShadow.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
    }
  });
});

// Test different text shadow
test.describe('Text Shadow Visual Regression', () => {
  test('text shadow variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text shadow settings
    const textShadows = ['none', '2px 2px 4px rgba(0,0,0,0.3)', '0 0 10px rgba(255,0,0,0.5)'];

    for (const textShadow of textShadows) {
      await page.evaluate((ts) => {
        document.body.style.textShadow = ts;
      }, textShadow);

      await expect(page).toHaveScreenshot(`text-shadow-${textShadow.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
    }
  });
});

// Test different text decoration line
test.describe('Text Decoration Line Visual Regression', () => {
  test('text decoration line variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text decoration line settings
    const textDecorationLines = ['none', 'underline', 'overline', 'line-through', 'underline overline'];

    for (const textDecorationLine of textDecorationLines) {
      await page.evaluate((tdl) => {
        document.body.style.textDecorationLine = tdl;
      }, textDecorationLine);

      await expect(page).toHaveScreenshot(`text-decoration-line-${textDecorationLine.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different text decoration style
test.describe('Text Decoration Style Visual Regression', () => {
  test('text decoration style variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text decoration style settings
    const textDecorationStyles = ['solid', 'double', 'dotted', 'dashed', 'wavy'];

    for (const textDecorationStyle of textDecorationStyles) {
      await page.evaluate((tds) => {
        document.body.style.textDecorationStyle = tds;
      }, textDecorationStyle);

      await expect(page).toHaveScreenshot(`text-decoration-style-${textDecorationStyle}.png`);
    }
  });
});

// Test different text decoration color
test.describe('Text Decoration Color Visual Regression', () => {
  test('text decoration color variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text decoration color settings
    const textDecorationColors = ['currentColor', 'red', 'blue'];

    for (const textDecorationColor of textDecorationColors) {
      await page.evaluate((tdc) => {
        document.body.style.textDecorationColor = tdc;
      }, textDecorationColor);

      await expect(page).toHaveScreenshot(`text-decoration-color-${textDecorationColor}.png`);
    }
  });
});

// Test different text decoration thickness
test.describe('Text Decoration Thickness Visual Regression', () => {
  test('text decoration thickness variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text decoration thickness settings
    const textDecorationThicknesses = ['auto', 'from-font', '1px', '2px'];

    for (const textDecorationThickness of textDecorationThicknesses) {
      await page.evaluate((tdt) => {
        document.body.style.textDecorationThickness = tdt;
      }, textDecorationThickness);

      await expect(page).toHaveScreenshot(`text-decoration-thickness-${textDecorationThickness}.png`);
    }
  });
});

// Test different text underline offset
test.describe('Text Underline Offset Visual Regression', () => {
  test('text underline offset variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text underline offset settings
    const textUnderlineOffsets = ['auto', '1px', '5px'];

    for (const textUnderlineOffset of textUnderlineOffsets) {
      await page.evaluate((tuo) => {
        document.body.style.textUnderlineOffset = tuo;
      }, textUnderlineOffset);

      await expect(page).toHaveScreenshot(`text-underline-offset-${textUnderlineOffset}.png`);
    }
  });
});

// Test different text decoration skip ink
test.describe('Text Decoration Skip Ink Visual Regression', () => {
  test('text decoration skip ink variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text decoration skip ink settings
    const textDecorationSkipInks = ['none', 'auto', 'all'];

    for (const textDecorationSkipInk of textDecorationSkipInks) {
      await page.evaluate((tdsi) => {
        document.body.style.textDecorationSkipInk = tdsi;
      }, textDecorationSkipInk);

      await expect(page).toHaveScreenshot(`text-decoration-skip-ink-${textDecorationSkipInk}.png`);
    }
  });
});

// Test different text emphasis
test.describe('Text Emphasis Visual Regression', () => {
  test('text emphasis variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text emphasis settings
    const textEmphases = ['none', 'filled', 'open', 'dot', 'circle', 'double-circle', 'triangle', 'sesame'];

    for (const textEmphasis of textEmphases) {
      await page.evaluate((te) => {
        document.body.style.textEmphasis = te;
      }, textEmphasis);

      await expect(page).toHaveScreenshot(`text-emphasis-${textEmphasis}.png`);
    }
  });
});

// Test different text emphasis color
test.describe('Text Emphasis Color Visual Regression', () => {
  test('text emphasis color variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text emphasis color settings
    const textEmphasisColors = ['currentColor', 'red', 'blue'];

    for (const textEmphasisColor of textEmphasisColors) {
      await page.evaluate((tec) => {
        document.body.style.textEmphasisColor = tec;
      }, textEmphasisColor);

      await expect(page).toHaveScreenshot(`text-emphasis-color-${textEmphasisColor}.png`);
    }
  });
});

// Test different text emphasis style
test.describe('Text Emphasis Style Visual Regression', () => {
  test('text emphasis style variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text emphasis style settings
    const textEmphasisStyles = ['none', 'filled', 'open', 'dot', 'circle', 'double-circle', 'triangle', 'sesame'];

    for (const textEmphasisStyle of textEmphasisStyles) {
      await page.evaluate((tes) => {
        document.body.style.textEmphasisStyle = tes;
      }, textEmphasisStyle);

      await expect(page).toHaveScreenshot(`text-emphasis-style-${textEmphasisStyle}.png`);
    }
  });
});

// Test different text emphasis position
test.describe('Text Emphasis Position Visual Regression', () => {
  test('text emphasis position variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text emphasis position settings
    const textEmphasisPositions = ['over', 'under', 'right', 'left'];

    for (const textEmphasisPosition of textEmphasisPositions) {
      await page.evaluate((tep) => {
        document.body.style.textEmphasisPosition = tep;
      }, textEmphasisPosition);

      await expect(page).toHaveScreenshot(`text-emphasis-position-${textEmphasisPosition}.png`);
    }
  });
});

// Test different text justify
test.describe('Text Justify Visual Regression', () => {
  test('text justify variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text justify settings
    const textJustifys = ['auto', 'none', 'inter-word', 'inter-character'];

    for (const textJustify of textJustifys) {
      await page.evaluate((tj) => {
        document.body.style.textJustify = tj;
      }, textJustify);

      await expect(page).toHaveScreenshot(`text-justify-${textJustify}.png`);
    }
  });
});

// Test different text orientation
test.describe('Text Orientation Visual Regression', () => {
  test('text orientation variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text orientation settings
    const textOrientations = ['mixed', 'upright', 'sideways'];

    for (const textOrientation of textOrientations) {
      await page.evaluate((to) => {
        document.body.style.textOrientation = to;
      }, textOrientation);

      await expect(page).toHaveScreenshot(`text-orientation-${textOrientation}.png`);
    }
  });
});

// Test different text combine upright
test.describe('Text Combine Upright Visual Regression', () => {
  test('text combine upright variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different text combine upright settings
    const textCombineUprights = ['none', 'all', 'digits 2'];

    for (const textCombineUpright of textCombineUprights) {
      await page.evaluate((tcu) => {
        document.body.style.textCombineUpright = tcu;
      }, textCombineUpright);

      await expect(page).toHaveScreenshot(`text-combine-upright-${textCombineUpright.replace(/\s+/g, '-')}.png`);
    }
  });
});

// Test different unicode bidi
test.describe('Unicode Bidi Visual Regression', () => {
  test('unicode bidi variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different unicode bidi settings
    const unicodeBidis = ['normal', 'embed', 'bidi-override', 'isolate', 'isolate-override', 'plaintext'];

    for (const unicodeBidi of unicodeBidis) {
      await page.evaluate((ub) => {
        document.body.style.unicodeBidi = ub;
      }, unicodeBidi);

      await expect(page).toHaveScreenshot(`unicode-bidi-${unicodeBidi}.png`);
    }
  });
});

// Test different writing mode
test.describe('Writing Mode Visual Regression', () => {
  test('writing mode variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different writing mode settings
    const writingModes = ['horizontal-tb', 'vertical-rl', 'vertical-lr'];

    for (const writingMode of writingModes) {
      await page.evaluate((wm) => {
        document.body.style.writingMode = wm;
      }, writingMode);

      await expect(page).toHaveScreenshot(`writing-mode-${writingMode}.png`);
    }
  });
});

// Test different direction
test.describe('Direction Visual Regression', () => {
  test('direction variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different direction settings
    const directions = ['ltr', 'rtl'];

    for (const direction of directions) {
      await page.evaluate((d) => {
        document.body.style.direction = d;
      }, direction);

      await expect(page).toHaveScreenshot(`direction-${direction}.png`);
    }
  });
});

// Test different ruby position
test.describe('Ruby Position Visual Regression', () => {
  test('ruby position variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different ruby position settings
    const rubyPositions = ['over', 'under', 'alternate'];

    for (const rubyPosition of rubyPositions) {
      await page.evaluate((rp) => {
        document.body.style.rubyPosition = rp;
      }, rubyPosition);

      await expect(page).toHaveScreenshot(`ruby-position-${rubyPosition}.png`);
    }
  });
});

// Test different ruby align
test.describe('Ruby Align Visual Regression', () => {
  test('ruby align variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different ruby align settings
    const rubyAligns = ['start', 'center', 'space-between', 'space-around'];

    for (const rubyAlign of rubyAligns) {
      await page.evaluate((ra) => {
        document.body.style.rubyAlign = ra;
      }, rubyAlign);

      await expect(page).toHaveScreenshot(`ruby-align-${rubyAlign}.png`);
    }
  });
});

// Test different ruby merge
test.describe('Ruby Merge Visual Regression', () => {
  test('ruby merge variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different ruby merge settings
    const rubyMerges = ['separate', 'collapse'];

    for (const rubyMerge of rubyMerges) {
      await page.evaluate((rm) => {
        document.body.style.rubyMerge = rm;
      }, rubyMerge);

      await expect(page).toHaveScreenshot(`ruby-merge-${rubyMerge}.png`);
    }
  });
});

// Test different hanging punctuation
test.describe('Hanging Punctuation Visual Regression', () => {
  test('hanging punctuation variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different hanging punctuation settings
    const hangingPunctuations = ['none', 'first', 'last', 'allow-end', 'force-end'];

    for (const hangingPunctuation of hangingPunctuations) {
      await page.evaluate((hp) => {
        document.body.style.hangingPunctuation = hp;
      }, hangingPunctuation);

      await expect(page).toHaveScreenshot(`hanging-punctuation-${hangingPunctuation}.png`);
    }
  });
});

// Test different hyphens
test.describe('Hyphens Visual Regression', () => {
  test('hyphens variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different hyphens settings
    const hyphens = ['none', 'manual', 'auto'];

    for (const hyphen of hyphens) {
      await page.evaluate((h) => {
        document.body.style.hyphens = h;
      }, hyphen);

      await expect(page).toHaveScreenshot(`hyphens-${hyphen}.png`);
    }
  });
});

// Test different hyphenate character
test.describe('Hyphenate Character Visual Regression', () => {
  test('hyphenate character variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different hyphenate character settings
    const hyphenateCharacters = ['auto', '"-"', '"‐"'];

    for (const hyphenateCharacter of hyphenateCharacters) {
      await page.evaluate((hc) => {
        document.body.style.hyphenateCharacter = hc;
      }, hyphenateCharacter);

      await expect(page).toHaveScreenshot(`hyphenate-character-${hyphenateCharacter.replace(/"/g, '')}.png`);
    }
  });
});

// Test different line break
test.describe('Line Break Visual Regression', () => {
  test('line break variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different line break settings
    const lineBreaks = ['auto', 'loose', 'normal', 'strict', 'anywhere'];

    for (const lineBreak of lineBreaks) {
      await page.evaluate((lb) => {
        document.body.style.lineBreak = lb;
      }, lineBreak);

      await expect(page).toHaveScreenshot(`line-break-${lineBreak}.png`);
    }
  });
});

// Test different overflow wrap
test.describe('Overflow Wrap Visual Regression', () => {
  test('overflow wrap variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different overflow wrap settings
    const overflowWraps = ['normal', 'break-word', 'anywhere'];

    for (const overflowWrap of overflowWraps) {
      await page.evaluate((ow) => {
        document.body.style.overflowWrap = ow;
      }, overflowWrap);

      await expect(page).toHaveScreenshot(`overflow-wrap-${overflowWrap}.png`);
    }
  });
});

// Test different word break
test.describe('Word Break Visual Regression', () => {
  test('word break variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different word break settings
    const wordBreaks = ['normal', 'break-all', 'keep-all', 'break-word'];

    for (const wordBreak of wordBreaks) {
      await page.evaluate((wb) => {
        document.body.style.wordBreak = wb;
      }, wordBreak);

      await expect(page).toHaveScreenshot(`word-break-${wordBreak}.png`);
    }
  });
});

// Test different white space
test.describe('White Space Visual Regression', () => {
  test('white space variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different white space settings
    const whiteSpaces = ['normal', 'pre', 'nowrap', 'pre-wrap', 'pre-line', 'break-spaces'];

    for (const whiteSpace of whiteSpaces) {
      await page.evaluate((ws) => {
        document.body.style.whiteSpace = ws;
      }, whiteSpace);

      await expect(page).toHaveScreenshot(`white-space-${whiteSpace}.png`);
    }
  });
});

// Test different tab size
test.describe('Tab Size Visual Regression', () => {
  test('tab size variations', async ({ page }) => {
    await page.goto('/');
