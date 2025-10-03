#!/usr/bin/env node

/**
 * Real-time Monitoring & Alerting System
 *
 * Provides Slack notifications, contextual alerts, and performance degradation monitoring
 * for test infrastructure and application health.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = resolve(__dirname, '..');
const ALERTS_CONFIG = join(ROOT_DIR, 'alerts-config.json');

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
 * Alert severity levels
 */
const AlertSeverity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
};

/**
 * Alert types
 */
const AlertType = {
  TEST_FAILURE: 'test_failure',
  PERFORMANCE_DEGRADATION: 'performance_degradation',
  DEPLOYMENT_ISSUE: 'deployment_issue',
  SECURITY_VULNERABILITY: 'security_vulnerability',
  DEPENDENCY_CONFLICT: 'dependency_conflict',
  FLAKY_TEST_DETECTED: 'flaky_test_detected',
  COVERAGE_DROP: 'coverage_drop',
  BUILD_FAILURE: 'build_failure'
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
 * Load alerts configuration
 */
function loadAlertsConfig() {
  if (!existsSync(ALERTS_CONFIG)) {
    return {
      version: '1.0',
      enabled: true,
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
        channel: process.env.SLACK_CHANNEL || '#alerts',
        username: 'Test Infrastructure Monitor',
        iconEmoji: ':warning:'
      },
      thresholds: {
        performanceDrop: 10, // 10% performance drop
        coverageDrop: 5, // 5% coverage drop
        flakyTestRate: 1, // 1% flaky test rate
        maxTestDuration: 300000, // 5 minutes
        maxMemoryUsage: 512 // 512MB
      },
      recipients: {
        critical: ['devops-team', 'engineering-lead'],
        high: ['development-team'],
        medium: ['qa-team'],
        low: []
      },
      cooldown: {
        critical: 300000, // 5 minutes
        high: 600000, // 10 minutes
        medium: 1800000, // 30 minutes
        low: 3600000 // 1 hour
      }
    };
  }

  try {
    return JSON.parse(readFileSync(ALERTS_CONFIG, 'utf8'));
  } catch (error) {
    log(`Failed to load alerts config: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Save alerts configuration
 */
function saveAlertsConfig(config) {
  try {
    writeFileSync(ALERTS_CONFIG, JSON.stringify(config, null, 2));
    log(`Alerts configuration saved to: ${ALERTS_CONFIG}`, colors.green);
  } catch (error) {
    log(`Failed to save alerts config: ${error.message}`, colors.red);
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(message, severity = AlertSeverity.MEDIUM) {
  const config = loadAlertsConfig();

  if (!config?.slack?.webhookUrl) {
    log('Slack webhook URL not configured', colors.yellow);
    return;
  }

  const colors = {
    critical: '#FF0000',
    high: '#FF8C00',
    medium: '#FFD700',
    low: '#32CD32',
    info: '#1E90FF'
  };

  const payload = {
    channel: config.slack.channel,
    username: config.slack.username,
    icon_emoji: config.slack.iconEmoji,
    attachments: [
      {
        color: colors[severity],
        title: `🚨 ${severity.toUpperCase()} Alert`,
        text: message,
        ts: Math.floor(Date.now() / 1000),
        footer: 'Test Infrastructure Monitor'
      }
    ]
  };

  try {
    const response = await fetch(config.slack.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      log(`Slack notification sent for ${severity} alert`, colors.green);
    } else {
      log(`Failed to send Slack notification: ${response.status}`, colors.red);
    }
  } catch (error) {
    log(`Error sending Slack notification: ${error.message}`, colors.red);
  }
}

/**
 * Check test failure patterns
 */
function checkTestFailures() {
  log('\n🔍 Checking for test failures...', colors.blue);

  const alerts = [];

  try {
    // Check backend test results
    const backendTestOutput = exec('pnpm --filter backend run test:coverage', join(ROOT_DIR, 'backend'));

    if (backendTestOutput.includes('failing') || backendTestOutput.includes('failed')) {
      const failureCount = (backendTestOutput.match(/✗|failed/gi) || []).length;

      alerts.push({
        type: AlertType.TEST_FAILURE,
        severity: AlertSeverity.HIGH,
        title: 'Backend Test Failures Detected',
        message: `Found ${failureCount} failing tests in backend`,
        details: {
          workspace: 'backend',
          output: backendTestOutput.substring(0, 1000)
        }
      });
    }

    // Check frontend test results
    const frontendTestOutput = exec('pnpm --filter frontend run test:run', join(ROOT_DIR, 'frontend'));

    if (frontendTestOutput.includes('failing') || frontendTestOutput.includes('failed')) {
      const failureCount = (frontendTestOutput.match(/✗|failed/gi) || []).length;

      alerts.push({
        type: AlertType.TEST_FAILURE,
        severity: AlertSeverity.HIGH,
        title: 'Frontend Test Failures Detected',
        message: `Found ${failureCount} failing tests in frontend`,
        details: {
          workspace: 'frontend',
          output: frontendTestOutput.substring(0, 1000)
        }
      });
    }

  } catch (error) {
    alerts.push({
      type: AlertType.TEST_FAILURE,
      severity: AlertSeverity.CRITICAL,
      title: 'Test Execution Error',
      message: `Failed to execute tests: ${error.message}`,
      details: { error: error.message }
    });
  }

  return alerts;
}

/**
 * Check performance degradation
 */
function checkPerformanceDegradation() {
  log('\n📈 Checking for performance degradation...', colors.blue);

  const alerts = [];

  try {
    // Check if Lighthouse reports exist
    const lighthouseReport = join(ROOT_DIR, 'lighthouse-reports', 'latest-report.json');

    if (existsSync(lighthouseReport)) {
      const report = JSON.parse(readFileSync(lighthouseReport, 'utf8'));

      // Check performance score
      const performanceScore = report.categories?.performance?.score * 100;
      if (performanceScore < 80) {
        alerts.push({
          type: AlertType.PERFORMANCE_DEGRADATION,
          severity: performanceScore < 60 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
          title: 'Performance Degradation Detected',
          message: `Performance score dropped to ${performanceScore}%`,
          details: {
            score: performanceScore,
            metrics: report.audits
          }
        });
      }

      // Check Core Web Vitals
      const lcp = report.audits?.['largest-contentful-paint']?.numericValue;
      const cls = report.audits?.['cumulative-layout-shift']?.numericValue;

      if (lcp > 4000) {
        alerts.push({
          type: AlertType.PERFORMANCE_DEGRADATION,
          severity: AlertSeverity.HIGH,
          title: 'Poor LCP Performance',
          message: `Largest Contentful Paint is ${lcp}ms (target: < 4000ms)`,
          details: { lcp, threshold: 4000 }
        });
      }

      if (cls > 0.25) {
        alerts.push({
          type: AlertType.PERFORMANCE_DEGRADATION,
          severity: AlertSeverity.MEDIUM,
          title: 'High Cumulative Layout Shift',
          message: `CLS score is ${cls} (target: < 0.25)`,
          details: { cls, threshold: 0.25 }
        });
      }
    }

  } catch (error) {
    log(`Error checking performance: ${error.message}`, colors.yellow);
  }

  return alerts;
}

/**
 * Check dependency conflicts
 */
function checkDependencyConflicts() {
  log('\n🔗 Checking for dependency conflicts...', colors.blue);

  const alerts = [];

  try {
    const conflictsReport = join(ROOT_DIR, 'dependency-consistency-report.json');

    if (existsSync(conflictsReport)) {
      const report = JSON.parse(readFileSync(conflictsReport, 'utf8'));

      if (report.summary.totalConflicts > 0) {
        const severity = report.conflicts.some(c => c.severity === 'high')
          ? AlertSeverity.HIGH
          : AlertSeverity.MEDIUM;

        alerts.push({
          type: AlertType.DEPENDENCY_CONFLICT,
          severity,
          title: 'Dependency Conflicts Detected',
          message: `Found ${report.summary.totalConflicts} conflicting dependencies`,
          details: {
            conflicts: report.conflicts,
            recommendations: report.recommendations
          }
        });
      }
    }
  } catch (error) {
    log(`Error checking dependencies: ${error.message}`, colors.yellow);
  }

  return alerts;
}

/**
 * Check flaky tests
 */
function checkFlakyTests() {
  log('\n🔍 Checking for flaky tests...', colors.blue);

  const alerts = [];

  try {
    const flakyReport = join(ROOT_DIR, 'test-reports', 'flaky-tests.json');

    if (existsSync(flakyReport)) {
      const report = JSON.parse(readFileSync(flakyReport, 'utf8'));

      if (report.summary.totalFlakyTests > 0) {
        const severity = report.summary.highSeverity > 0
          ? AlertSeverity.HIGH
          : AlertSeverity.MEDIUM;

        alerts.push({
          type: AlertType.FLAKY_TEST_DETECTED,
          severity,
          title: 'Flaky Tests Detected',
          message: `${report.summary.totalFlakyTests} flaky tests found (${report.summary.overallFlakyRate}% failure rate)`,
          details: {
            flakyTests: report.flakyTests,
            targetMet: report.analysis.targetMet
          }
        });
      }
    }
  } catch (error) {
    log(`Error checking flaky tests: ${error.message}`, colors.yellow);
  }

  return alerts;
}

/**
 * Check coverage drops
 */
function checkCoverageDrops() {
  log('\n📊 Checking for coverage drops...', colors.blue);

  const alerts = [];

  try {
    // Check backend coverage
    const backendCoverage = join(ROOT_DIR, 'backend', 'coverage', 'coverage-summary.json');

    if (existsSync(backendCoverage)) {
      const coverage = JSON.parse(readFileSync(backendCoverage, 'utf8'));

      const totalCoverage = coverage.total?.lines?.pct || 0;
      if (totalCoverage < 80) {
        alerts.push({
          type: AlertType.COVERAGE_DROP,
          severity: totalCoverage < 60 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
          title: 'Low Test Coverage',
          message: `Backend coverage is ${totalCoverage}% (target: 80%)`,
          details: {
            workspace: 'backend',
            coverage: totalCoverage,
            breakdown: coverage.total
          }
        });
      }
    }

    // Check frontend coverage
    const frontendCoverage = join(ROOT_DIR, 'frontend', 'coverage', 'coverage-summary.json');

    if (existsSync(frontendCoverage)) {
      const coverage = JSON.parse(readFileSync(frontendCoverage, 'utf8'));

      const totalCoverage = coverage.total?.lines?.pct || 0;
      if (totalCoverage < 80) {
        alerts.push({
          type: AlertType.COVERAGE_DROP,
          severity: totalCoverage < 60 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
          title: 'Low Test Coverage',
          message: `Frontend coverage is ${totalCoverage}% (target: 80%)`,
          details: {
            workspace: 'frontend',
            coverage: totalCoverage,
            breakdown: coverage.total
          }
        });
      }
    }

  } catch (error) {
    log(`Error checking coverage: ${error.message}`, colors.yellow);
  }

  return alerts;
}

/**
 * Check build status
 */
function checkBuildStatus() {
  log('\n🔨 Checking build status...', colors.blue);

  const alerts = [];

  try {
    // Check if builds are successful
    const backendBuildOutput = exec('pnpm --filter backend run build', join(ROOT_DIR, 'backend'));
    const frontendBuildOutput = exec('pnpm --filter frontend run build', join(ROOT_DIR, 'frontend'));

    if (backendBuildOutput.includes('error') || backendBuildOutput.includes('Error')) {
      alerts.push({
        type: AlertType.BUILD_FAILURE,
        severity: AlertSeverity.HIGH,
        title: 'Backend Build Failure',
        message: 'Backend build failed',
        details: {
          workspace: 'backend',
          output: backendBuildOutput.substring(0, 1000)
        }
      });
    }

    if (frontendBuildOutput.includes('error') || frontendBuildOutput.includes('Error')) {
      alerts.push({
        type: AlertType.BUILD_FAILURE,
        severity: AlertSeverity.HIGH,
        title: 'Frontend Build Failure',
        message: 'Frontend build failed',
        details: {
          workspace: 'frontend',
          output: frontendBuildOutput.substring(0, 1000)
        }
      });
    }

  } catch (error) {
    alerts.push({
      type: AlertType.BUILD_FAILURE,
      severity: AlertSeverity.CRITICAL,
      title: 'Build System Error',
      message: `Build execution failed: ${error.message}`,
      details: { error: error.message }
    });
  }

  return alerts;
}

/**
 * Generate contextual alert message
 */
function generateAlertMessage(alert) {
  const timestamp = new Date().toLocaleString();
  const emoji = {
    critical: '🚨',
    high: '⚠️',
    medium: '📊',
    low: 'ℹ️',
    info: '📝'
  };

  let message = `${emoji[alert.severity]} *${alert.title}*\n`;
  message += `Type: ${alert.type}\n`;
  message += `Time: ${timestamp}\n\n`;
  message += `${alert.message}\n`;

  if (alert.details) {
    message += `\n*Details:*\n`;
    if (typeof alert.details === 'object') {
      message += `\`\`\`${JSON.stringify(alert.details, null, 2)}\`\`\``;
    } else {
      message += alert.details;
    }
  }

  return message;
}

