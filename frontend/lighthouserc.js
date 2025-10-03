/**
 * Lighthouse Performance Configuration
 *
 * Defines performance thresholds and baseline configurations for automated testing
 */

module.exports = {
  ci: {
    collect: {
      staticDistDir: './.next',
      url: [
        'http://localhost:3000',
        'http://localhost:3000/book',
        'http://localhost:3000/equipment'
      ],
      startServerCommand: 'pnpm dev',
      startServerReadyPattern: 'Ready - started server',
      startServerReadyTimeout: 10000
    },
    assert: {
      assertions: {
        // Performance thresholds - Strict budgets for production
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],

        // Core Web Vitals - Google's recommended targets
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],

        // Bundle size limits - Optimized for performance
        'resource-summary:javascript': ['error', { maxNumericValue: 350000 }], // 350KB
        'resource-summary:css': ['error', { maxNumericValue: 75000 }], // 75KB
        'resource-summary:image': ['error', { maxNumericValue: 750000 }], // 750KB

        // Specific page requirements - Higher standards
        'categories:performance': [
          'error',
          { minScore: 0.9, maxScore: 1.0 }
        ]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports',
      reportFilenamePattern: 'lighthouse-report-%%PATHNAME%%-%%DATETIME%%.json'
    }
  }
};
