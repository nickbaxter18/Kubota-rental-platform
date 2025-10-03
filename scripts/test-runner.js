#!/usr/bin/env node

/**
 * Single-Command Test Execution System
 *
 * Provides unified test execution for all test types with watch modes,
 * VSCode debugging profiles, and comprehensive reporting.
 */

import { execSync, spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = resolve(__dirname, '..');

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
 * Test modes
 */
const TestMode = {
  ALL: 'all',
  UNIT: 'unit',
  INTEGRATION: 'integration',
  E2E: 'e2e',
  CRITICAL: 'critical',
  COVERAGE: 'coverage',
  WATCH: 'watch',
  DEBUG: 'debug'
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
 * Generate VSCode debugging configuration
 */
function generateVSCodeDebugConfig() {
  log('\n🔧 Generating VSCode debugging profiles...', colors.blue);

  const debugConfig = {
    version: '0.2.0',
    configurations: [
      {
        name: 'Debug Backend Tests',
        type: 'node',
        request: 'launch',
        program: '${workspaceFolder}/backend/node_modules/.bin/jest',
        args: [
          '--runInBand',
          '--watchAll=false',
          '--testTimeout=10000'
        ],
        cwd: '${workspaceFolder}/backend',
        console: 'integratedTerminal',
        internalConsoleOptions: 'neverOpen',
        env: {
          NODE_ENV: 'test',
          DB_HOST: 'localhost',
          DB_PORT: '5433',
          DB_USERNAME: 'postgres',
          DB_PASSWORD: 'postgres',
          DB_DATABASE: 'test'
        },
        sourceMaps: true,
        smartStep: true
      },
      {
        name: 'Debug Frontend Tests',
        type: 'node',
        request: 'launch',
        program: '${workspaceFolder}/frontend/node_modules/.bin/vitest',
        args: [
          'run',
          '--reporter=verbose'
        ],
        cwd: '${workspaceFolder}/frontend',
        console: 'integratedTerminal',
        internalConsoleOptions: 'neverOpen',
        env: {
          NODE_ENV: 'test'
        },
        sourceMaps: true
      },
      {
        name: 'Debug E2E Tests',
        type: 'node',
        request: 'launch',
        program: '${workspaceFolder}/frontend/node_modules/.bin/playwright',
        args: [
          'test',
          '--debug'
        ],
        cwd: '${workspaceFolder}/frontend',
        console: 'integratedTerminal',
        internalConsoleOptions: 'neverOpen',
        env: {
          NODE_ENV: 'test'
        }
      },
      {
        name: 'Debug Critical Path Tests',
        type: 'node',
        request: 'launch',
        program: '${workspaceFolder}/backend/node_modules/.bin/jest',
        args: [
          '--testPathPattern=critical',
          '--runInBand',
          '--verbose'
        ],
        cwd: '${workspaceFolder}/backend',
        console: 'integratedTerminal',
        internalConsoleOptions: 'neverOpen',
        env: {
          NODE_ENV: 'test'
        }
      }
    ]
  };

  const configPath = join(ROOT_DIR, '.vscode', 'launch.json');
  try {
    writeFileSync(configPath, JSON.stringify(debugConfig, null, 2));
    log(`VSCode debug configuration saved to: ${configPath}`, colors.green);
  } catch (error) {
    log(`Failed to save VSCode debug config: ${error.message}`, colors.red);
  }
}

/**
 * Run unit tests
 */
function runUnitTests(watch = false) {
  log('\n🧪 Running unit tests...', colors.blue);

  try {
    if (watch) {
      log('Starting unit tests in watch mode...', colors.cyan);
      const backendProcess = spawn('pnpm', ['--filter', 'backend', 'run', 'test:watch'], {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        detached: false
      });

      const frontendProcess = spawn('pnpm', ['--filter', 'frontend', 'run', 'test:ui'], {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        detached: false
      });

      // Handle process termination
      process.on('SIGINT', () => {
        log('\nTerminating test processes...', colors.yellow);
        backendProcess.kill('SIGINT');
        frontendProcess.kill('SIGINT');
        process.exit(0);
      });

      return { backend: backendProcess, frontend: frontendProcess };
    } else {
      const backendOutput = exec('pnpm --filter backend run test', join(ROOT_DIR, 'backend'));
      const frontendOutput = exec('pnpm --filter frontend run test:run', join(ROOT_DIR, 'frontend'));

      return {
        backend: backendOutput,
        frontend: frontendOutput
      };
    }
  } catch (error) {
    log(`Unit test execution failed: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Run integration tests
 */
function runIntegrationTests() {
  log('\n🔗 Running integration tests...', colors.blue);

  try {
    const output = exec('pnpm --recursive run test:integration', ROOT_DIR);
    return output;
  } catch (error) {
    log(`Integration test execution failed: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Run E2E tests
 */
function runE2ETests() {
  log('\n🌐 Running E2E tests...', colors.blue);

  try {
    const output = exec('pnpm --filter frontend run test:e2e', join(ROOT_DIR, 'frontend'));
    return output;
  } catch (error) {
    log(`E2E test execution failed: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Run critical path tests
 */
function runCriticalTests() {
  log('\n🚨 Running critical path tests...', colors.blue);

  try {
    const output = exec('pnpm --filter backend run test:critical', join(ROOT_DIR, 'backend'));
    return output;
  } catch (error) {
    log(`Critical test execution failed: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Run coverage tests
 */
function runCoverageTests() {
  log('\n📊 Running coverage tests...', colors.blue);

  try {
    const output = exec('pnpm --recursive run test:coverage', ROOT_DIR);
    return output;
  } catch (error) {
    log(`Coverage test execution failed: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Run accessibility tests
 */
function runAccessibilityTests() {
  log('\n♿ Running accessibility tests...', colors.blue);

  try {
    const output = exec('pnpm --filter frontend run test:accessibility', join(ROOT_DIR, 'frontend'));
    return output;
  } catch (error) {
    log(`Accessibility test execution failed: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Run performance tests
 */
function runPerformanceTests() {
  log('\n⚡ Running performance tests...', colors.blue);

  try {
    const output = exec('pnpm --filter frontend run test:performance', join(ROOT_DIR, 'frontend'));
    return output;
  } catch (error) {
    log(`Performance test execution failed: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Run all tests in sequence
 */
function runAllTests() {
  log('\n🏃 Running complete test suite...', colors.bright + colors.green);

  const results = {
    critical: runCriticalTests(),
    unit: runUnitTests(),
    integration: runIntegrationTests(),
    coverage: runCoverageTests(),
    accessibility: runAccessibilityTests(),
    performance: runPerformanceTests(),
    e2e: runE2ETests()
  };

  return results;
}

/**
 * Display test results summary
 */
function displayTestSummary(results) {
  log('\n📋 Test Execution Summary:', colors.bright);
  log('='.repeat(50), colors.bright);

  Object.entries(results).forEach(([testType, output]) => {
    if (output) {
      const status = output.includes('failing') || output.includes('failed') ? colors.red + '❌' : colors.green + '✅';
      log(`${status} ${testType.toUpperCase()}: ${output.includes('failing') || output.includes('failed') ? 'FAILED' : 'PASSED'}${colors.reset}`);
    } else {
      log(`${colors.yellow}⚠️  ${testType.toUpperCase()}: SKIPPED${colors.reset}`);
    }
  });

  log('='.repeat(50), colors.bright);
}

/**
 * Generate test execution report
 */
function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTestTypes: Object.keys(results).length,
      passed: 0,
      failed: 0,
      skipped: 0
    },
    results: results,
    recommendations: []
  };

  Object.entries(results).forEach(([testType, output]) => {
    if (output) {
      if (output.includes('failing') || output.includes('failed')) {
        report.summary.failed++;
        report.recommendations.push({
          type: testType,
          priority: 'high',
          message: `${testType} tests are failing`,
          details: output.substring(0, 500)
        });
      } else {
        report.summary.passed++;
      }
    } else {
      report.summary.skipped++;
    }
  });

  return report;
}

/**
 * Save test report
 */
function saveTestReport(report) {
  const reportPath = join(ROOT_DIR, 'test-execution-report.json');

  try {
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`Test report saved to: ${reportPath}`, colors.green);
  } catch (error) {
    log(`Failed to save test report: ${error.message}`, colors.red);
  }
}

/**
 * Setup test environment
 */
function setupTestEnvironment() {
  log('\n🔧 Setting up test environment...', colors.blue);

  try {
    // Install dependencies
    log('Installing dependencies...', colors.cyan);
    exec('pnpm install');

    // Validate environment
    log('Validating environment...', colors.cyan);
    exec('pnpm validate:environment');

    // Generate VSCode debug config
    generateVSCodeDebugConfig();

    log('Test environment setup complete!', colors.green);
  } catch (error) {
    log(`Environment setup failed: ${error.message}`, colors.red);
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || TestMode.ALL;
  const watch = args.includes('--watch');

  log('🚀 Starting Single-Command Test Execution System...', colors.bright + colors.green);

  try {
    // Setup environment if requested
    if (args.includes('--setup')) {
      setupTestEnvironment();
      return;
    }

    let results;

    switch (mode) {
      case TestMode.UNIT:
        results = { unit: runUnitTests(watch) };
        break;
      case TestMode.INTEGRATION:
        results = { integration: runIntegrationTests() };
        break;
      case TestMode.E2E:
        results = { e2e: runE2ETests() };
        break;
      case TestMode.CRITICAL:
        results = { critical: runCriticalTests() };
        break;
      case TestMode.COVERAGE:
        results = { coverage: runCoverageTests() };
        break;
      case TestMode.WATCH:
        results = { unit: runUnitTests(true) };
        break;
      case TestMode.DEBUG:
        generateVSCodeDebugConfig();
        log('VSCode debug configuration generated. Attach debugger to run tests.', colors.green);
        return;
      case TestMode.ALL:
      default:
        results = runAllTests();
        break;
    }

    // Display summary
    displayTestSummary(results);

    // Generate and save report
    const report = generateTestReport(results);
    saveTestReport(report);

    // Exit with appropriate code
    const hasFailures = Object.values(results).some(output =>
      output && (output.includes('failing') || output.includes('failed'))
    );

    process.exit(hasFailures ? 1 : 0);

  } catch (error) {
    log(`Fatal error: ${error.message}`, colors.red + colors.bright);
    process.exit(1);
  }
}

/**
 * Display help information
 */
function displayHelp() {
  log('\n📖 Single-Command Test Execution System', colors.bright + colors.cyan);
  log('='.repeat(60), colors.bright);

  log('\nUsage:', colors.bright);
  log('  node scripts/test-runner.js [mode] [options]', colors.green);

  log('\nModes:', colors.bright);
  log('  all          Run all tests (default)', colors.cyan);
  log('  unit         Run unit tests only', colors.cyan);
  log('  integration  Run integration tests only', colors.cyan);
  log('  e2e          Run E2E tests only', colors.cyan);
  log('  critical     Run critical path tests only', colors.cyan);
  log('  coverage     Run tests with coverage', colors.cyan);
  log('  watch        Run unit tests in watch mode', colors.cyan);
  log('  debug        Generate VSCode debug configuration', colors.cyan);

  log('\nOptions:', colors.bright);
  log('  --watch      Enable watch mode for unit tests', colors.green);
  log('  --setup      Setup test environment and generate configs', colors.green);

  log('\nExamples:', colors.bright);
  log('  node scripts/test-runner.js all', colors.yellow);
  log('  node scripts/test-runner.js unit --watch', colors.yellow);
  log('  node scripts/test-runner.js critical', colors.yellow);
  log('  node scripts/test-runner.js --setup', colors.yellow);

  log('\n' + '='.repeat(60), colors.bright);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    displayHelp();
  } else {
    main();
  }
}

export {
    generateVSCodeDebugConfig, runAccessibilityTests, runAllTests, runCoverageTests, runCriticalTests, runE2ETests, runIntegrationTests, runPerformanceTests, runUnitTests, setupTestEnvironment
};

