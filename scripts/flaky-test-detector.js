#!/usr/bin/env node

/**
 * Flaky Test Detection System
 *
 * Analyzes test results to identify and quarantine flaky tests (< 1% target).
 * Provides automated retry configuration and historical analysis.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = resolve(__dirname, '..');
const REPORTS_DIR = join(ROOT_DIR, 'test-reports');
const FLAKY_TESTS_FILE = join(REPORTS_DIR, 'flaky-tests.json');

/**
 * Colors for console output
 */
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

/**
 * Log with colors
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Execute shell command
 */
function exec(command, cwd = ROOT_DIR) {
  try {
    return execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (error) {
    return error.stdout || '';
  }
}

/**
 * Load flaky tests data
 */
function loadFlakyTestsData() {
  if (!existsSync(FLAKY_TESTS_FILE)) {
    return {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      flakyTests: [],
      quarantinedTests: [],
      analysisHistory: []
    };
  }

  try {
    return JSON.parse(readFileSync(FLAKY_TESTS_FILE, 'utf8'));
  } catch (error) {
    log(`Failed to load flaky tests data: ${error.message}`, colors.red);
    return {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      flakyTests: [],
      quarantinedTests: [],
      analysisHistory: []
    };
  }
}

/**
 * Save flaky tests data
 */
function saveFlakyTestsData(data) {
  try {
    if (!existsSync(REPORTS_DIR)) {
      mkdirSync(REPORTS_DIR, { recursive: true });
    }
    writeFileSync(FLAKY_TESTS_FILE, JSON.stringify(data, null, 2));
    log(`Flaky tests data saved to: ${FLAKY_TESTS_FILE}`, colors.green);
  } catch (error) {
    log(`Failed to save flaky tests data: ${error.message}`, colors.red);
  }
}

/**
 * Run test suite and collect results
 */
function runTestSuite() {
  log('\n🧪 Running test suite for flaky detection...', colors.blue);

  try {
    // Run backend tests
    log('Running backend tests...', colors.cyan);
    const backendOutput = exec('pnpm --filter backend run test:coverage', join(ROOT_DIR, 'backend'));

    // Run frontend tests
    log('Running frontend tests...', colors.cyan);
    const frontendOutput = exec('pnpm --filter frontend run test:run', join(ROOT_DIR, 'frontend'));

    return {
      backend: parseTestOutput(backendOutput, 'backend'),
      frontend: parseTestOutput(frontendOutput, 'frontend')
    };
  } catch (error) {
    log(`Failed to run test suite: ${error.message}`, colors.red);
    return { backend: [], frontend: [] };
  }
}

/**
 * Parse test output to extract test results
 */
function parseTestOutput(output, workspace) {
  const tests = [];
  const lines = output.split('\n');

  let currentTest = null;

  for (const line of lines) {
    // Match Jest/Vitest test patterns
    const testMatch = line.match(/● (.*?) › (.*?)$/);
    const resultMatch = line.match(/✓|✗|○/);

    if (testMatch) {
      currentTest = {
        workspace,
        suite: testMatch[1],
        name: testMatch[2],
        status: 'unknown',
        duration: 0,
        error: null
      };
    }

    if (currentTest && resultMatch) {
      currentTest.status = resultMatch[0] === '✓' ? 'passed' : 'failed';
      tests.push(currentTest);
      currentTest = null;
    }

    // Extract error information
    if (currentTest && line.includes('Error:')) {
      currentTest.error = line.trim();
    }
  }

  return tests;
}

/**
 * Analyze test results for flaky patterns
 */
function analyzeFlakyTests(testResults, _historicalData) {
  log('\n📊 Analyzing test results for flaky patterns...', colors.blue);

  const flakyCandidates = [];
  const allTests = [...testResults.backend, ...testResults.frontend];

  // Group tests by name
  const testGroups = {};
  allTests.forEach(test => {
    const key = `${test.workspace}:${test.suite}:${test.name}`;
    if (!testGroups[key]) {
      testGroups[key] = [];
    }
    testGroups[key].push(test);
  });

  // Analyze each test group for flakiness
  Object.entries(testGroups).forEach(([key, tests]) => {
    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    const total = tests.length;
    const failureRate = (failed / total) * 100;

    // Consider a test flaky if it fails between 10% and 90% of the time
    if (total >= 3 && failureRate > 10 && failureRate < 90) {
      flakyCandidates.push({
        key,
        workspace: tests[0].workspace,
        suite: tests[0].suite,
        name: tests[0].name,
        totalRuns: total,
        passed,
        failed,
        failureRate: Math.round(failureRate * 100) / 100,
        errors: tests.filter(t => t.error).map(t => t.error),
        severity: failureRate > 50 ? 'high' : 'medium'
      });
    }
  });

  return flakyCandidates.sort((a, b) => b.failureRate - a.failureRate);
}

/**
 * Generate retry configuration for flaky tests
 */
function generateRetryConfiguration(flakyTests) {
  log('\n⚙️  Generating retry configuration...', colors.blue);

  const retryConfig = {
    // Global retry settings
    global: {
      retries: 2,
      retryDelay: 1000,
      maxRetryDelay: 5000
    },

    // Workspace-specific settings
    workspaces: {
      backend: {
        testEnvironment: 'node',
        setupFilesAfterEnv: ['./src/test/setup.ts'],
        retryTimes: 2
      },
      frontend: {
        testEnvironment: 'jsdom',
        retryTimes: 1
      }
    },

    // Flaky test specific overrides
    testOverrides: {}
  };

  // Add specific retry configurations for flaky tests
  flakyTests.forEach(test => {
    const testKey = `${test.workspace}:${test.suite}:${test.name}`;
    retryConfig.testOverrides[testKey] = {
      retryTimes: test.severity === 'high' ? 3 : 2,
      retryDelay: 2000,
      maxRetryDelay: 10000
    };
  });

  return retryConfig;
}

/**
 * Generate Jest configuration with flaky test handling
 */
function generateJestConfigWithFlakyHandling(retryConfig) {
  const jestConfig = {
    // Base configuration
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/test'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],

    // Flaky test handling
    retryTimes: retryConfig.global.retries,
    retryDelay: retryConfig.global.retryDelay,

    // Setup and teardown
    setupFilesAfterEnv: ['./src/test/setup.ts'],
    clearMocks: true,
    restoreMocks: true,

    // Coverage configuration
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
      '!src/**/index.ts',
      '!src/**/*.module.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'json', 'html'],

    // Test timeout and isolation
    testTimeout: 10000,
    maxWorkers: '50%',
    detectOpenHandles: true,
    forceExit: true,

    // Module resolution
    moduleNameMapping: {
      '^@/(.*)$': '<rootDir>/src/$1'
    },

    // Transform configuration
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },

    // Test path ignore patterns
    testPathIgnorePatterns: [
      '/node_modules/',
      '/dist/',
      '/coverage/'
    ]
  };

  return jestConfig;
}

