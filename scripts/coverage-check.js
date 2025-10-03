#!/usr/bin/env node

/**
 * Coverage Threshold Checker
 * Validates that test coverage meets minimum requirements
 */

const fs = require('fs');
const path = require('path');

// Coverage thresholds (matching our config files)
const THRESHOLDS = {
  global: {
    branches: 75,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  // Frontend specific thresholds
  frontend: {
    './src/components/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/components/BookingFlow.tsx': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  // Backend specific thresholds
  backend: {
    './src/bookings/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/payments/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};

function checkCoverage(coveragePath, project) {
  const coverageFile = path.join(coveragePath, 'coverage-summary.json');

  if (!fs.existsSync(coverageFile)) {
    console.error(`❌ No coverage file found at: ${coverageFile}`);
    console.error('💡 Run tests with coverage first: pnpm run test:coverage');
    return false;
  }

  const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
  const total = coverage.total;

  console.log(`\n📊 Checking ${project} coverage thresholds...\n`);

  let allPassed = true;
  const projectThresholds = THRESHOLDS[project] || {};

  // Check global thresholds
  console.log('🌍 Global Coverage:');
  Object.entries(THRESHOLDS.global).forEach(([metric, threshold]) => {
    const actual = total[metric].pct;
    const status = actual >= threshold ? '✅' : '❌';
    const color = actual >= threshold ? '\x1b[32m' : '\x1b[31m';

    console.log(`${status} ${metric}: ${color}${actual}%\x1b[0m (required: ${threshold}%)`);

    if (actual < threshold) {
      allPassed = false;
    }
  });

  // Check project-specific thresholds
  if (Object.keys(projectThresholds).length > 0) {
    console.log(`\n📁 ${project} Specific Coverage:`);

    Object.entries(projectThresholds).forEach(([filePattern, thresholds]) => {
      // Find matching files in coverage report
      const files = Object.keys(coverage).filter(file => file.includes(filePattern.replace('./', '')));

      if (files.length > 0) {
        files.forEach(file => {
          const fileCoverage = coverage[file];
          console.log(`\n  📄 ${file}:`);

          Object.entries(thresholds).forEach(([metric, threshold]) => {
            const actual = fileCoverage[metric].pct;
            const status = actual >= threshold ? '✅' : '❌';
            const color = actual >= threshold ? '\x1b[32m' : '\x1b[31m';

            console.log(`    ${status} ${metric}: ${color}${actual}%\x1b[0m (required: ${threshold}%)`);

            if (actual < threshold) {
              allPassed = false;
            }
          });
        });
      }
    });
  }

  return allPassed;
}

function main() {
  console.log('🚀 Coverage Threshold Validation\n');

  let overallSuccess = true;

  // Check frontend coverage
  if (fs.existsSync('./frontend/coverage/coverage-summary.json') ||
      fs.existsSync('./coverage/coverage-summary.json')) {
    const frontendPath = fs.existsSync('./frontend/coverage') ? './frontend/coverage' : './coverage';
    const frontendPassed = checkCoverage(frontendPath, 'frontend');
    overallSuccess = overallSuccess && frontendPassed;
  }

  // Check backend coverage
  if (fs.existsSync('./backend/coverage/coverage-summary.json') ||
      fs.existsSync('./coverage/coverage-summary.json')) {
    const backendPath = fs.existsSync('./backend/coverage') ? './backend/coverage' : './coverage';
    const backendPassed = checkCoverage(backendPath, 'backend');
    overallSuccess = overallSuccess && backendPassed;
  }

  if (overallSuccess) {
    console.log('\n🎉 All coverage thresholds passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some coverage thresholds failed!');
    console.log('\n💡 Tips to improve coverage:');
    console.log('  • Add more test cases for uncovered lines');
    console.log('  • Focus on branch coverage with different input scenarios');
    console.log('  • Test error conditions and edge cases');
    console.log('  • Mock external dependencies properly');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkCoverage, THRESHOLDS };
