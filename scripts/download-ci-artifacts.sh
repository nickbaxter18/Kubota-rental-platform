#!/bin/bash

# Download CI Artifacts Script
# Downloads test results and coverage from GitHub Actions for local IDE integration

set -e

echo "🔗 Downloading CI Artifacts for IDE Integration"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "   Install it from: https://cli.github.com/"
    echo "   Or manually download artifacts from GitHub Actions"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Get the current branch
BRANCH=$(git branch --show-current)
RUN_ID=""

info "Current branch: $BRANCH"

# Find the latest successful workflow run
info "Finding latest successful workflow run..."

RUN_ID=$(gh run list --branch="$BRANCH" --workflow="Quality Gate" --limit=10 --json databaseId,conclusion,headSha --jq '.[] | select(.conclusion == "success") | .databaseId' | head -1)

if [[ -z "$RUN_ID" ]]; then
    warning "No successful workflow runs found for branch '$BRANCH'"
    echo ""
    echo "📋 Options:"
    echo "   1. Run tests locally: pnpm test"
    echo "   2. Check CI status: gh run list"
    echo "   3. View recent runs: gh run list --branch=$BRANCH"
    exit 1
fi

success "Found successful run: #$RUN_ID"

# Create directories for artifacts
mkdir -p test-results
mkdir -p coverage

# Download test results
info "Downloading JUnit test reports..."
if gh run download "$RUN_ID" --name junit-reports -D test-results/; then
    success "JUnit reports downloaded to test-results/"
else
    warning "JUnit reports not found in run #$RUN_ID"
fi

# Download coverage reports
info "Downloading coverage reports..."
if gh run download "$RUN_ID" --name quality-gate-results -D coverage/; then
    success "Coverage reports downloaded to coverage/"
else
    warning "Coverage reports not found in run #$RUN_ID"
fi

# Process and display results
echo ""
echo "📊 Processing Downloaded Artifacts"
echo "================================="

# Check for JUnit files
if ls test-results/junit.xml 1> /dev/null 2>&1; then
    TEST_COUNT=$(grep -o 'testcase' test-results/junit.xml | wc -l)
    ERROR_COUNT=$(grep -o 'error' test-results/junit.xml | wc -l)
    FAILURE_COUNT=$(grep -o 'failure' test-results/junit.xml | wc -l)

    success "JUnit report processed"
    echo "   Tests: $TEST_COUNT"
    echo "   Errors: $ERROR_COUNT"
    echo "   Failures: $FAILURE_COUNT"
else
    warning "No JUnit report found"
fi

# Check for coverage files
if ls coverage/lcov.info 1> /dev/null 2>&1; then
    COVERAGE_LINES=$(wc -l < coverage/lcov.info)
    success "Coverage report downloaded ($COVERAGE_LINES lines)"
else
    warning "No coverage report found"
fi

echo ""
echo "🚀 IDE Integration Setup Complete!"
echo "=================================="
echo ""
echo "📋 Next Steps:"
echo "   1. Install VSCode extensions:"
echo "      • GitHub Actions (GitHub.vscode-github-actions)"
echo "      • Test Explorer UI (hbenl.vscode-test-explorer)"
echo "      • Coverage Gutters (ryanluker.vscode-coverage-gutters)"
echo "      • Error Lens (usernamehw.errorlens)"
echo ""
echo "   2. Reload VSCode window (Ctrl+Shift+P > Developer: Reload Window)"
echo ""
echo "   3. View results:"
echo "      • GitHub Actions: Click GitHub icon in sidebar"
echo "      • Test Results: Open Test Explorer from sidebar"
echo "      • Coverage: See colored bars in code editor"
echo ""
echo "🔧 Troubleshooting:"
echo "   • If tests don't appear: Check test-results/junit.xml exists"
echo "   • If coverage doesn't show: Check coverage/lcov.info exists"
echo "   • For latest results: Re-run this script after CI completes"
echo ""
echo "📖 Learn more: https://code.visualstudio.com/docs/editor/testing"