/**
 * Check if alert should be sent (cooldown logic)
 */
function shouldSendAlert(alert, sentAlerts) {
  const config = loadAlertsConfig();
  const cooldown = config?.cooldown?.[alert.severity] || 3600000; // Default 1 hour
  const lastSent = sentAlerts[alert.type];

  if (!lastSent) return true;

  const timeSinceLastAlert = Date.now() - lastSent;
  return timeSinceLastAlert >= cooldown;
}

/**
 * Main monitoring function
 */
async function runMonitoring() {
  log('🚀 Starting Real-time Monitoring & Alerting...', colors.bright + colors.green);

  try {
    const config = loadAlertsConfig();

    if (!config?.enabled) {
      log('Monitoring is disabled in configuration', colors.yellow);
      return;
    }

    // Load previously sent alerts
    const sentAlerts = config.sentAlerts || {};

    // Run all checks
    const allAlerts = [
      ...checkTestFailures(),
      ...checkPerformanceDegradation(),
      ...checkDependencyConflicts(),
      ...checkFlakyTests(),
      ...checkCoverageDrops(),
      ...checkBuildStatus()
    ];

    log(`\n📋 Found ${allAlerts.length} alerts to process`, colors.blue);

    // Process and send alerts
    for (const alert of allAlerts) {
      if (shouldSendAlert(alert, sentAlerts)) {
        const message = generateAlertMessage(alert);

        log(`Sending ${alert.severity} alert: ${alert.title}`, colors.cyan);
        await sendSlackNotification(message, alert.severity);

        // Update sent alerts tracking
        sentAlerts[alert.type] = Date.now();
      } else {
        log(`Skipping ${alert.severity} alert (cooldown): ${alert.title}`, colors.yellow);
      }
    }

    // Save updated configuration with sent alerts tracking
    config.sentAlerts = sentAlerts;
    saveAlertsConfig(config);

    // Summary
    const criticalAlerts = allAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length;
    const highAlerts = allAlerts.filter(a => a.severity === AlertSeverity.HIGH).length;
    const mediumAlerts = allAlerts.filter(a => a.severity === AlertSeverity.MEDIUM).length;

    log('\n📊 Monitoring Summary:', colors.bright);
    log(`Critical: ${criticalAlerts}`, criticalAlerts > 0 ? colors.red : colors.green);
    log(`High: ${highAlerts}`, highAlerts > 0 ? colors.yellow : colors.green);
    log(`Medium: ${mediumAlerts}`, colors.cyan);
    log(`Total: ${allAlerts.length}`, colors.bright);

    // Exit with appropriate code
    const hasCriticalIssues = criticalAlerts > 0;
    process.exit(hasCriticalIssues ? 1 : 0);

  } catch (error) {
    log(`Fatal error in monitoring: ${error.message}`, colors.red + colors.bright);
    process.exit(1);
  }
}