/**
 * Generate quarantine recommendations
 */
function generateQuarantineRecommendations(flakyTests) {
  log('\n🚫 Generating quarantine recommendations...', colors.blue);

  const recommendations = {
    immediateQuarantine: [],
    monitorClosely: [],
    investigate: []
  };

  flakyTests.forEach(test => {
    if (test.failureRate > 80) {
      recommendations.immediateQuarantine.push({
        test: test.key,
        reason: `Extremely high failure rate (${test.failureRate}%)`,
        priority: 'critical'
      });
    } else if (test.failureRate > 50) {
      recommendations.monitorClosely.push({
        test: test.key,
        reason: `High failure rate (${test.failureRate}%)`,
        priority: 'high'
      });
    } else {
      recommendations.investigate.push({
        test: test.key,
        reason: `Moderate failure rate (${test.failureRate}%)`,
        priority: 'medium'
      });
    }
  });

  return recommendations;
}

/**
 * Generate comprehensive report
 */
function generateReport(flakyTests, retryConfig, quarantineRecommendations) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFlakyTests: flakyTests.length,
      highSeverity: flakyTests.filter(t => t.severity === 'high').length,
      mediumSeverity: flakyTests.filter(t => t.severity === 'medium').length,
      overallFlakyRate: 0
    },
    flakyTests,
    retryConfiguration: retryConfig,
    quarantineRecommendations,
    analysis: {
      totalTestsAnalyzed: 0,
      flakyPercentage: 0,
      targetMet: false
    }
  };

  // Calculate overall flaky rate
  if (flakyTests.length > 0) {
    const totalFailures = flakyTests.reduce((sum, test) => sum + test.failed, 0);
    const totalRuns = flakyTests.reduce((sum, test) => sum + test.totalRuns, 0);
    report.summary.overallFlakyRate = Math.round((totalFailures / totalRuns) * 10000) / 100;
  }

  // Check if target is met (< 1% flaky rate)
  report.analysis.targetMet = report.summary.overallFlakyRate < 1.0;

  // Calculate additional metrics
  report.analysis.totalTestsAnalyzed = flakyTests.reduce((sum, test) => sum + test.totalRuns, 0);
  report.analysis.flakyPercentage = report.summary.totalFlakyTests > 0 ?
    (report.summary.totalFlakyTests / report.analysis.totalTestsAnalyzed) * 100 : 0;

  return report;
}

