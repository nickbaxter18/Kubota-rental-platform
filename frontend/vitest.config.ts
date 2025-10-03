import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    // Enhanced test configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'dist/',
        'build/',
        'e2e/',
        'cypress/',
        'storybook-static/',
        '.next/',
        'next.config.js',
        'postcss.config.js',
        'tailwind.config.js',
        'vitest.config.ts',
        'playwright.config.ts',
        'jest.config.js',
        'src/types/**',
        'src/styles/**',
        'src/middleware.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Higher thresholds for critical components
        './src/components/': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        // Business logic components need highest coverage
        './src/components/BookingFlow.tsx': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        // API and data handling
        './src/lib/': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Hooks need good coverage for state management
        './src/hooks/': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        // App router pages
        './src/app/': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      // Watermarks for coverage quality levels
      watermarks: {
        lines: [80, 95],
        functions: [80, 95],
        branches: [80, 95],
        statements: [80, 95],
      },
      // Include source maps for accurate reporting
      all: true,
      include: ['src/**/*.{ts,tsx}'],
    },
    // Performance optimizations
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        useAtomics: true,
      },
    },
    // Test timeout and retry configuration
    testTimeout: 15000,
    retry: 2,
    // Bail out after first test failure in CI
    bail: process.env.CI ? 1 : 0,
    // Reporter configuration
    reporters: process.env.CI ? ['verbose', 'github-actions'] : ['verbose'],
    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