/**
 * Setup monitoring configuration
 */
function setupMonitoring() {
  log('🔧 Setting up monitoring configuration...', colors.blue);

  const config = loadAlertsConfig();

  // Prompt for Slack configuration if not set
  if (!config.slack.webhookUrl) {
    log('\n📱 Slack Configuration:', colors.bright);
    log('To enable Slack notifications, set the following environment variables:', colors.cyan);
    log('  SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...', colors.green);
    log('  SLACK_CHANNEL=#your-channel-name', colors.green);
  }

  // Display current configuration
  log('\n⚙️  Current Configuration:', colors.bright);
  log(`Enabled: ${config.enabled ? 'Yes' : 'No'}`, colors.green);
  log(`Slack Notifications: ${config.slack.webhookUrl ? 'Configured' : 'Not Configured'}`, colors.cyan);
  log(`Performance Threshold: ${config.thresholds.performanceDrop}% drop`, colors.cyan);
  log(`Coverage Threshold: ${config.thresholds.coverageDrop}% drop`, colors.cyan);
  log(`Flaky Test Threshold: ${config.thresholds.flakyTestRate}% rate`, colors.cyan);

  saveAlertsConfig(config);
}

/**
 * Main execution function
 */
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'setup':
      setupMonitoring();
      break;
    case 'run':
    default:
      await runMonitoring();
      break;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
    checkBuildStatus, checkCoverageDrops, checkDependencyConflicts,
    checkFlakyTests, checkPerformanceDegradation, checkTestFailures, runMonitoring, sendSlackNotification, setupMonitoring
};