/**
 * Display results
 */
function displayResults(report) {
  log('\n' + '='.repeat(70), colors.bright);
  log('🔍 FLAKY TEST DETECTION REPORT', colors.bright + colors.magenta);
  log('='.repeat(70), colors.bright);

  // Summary
  const targetColor = report.analysis.targetMet ? colors.green : colors.red;
  log(`Target (< 1% flaky rate): ${targetColor}${report.analysis.targetMet ? 'MET' : 'NOT MET'}${colors.reset}`, colors.bright);
  log(`Overall Flaky Rate: ${report.summary.overallFlakyRate}%`, colors.bright);
  log(`Total Flaky Tests: ${report.summary.totalFlakyTests}`, colors.bright);
  log(`High Severity: ${report.summary.highSeverity}`, colors.bright);
  log(`Medium Severity: ${report.summary.mediumSeverity}`, colors.bright);

  // Flaky tests details
  if (report.flakyTests.length > 0) {
    log('\n❌ FLAKY TESTS DETECTED:', colors.red + colors.bright);
    report.flakyTests.forEach(test => {
      const severityColor = test.severity === 'high' ? colors.red : colors.yellow;
      log(`  ${severityColor}${test.name}${colors.reset}`, colors.bright);
      log(`    Location: ${test.workspace}/${test.suite}`, colors.cyan);
      log(`    Failure Rate: ${test.failureRate}% (${test.failed}/${test.totalRuns})`);
      if (test.errors.length > 0) {
        log(`    Common Errors: ${test.errors.slice(0, 2).join(', ')}`);
      }
    });
  } else {
    log('\n✅ NO FLAKY TESTS DETECTED!', colors.green + colors.bright);
  }

  // Quarantine recommendations
  if (report.quarantineRecommendations.immediateQuarantine.length > 0) {
    log('\n🚫 IMMEDIATE QUARANTINE RECOMMENDED:', colors.red + colors.bright);
    report.quarantineRecommendations.immediateQuarantine.forEach(rec => {
      log(`  ${rec.test}: ${rec.reason}`, colors.red);
    });
  }

  // Retry configuration
  log('\n⚙️  RETRY CONFIGURATION:', colors.blue + colors.bright);
  log(`  Global Retries: ${report.retryConfiguration.global.retries}`, colors.cyan);
  log(`  Retry Delay: ${report.retryConfiguration.global.retryDelay}ms`, colors.cyan);

  log('\n' + '='.repeat(70), colors.bright);
}

/**
 * Main execution function
 */
async function main() {
  log('🚀 Starting Flaky Test Detection System...', colors.bright + colors.green);

  try {
    // Load historical data
    const historicalData = loadFlakyTestsData();

    // Run test suite and collect results
    const testResults = runTestSuite();

    // Analyze for flaky patterns
    const flakyTests = analyzeFlakyTests(testResults, historicalData);

    // Generate retry configuration
    const retryConfig = generateRetryConfiguration(flakyTests);

    // Generate quarantine recommendations
    const quarantineRecommendations = generateQuarantineRecommendations(flakyTests);

    // Generate comprehensive report
    const report = generateReport(flakyTests, retryConfig, quarantineRecommendations);

    // Display results
    displayResults(report);

    // Update historical data
    historicalData.flakyTests = flakyTests;
    historicalData.analysisHistory.push({
      timestamp: report.timestamp,
      flakyCount: flakyTests.length,
      flakyRate: report.summary.overallFlakyRate
    });
    historicalData.lastUpdated = report.timestamp;

    // Save updated data
    saveFlakyTestsData(historicalData);

    // Generate Jest configuration file
    const jestConfigPath = join(ROOT_DIR, 'backend', 'jest.config.flaky.js');
    const jestConfig = generateJestConfigWithFlakyHandling(retryConfig);
    writeFileSync(jestConfigPath, `module.exports = ${JSON.stringify(jestConfig, null, 2)};`);

    // Exit with appropriate code
    const hasHighSeverityFlakyTests = report.summary.highSeverity > 0;
    process.exit(hasHighSeverityFlakyTests ? 1 : 0);

  } catch (error) {
    log(`Fatal error: ${error.message}`, colors.red + colors.bright);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as detectFlakyTests };
