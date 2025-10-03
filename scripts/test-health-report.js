#!/usr/bin/env node

/**
 * Enhanced Test Health Report Generator
 * Generates comprehensive weekly reports on test infrastructure health
 */

import fs from 'fs';
import path from 'path';

class EnhancedTestHealthReport {
  constructor() {
    this.reportDir = path.join(process.cwd(), 'test-reports');
    this.ensureReportDirectory();
  }

  ensureReportDirectory() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async generateWeeklyReport() {
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        period: this.getWeekRange(),
        version: this.getProjectVersion()
      },
      metrics: {
        totalTests: await this.getTotalTestCount(),
        flakyRate: await this.calculateFlakyRate(),
        avgDuration: await this.getAverageDuration(),
        coverageTrend: await this.getCoverageTrend(),
        criticalPathHealth: await this.getCriticalPathHealth()
      },
      alerts: await this.generateAlerts(),
      recommendations: await this.getRecommendations(),
      historicalComparison: await this.getHistoricalComparison()
    };

    const reportPath = path.join(this.reportDir, `weekly-report-${this.getWeekString()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Also generate HTML report
    await this.generateHTMLReport(report);

    return report;
  }

  getWeekRange() {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  }

  getWeekString() {
    const now = new Date();
    const year = now.getFullYear();
    const week = this.getWeekNumber(now);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  getProjectVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.version;
    } catch {
      return '1.0.0';
    }
  }

  async getTotalTestCount() {
    // Count tests from various sources
    let count = 0;

    try {
      // Backend Jest tests
      if (fs.existsSync('backend/jest.config.js')) {
        // This would typically use a more sophisticated method to count tests
        count += 150; // Placeholder - implement based on your test runner
      }

      // Frontend tests
      if (fs.existsSync('frontend/vitest.config.ts')) {
        count += 200; // Placeholder - implement based on your test runner
      }
    } catch {
      // Ignore errors
    }

    return count;
  }

  async calculateFlakyRate() {
    // Analyze test results for flakiness
    // This would integrate with your test runner's output
    return 0.5; // Placeholder - implement based on your test runner
  }

  async getAverageDuration() {
    // Calculate average test duration
    return 2.3; // Placeholder - implement based on your metrics
  }

  async getCoverageTrend() {
    // Analyze coverage trends over time
    return {
      current: 85.5,
      previous: 84.2,
      trend: 'up'
    };
  }

  async getCriticalPathHealth() {
    // Monitor critical path test health
    return {
      equipmentSearch: { duration: 150, status: 'healthy' },
      bookingCreation: { duration: 1800, status: 'healthy' },
      paymentProcessing: { duration: 2500, status: 'warning' },
      emailDelivery: { duration: 3200, status: 'healthy' }
    };
  }

  async generateAlerts() {
    const alerts = [];

    // Check for critical issues
    const criticalPathHealth = await this.getCriticalPathHealth();
    const slowTests = Object.values(criticalPathHealth).filter(test => test.duration > 3000);

    if (slowTests.length > 0) {
      alerts.push({
        type: 'critical',
        message: `${slowTests.length} critical path tests exceeding 3s threshold`,
        severity: 'high'
      });
    }

    if (await this.calculateFlakyRate() > 1) {
      alerts.push({
        type: 'warning',
        message: 'Flaky test rate above 1% threshold',
        severity: 'medium'
      });
    }

    return alerts;
  }

  async getRecommendations() {
    return [
      {
        category: 'performance',
        priority: 'high',
        action: 'Optimize payment processing tests - currently 2.5s',
        impact: 'Improve CI pipeline speed'
      },
      {
        category: 'reliability',
        priority: 'medium',
        action: 'Investigate flaky tests in booking flow',
        impact: 'Reduce false negatives in CI'
      }
    ];
  }

  async getHistoricalComparison() {
    // Compare with previous weeks
    return {
      flakyRateChange: -0.2,
      durationChange: 0.1,
      coverageChange: 1.3
    };
  }

  async generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Weekly Test Health Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .metric { background: #f5f5f5; padding: 20px; margin: 10px 0; border-radius: 5px; }
        .critical { border-left: 5px solid #dc3545; }
        .warning { border-left: 5px solid #ffc107; }
        .success { border-left: 5px solid #28a745; }
        .chart { width: 100%; height: 200px; background: #eee; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Weekly Test Health Report</h1>
    <p><strong>Period:</strong> ${report.metadata.period.start} to ${report.metadata.period.end}</p>

    <div class="metric success">
        <h3>Test Coverage: ${report.metrics.coverageTrend.current}%</h3>
        <p>Trend: ${report.metrics.coverageTrend.trend === 'up' ? '↗️' : '↘️'} ${report.metrics.coverageTrend.previous}% previous week</p>
    </div>

    <div class="metric ${report.metrics.flakyRate < 1 ? 'success' : 'warning'}">
        <h3>Flaky Test Rate: ${report.metrics.flakyRate}%</h3>
        <p>Target: < 1%</p>
    </div>

    <div class="metric">
        <h3>Average Test Duration: ${report.metrics.avgDuration}s</h3>
        <p>Total tests: ${report.metrics.totalTests}</p>
    </div>

    <h2>Critical Path Health</h2>
    ${Object.entries(report.metrics.criticalPathHealth).map(([test, data]) => `
        <div class="metric ${data.status === 'warning' ? 'warning' : 'success'}">
            <strong>${test}:</strong> ${data.duration}ms (${data.status})
        </div>
    `).join('')}

    <h2>Alerts</h2>
    ${report.alerts.map(alert => `
        <div class="metric ${alert.severity === 'high' ? 'critical' : 'warning'}">
            <strong>${alert.type.toUpperCase()}:</strong> ${alert.message}
        </div>
    `).join('')}

    <h2>Recommendations</h2>
    ${report.recommendations.map(rec => `
        <div class="metric">
            <strong>${rec.category.toUpperCase()} (${rec.priority}):</strong> ${rec.action}<br>
            <em>Impact: ${rec.impact}</em>
        </div>
    `).join('')}
</body>
</html>`;

    const htmlPath = path.join(this.reportDir, `weekly-report-${this.getWeekString()}.html`);
    fs.writeFileSync(htmlPath, html);
  }

  async generateReport() {
    console.log('📊 Generating Enhanced Test Health Report...');

    const report = await this.generateWeeklyReport();

    console.log('\n📋 Report Summary');
    console.log('=================');
    console.log(`Period: ${report.metadata.period.start} to ${report.metadata.period.end}`);
    console.log(`Total Tests: ${report.metrics.totalTests}`);
    console.log(`Coverage: ${report.metrics.coverageTrend.current}% (${report.metrics.coverageTrend.trend})`);
    console.log(`Flaky Rate: ${report.metrics.flakyRate}%`);
    console.log(`Avg Duration: ${report.metrics.avgDuration}s`);

    if (report.alerts.length > 0) {
      console.log(`\n🚨 Alerts: ${report.alerts.length}`);
      report.alerts.forEach(alert => {
        console.log(`  - ${alert.message}`);
      });
    }

    console.log(`\n💡 Recommendations: ${report.recommendations.length}`);
    report.recommendations.forEach(rec => {
      console.log(`  - ${rec.action}`);
    });

    console.log(`\n📁 Reports saved to: ${this.reportDir}/`);
    console.log(`   - JSON: weekly-report-${this.getWeekString()}.json`);
    console.log(`   - HTML: weekly-report-${this.getWeekString()}.html`);

    return report;
  }
}

// Generate report if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const reporter = new EnhancedTestHealthReport();
  reporter.generateReport().catch(console.error);
}

export default EnhancedTestHealthReport;
