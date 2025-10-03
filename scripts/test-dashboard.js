#!/usr/bin/env node

/**
 * Test Health Dashboard
 * Monitors and reports on test execution health, performance, and reliability
 */

class TestHealthDashboard {
  constructor() {
    this.startTime = Date.now();
    this.testResults = [];
    this.performanceMetrics = new Map();
  }

  recordTestResult(testName, duration, status, error = null) {
    this.testResults.push({
      testName,
      duration,
      status,
      error: error?.message,
      timestamp: new Date().toISOString()
    });
  }

  recordPerformanceMetric(testName, metric, value) {
    if (!this.performanceMetrics.has(testName)) {
      this.performanceMetrics.set(testName, new Map());
    }
    this.performanceMetrics.get(testName).set(metric, value);
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.testResults.filter(t => t.status === 'passed').length;
    const failedTests = this.testResults.filter(t => t.status === 'failed').length;
    const flakyTests = this.identifyFlakyTests();

    return {
      summary: {
        totalTests: this.testResults.length,
        passed: passedTests,
        failed: failedTests,
        successRate: `${((passedTests / this.testResults.length) * 100).toFixed(2)}%`,
        totalDuration: `${(totalDuration / 1000).toFixed(2)}s`,
        flakyTests: flakyTests.length
      },
      flakyTests,
      performanceRegressions: this.identifyPerformanceRegressions(),
      recommendations: this.generateRecommendations()
    };
  }

  identifyFlakyTests() {
    // Group tests by name and check for inconsistent results
    const testGroups = new Map();

    this.testResults.forEach(result => {
      if (!testGroups.has(result.testName)) {
        testGroups.set(result.testName, []);
      }
      testGroups.get(result.testName).push(result.status);
    });

    const flakyTests = [];
    testGroups.forEach((statuses, testName) => {
      const uniqueStatuses = [...new Set(statuses)];
      if (uniqueStatuses.length > 1) {
        flakyTests.push({
          testName,
          statusHistory: statuses,
          flakyRate: `${((statuses.filter(s => s === 'failed').length / statuses.length) * 100).toFixed(2)}%`
        });
      }
    });

    return flakyTests;
  }

  identifyPerformanceRegressions() {
    const regressions = [];

    this.performanceMetrics.forEach((metrics, testName) => {
      const duration = metrics.get('duration');
      if (duration > 5000) { // 5 second threshold
        regressions.push({
          testName,
          duration,
          severity: duration > 10000 ? 'high' : 'medium'
        });
      }
    });

    return regressions;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.testResults.filter(t => t.status === 'failed').length > 0) {
      recommendations.push({
        type: 'critical',
        message: 'Fix failing tests before deployment',
        priority: 'high'
      });
    }

    const flakyTests = this.identifyFlakyTests();
    if (flakyTests.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `${flakyTests.length} flaky tests detected - investigate and fix`,
        priority: 'medium'
      });
    }

    const regressions = this.identifyPerformanceRegressions();
    if (regressions.length > 0) {
      recommendations.push({
        type: 'performance',
        message: `${regressions.length} slow tests detected - optimize performance`,
        priority: 'medium'
      });
    }

    return recommendations;
  }
}

export default TestHealthDashboard;
