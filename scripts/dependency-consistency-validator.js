#!/usr/bin/env node

/**
 * Dependency Consistency Validation Script
 *
 * Validates TypeScript versions, detects conflicting dependencies,
 * and provides automated dependency update suggestions across workspaces.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORKSPACES = ['backend', 'frontend'];
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
 * Get workspace package.json
 */
function getWorkspacePackage(workspace) {
  try {
    const packagePath = join(ROOT_DIR, workspace, 'package.json');
    return JSON.parse(readFileSync(packagePath, 'utf8'));
  } catch {
    log(`Failed to read package.json for ${workspace}`, colors.red);
    return null;
  }
}

/**
 * Get TypeScript version from workspace
 */
function getTypeScriptVersion(workspace) {
  const pkg = getWorkspacePackage(workspace);
  if (!pkg) return null;

  // Check dependencies and devDependencies
  const tsVersion = pkg.dependencies?.typescript || pkg.devDependencies?.typescript;
  return tsVersion ? tsVersion.replace('^', '').replace('~', '') : null;
}

/**
 * Get all dependencies from workspace
 */
function getAllDependencies(workspace) {
  const pkg = getWorkspacePackage(workspace);
  if (!pkg) return {};

  return {
    ...pkg.dependencies,
    ...pkg.devDependencies
  };
}

/**
 * Find conflicting dependencies across workspaces
 */
function findConflictingDependencies() {
  log('\n🔍 Analyzing dependency conflicts...', colors.blue);

  const allDeps = {};
  const conflicts = [];

  // Collect all dependencies from workspaces
  WORKSPACES.forEach(workspace => {
    const deps = getAllDependencies(workspace);
    Object.keys(deps).forEach(dep => {
      if (!allDeps[dep]) {
        allDeps[dep] = {};
      }
      allDeps[dep][workspace] = deps[dep];
    });
  });

  // Find conflicts
  Object.keys(allDeps).forEach(dep => {
    const versions = Object.values(allDeps[dep]);
    const uniqueVersions = [...new Set(versions)];

    if (uniqueVersions.length > 1) {
      conflicts.push({
        name: dep,
        versions: allDeps[dep],
        severity: uniqueVersions.length > 2 ? 'high' : 'medium'
      });
    }
  });

  return conflicts;
}

/**
 * Validate TypeScript consistency
 */
function validateTypeScriptConsistency() {
  log('\n🔷 Validating TypeScript version consistency...', colors.blue);

  const tsVersions = {};
  const issues = [];

  WORKSPACES.forEach(workspace => {
    const version = getTypeScriptVersion(workspace);
    tsVersions[workspace] = version;

    if (!version) {
      issues.push({
        workspace,
        type: 'missing',
        message: 'TypeScript not found in dependencies'
      });
    }
  });

  // Check for version mismatches
  const versions = Object.values(tsVersions).filter(Boolean);
  const uniqueVersions = [...new Set(versions)];

  if (uniqueVersions.length > 1) {
    issues.push({
      type: 'mismatch',
      message: `TypeScript version mismatch: ${uniqueVersions.join(', ')}`,
      details: tsVersions
    });
  }

  return { tsVersions, issues };
}

/**
 * Check for outdated dependencies
 */
function checkOutdatedDependencies() {
  log('\n📦 Checking for outdated dependencies...', colors.blue);

  const outdated = [];

  WORKSPACES.forEach(workspace => {
    log(`Checking ${workspace}...`, colors.cyan);

    try {
      const output = exec(`pnpm outdated --filter ${workspace}`, join(ROOT_DIR, workspace));
      if (output && !output.includes('No outdated dependencies')) {
        outdated.push({
          workspace,
          output: output.trim()
        });
      }
    } catch {
      log(`Failed to check outdated dependencies for ${workspace}`, colors.yellow);
    }
  });

  return outdated;
}

/**
 * Generate dependency report
 */
function generateReport(conflicts, tsValidation, outdated) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalConflicts: conflicts.length,
      typeScriptIssues: tsValidation.issues.length,
      outdatedWorkspaces: outdated.length,
      overallHealth: 'unknown'
    },
    conflicts,
    typeScript: tsValidation,
    outdated,
    recommendations: []
  };

  // Determine overall health
  if (conflicts.length === 0 && tsValidation.issues.length === 0) {
    report.summary.overallHealth = 'good';
  } else if (conflicts.length <= 2 && tsValidation.issues.length <= 1) {
    report.summary.overallHealth = 'warning';
  } else {
    report.summary.overallHealth = 'critical';
  }

  // Generate recommendations
  if (conflicts.length > 0) {
    report.recommendations.push({
      type: 'conflicts',
      priority: 'high',
      message: `Resolve ${conflicts.length} conflicting dependencies`,
      details: conflicts.map(c => `${c.name}: ${Object.values(c.versions).join(' vs ')}`)
    });
  }

  if (tsValidation.issues.length > 0) {
    report.recommendations.push({
      type: 'typescript',
      priority: 'high',
      message: 'Standardize TypeScript versions across workspaces',
      details: tsValidation.issues.map(issue => issue.message)
    });
  }

  if (outdated.length > 0) {
    report.recommendations.push({
      type: 'outdated',
      priority: 'medium',
      message: `Update dependencies in ${outdated.length} workspace(s)`,
      details: outdated.map(o => o.workspace)
    });
  }

  return report;
}

