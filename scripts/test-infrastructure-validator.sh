#!/bin/bash

# Enhanced Environment Validation Script
# Comprehensive validation for testing infrastructure with detailed diagnostics

# Continue on errors to show all validation results

echo "🔍 Enhanced Environment Validation"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

error() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 1. Critical Locale Validation
validate_locale() {
    echo ""
    echo "🌐 Locale Validation (Critical)"
    echo "-------------------------------"

    # Check LANG environment variable
    if [[ "$LANG" == "en_US.UTF-8" ]]; then
        success "LANG set to en_US.UTF-8"
    else
        error "LANG not set to en_US.UTF-8 (current: $LANG)"
        echo "   Fix: export LANG=en_US.UTF-8"
    fi

    # Check LC_ALL environment variable
    if [[ "$LC_ALL" == "en_US.UTF-8" ]]; then
        success "LC_ALL set to en_US.UTF-8"
    elif [[ -z "$LC_ALL" ]]; then
        warning "LC_ALL not set - may cause locale issues in tests"
        echo "   Fix: export LC_ALL=en_US.UTF-8"
    else
        error "LC_ALL not set to en_US.UTF-8 (current: $LC_ALL)"
        echo "   Fix: export LC_ALL=en_US.UTF-8"
    fi

    # Check system locale
    if locale | grep -q "en_US.UTF-8"; then
        success "System locale configured correctly"
    else
        error "System locale not configured for en_US.UTF-8"
        echo "   Fix: sudo locale-gen en_US.UTF-8"
    fi
}

# 2. Database Connectivity Validation
validate_databases() {
    echo ""
    echo "🗄️  Database Connectivity"
    echo "-------------------------"

    # Test database connection
    if PGPASSWORD=test_password psql -h localhost -p 5432 -U test_user -d udigit_rentals_test -c "SELECT 1" >/dev/null 2>&1; then
        success "Test database connection successful"
    else
        error "Test database connection failed"
        echo "   Expected: postgresql://test:test@localhost:5432/udigit_rentals_test"
        echo "   Fix: Ensure test database is running and accessible"
    fi

    # Check database schema
    if PGPASSWORD=test_password psql -h localhost -p 5432 -U test_user -d udigit_rentals_test -c "SELECT COUNT(*) FROM information_schema.tables" >/dev/null 2>&1; then
        success "Test database schema accessible"
    else
        warning "Test database schema may not be initialized"
        echo "   Fix: Run database migrations"
    fi
}

# 3. Redis Connectivity Validation
validate_redis() {
    echo ""
    echo "🟢 Redis Connectivity"
    echo "---------------------"

    # Test Redis connection with retries
    for i in {1..5}; do
        if redis-cli -h localhost -p 6379 ping >/dev/null 2>&1; then
            success "Redis connection successful"
            return 0
        else
            echo "⏳ Waiting for Redis to be ready ($i/5)..."
            sleep 2
        fi
    done

    warning "Redis not accessible at localhost:6379"
    echo "   Fix: Run ./scripts/start-test-redis.sh"
}

# 4. External Services Validation
validate_external_services() {
    echo ""
    echo "🌍 External Services"
    echo "--------------------"

    # Check if external services are disabled for testing
    if [[ "$DISABLE_EXTERNAL_SERVICES" == "true" ]]; then
        success "External services disabled for testing"
    else
        warning "External services may interfere with tests"
        echo "   Recommendation: Set DISABLE_EXTERNAL_SERVICES=true"
    fi
}

# 5. File System Validation
validate_file_system() {
    echo ""
    echo "📁 File System"
    echo "--------------"

    # Check test directories exist
    if [[ -d "backend/src/test" ]]; then
        success "Backend test directory exists"
    else
        error "Backend test directory missing"
    fi

    if [[ -d "frontend/src/test" ]]; then
        success "Frontend test directory exists"
    else
        error "Frontend test directory missing"
    fi

    # Check test utilities exist
    if [[ -f "backend/src/test/test-utils.ts" ]]; then
        success "Backend test utilities exist"
    else
        error "Backend test utilities missing"
    fi
}

# 6. Performance Baselines Validation
validate_performance_baselines() {
    echo ""
    echo "⚡ Performance Baselines"
    echo "------------------------"

    # Check Lighthouse configuration
    if [[ -f "frontend/lighthouserc.js" ]]; then
        success "Lighthouse configuration exists"
    else
        error "Lighthouse configuration missing"
    fi

    # Check performance test files
    if [[ -f "frontend/e2e/performance.spec.ts" ]]; then
        success "Performance tests exist"
    else
        warning "Performance tests missing"
    fi
}

# Run all validations
validate_locale
validate_databases
validate_redis
validate_external_services
validate_file_system
validate_performance_baselines

# Summary
echo ""
echo "📋 Validation Summary"
echo "===================="
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"

if [[ $ERRORS -eq 0 ]]; then
    success "Environment validation passed!"
    echo ""
    echo "🚀 Ready to run tests:"
    echo "   pnpm test                    # All tests"
    echo "   pnpm test:critical          # Critical path only"
    echo "   pnpm test:performance       # Performance tests"
    echo "   pnpm test:accessibility     # Accessibility audit"
    exit 0
else
    error "$ERRORS critical issues found. Please address them before running tests."
    echo ""
    echo "🔧 Quick fixes:"
    echo "   1. Set locale: export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8"
    echo "   2. Start test database: docker-compose -f docker-compose.test.yml up -d"
    echo "   3. Install dependencies: pnpm install"
    exit 1
fi