/**
 * Save report to file
 */
function saveReport(report) {
  const reportPath = join(ROOT_DIR, 'dependency-consistency-report.json');

  try {
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\n📋 Report saved to: ${reportPath}`, colors.green);
  } catch (error) {
    log(`Failed to save report: ${error.message}`, colors.red);
  }
}

/**
 * Display results
 */
function displayResults(report) {
  log('\n' + '='.repeat(60), colors.bright);
  log('📊 DEPENDENCY CONSISTENCY REPORT', colors.bright + colors.cyan);
  log('='.repeat(60), colors.bright);

  // Summary
  const healthColor = {
    'good': colors.green,
    'warning': colors.yellow,
    'critical': colors.red
  }[report.summary.overallHealth];

  log(`Overall Health: ${healthColor}${report.summary.overallHealth.toUpperCase()}${colors.reset}`, colors.bright);
  log(`Total Conflicts: ${report.summary.totalConflicts}`, colors.bright);
  log(`TypeScript Issues: ${report.summary.typeScriptIssues}`, colors.bright);
  log(`Outdated Workspaces: ${report.summary.outdatedWorkspaces}`, colors.bright);

  // Conflicts
  if (report.conflicts.length > 0) {
    log('\n❌ CONFLICTING DEPENDENCIES:', colors.red + colors.bright);
    report.conflicts.forEach(conflict => {
      const severityColor = conflict.severity === 'high' ? colors.red : colors.yellow;
      log(`  ${severityColor}${conflict.name}${colors.reset}`, colors.bright);
      log(`    Versions: ${Object.entries(conflict.versions).map(([ws, ver]) => `${ws}: ${ver}`).join(', ')}`);
    });
  }

  // TypeScript Issues
  if (report.typeScript.issues.length > 0) {
    log('\n❌ TYPESCRIPT ISSUES:', colors.red + colors.bright);
    report.typeScript.issues.forEach(issue => {
      log(`  ${issue.workspace || 'Multiple'}: ${issue.message}`, colors.red);
      if (issue.details) {
        log(`    Details: ${JSON.stringify(issue.details, null, 2)}`);
      }
    });
  }

  // Outdated
  if (report.outdated.length > 0) {
    log('\n⚠️  OUTDATED DEPENDENCIES:', colors.yellow + colors.bright);
    report.outdated.forEach(item => {
      log(`  ${item.workspace}:`, colors.yellow);
      log(`    ${item.output.replace(/\n/g, '\n    ')}`);
    });
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    log('\n💡 RECOMMENDATIONS:', colors.blue + colors.bright);
    report.recommendations.forEach(rec => {
      const priorityColor = rec.priority === 'high' ? colors.red : colors.yellow;
      log(`  [${priorityColor}${rec.priority.toUpperCase()}${colors.reset}] ${rec.message}`, colors.bright);
      if (rec.details) {
        rec.details.forEach(detail => {
          log(`    • ${detail}`);
        });
      }
    });
  }

  log('\n' + '='.repeat(60), colors.bright);
}

/**
 * Main execution function
 */
async function main() {
  log('🚀 Starting Dependency Consistency Validation...', colors.bright + colors.green);

  try {
    // Validate TypeScript consistency
    const tsValidation = validateTypeScriptConsistency();

    // Find conflicting dependencies
    const conflicts = findConflictingDependencies();

    // Check for outdated dependencies
    const outdated = checkOutdatedDependencies();

    // Generate report
    const report = generateReport(conflicts, tsValidation, outdated);

    // Display results
    displayResults(report);

    // Save report
    saveReport(report);

    // Exit with appropriate code
    const hasCriticalIssues = report.summary.overallHealth === 'critical' ||
                             report.conflicts.some(c => c.severity === 'high') ||
                             report.typeScript.issues.length > 0;

    process.exit(hasCriticalIssues ? 1 : 0);

  } catch (error) {
    log(`Fatal error: ${error.message}`, colors.red + colors.bright);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as validateDependencies };
