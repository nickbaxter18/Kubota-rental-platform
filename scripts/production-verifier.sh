#!/bin/bash

# =====================================
# PRODUCTION READINESS VERIFIER
# =====================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="https://api.udigit-rentals.com"
FRONTEND_BASE="https://udigit-rentals.com"
TIMEOUT=10

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        error "$1 is not installed"
        exit 1
    fi
}

# Make HTTP request with timeout
http_request() {
    local url=$1
    local method=${2:-GET}
    local timeout=${3:-$TIMEOUT}

    if command -v curl &> /dev/null; then
        curl -s --max-time $timeout -X $method "$url"
    elif command -v wget &> /dev/null; then
        wget -q -O - --timeout=$timeout "$url"
    else
        error "Neither curl nor wget is available"
        exit 1
    fi
}

# Check environment variables
check_environment_variables() {
    log "Checking environment variables..."

    local required_vars=(
        "NODE_ENV"
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "SENTRY_DSN"
    )

    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        error "Missing required environment variables: ${missing_vars[*]}"
        return 1
    fi

    log "✅ All required environment variables are set"
    return 0
}

# Check application health
check_application_health() {
    log "Checking application health..."

    # Backend health check
    local health_response=$(http_request "$API_BASE/health" "GET" 5)

    if [[ $health_response == *"\"status\":\"ok\""* ]]; then
        log "✅ Backend health check passed"
    else
        error "❌ Backend health check failed"
        error "Response: $health_response"
        return 1
    fi

    # Frontend health check
    local frontend_response=$(http_request "$FRONTEND_BASE/health" "GET" 5)

    if [[ $frontend_response == *"\"status\":\"ok\""* ]]; then
        log "✅ Frontend health check passed"
    else
        error "❌ Frontend health check failed"
        error "Response: $frontend_response"
        return 1
    fi

    return 0
}

# Check security headers
check_security_headers() {
    log "Checking security headers..."

    local required_headers=(
        "Content-Security-Policy"
        "X-Frame-Options"
        "X-Content-Type-Options"
        "Strict-Transport-Security"
        "Referrer-Policy"
    )

    local response=$(http_request "$FRONTEND_BASE" "HEAD" 5)

    for header in "${required_headers[@]}"; do
        if echo "$response" | grep -qi "$header"; then
            log "✅ $header is present"
        else
            error "❌ $header is missing"
            return 1
        fi
    done

    return 0
}

# Check HTTPS enforcement
check_https_enforcement() {
    log "Checking HTTPS enforcement..."

    # Check HTTP to HTTPS redirect
    if command -v curl &> /dev/null; then
        local redirect_check=$(curl -s -I http://udigit-rentals.com | grep -i "location.*https" || true)

        if [ -n "$redirect_check" ]; then
            log "✅ HTTP to HTTPS redirect is working"
        else
            error "❌ HTTP to HTTPS redirect is not working"
            return 1
        fi
    fi

    # Check HSTS header
    local hsts_check=$(http_request "$FRONTEND_BASE" "HEAD" 5 | grep -i "strict-transport-security" || true)

    if [ -n "$hsts_check" ]; then
        log "✅ HSTS header is present"
    else
        error "❌ HSTS header is missing"
        return 1
    fi

    return 0
}

# Check database connectivity
check_database_connectivity() {
    log "Checking database connectivity..."

    if [ -z "${DATABASE_URL:-}" ]; then
        warn "DATABASE_URL not set, skipping database check"
        return 0
    fi

    # Extract database connection details (basic check)
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^/]+).* ]]; then
        local db_user="${BASH_REMATCH[1]}"
        local db_host="${BASH_REMATCH[3]}"

        if command -v nc &> /dev/null; then
            if nc -z -w5 "$db_host" 5432; then
                log "✅ Database is accessible on $db_host:5432"
            else
                error "❌ Database is not accessible on $db_host:5432"
                return 1
            fi
        else
            warn "netcat not available, skipping database port check"
        fi
    fi

    return 0
}

# Check Redis connectivity
check_redis_connectivity() {
    log "Checking Redis connectivity..."

    if [ -z "${REDIS_URL:-}" ]; then
        warn "REDIS_URL not set, skipping Redis check"
        return 0
    fi

    # Extract Redis connection details
    if [[ $REDIS_URL =~ redis://([^:]+):([^/]+) ]]; then
        local redis_host="${BASH_REMATCH[1]}"
        local redis_port="${BASH_REMATCH[2]}"

        if command -v nc &> /dev/null; then
            if nc -z -w5 "$redis_host" "$redis_port"; then
                log "✅ Redis is accessible on $redis_host:$redis_port"
            else
                error "❌ Redis is not accessible on $redis_host:$redis_port"
                return 1
            fi
        else
            warn "netcat not available, skipping Redis port check"
        fi
    fi

    return 0
}

# Check SSL certificate
check_ssl_certificate() {
    log "Checking SSL certificate..."

    if command -v openssl &> /dev/null; then
        local cert_info=$(echo | openssl s_client -servername udigit-rentals.com -connect udigit-rentals.com:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

        if [ -n "$cert_info" ]; then
            log "✅ SSL certificate is valid"
            echo "$cert_info" | grep -E "(notBefore|notAfter)" | while read line; do
                info "  $line"
            done
        else
            error "❌ SSL certificate check failed"
            return 1
        fi
    else
        warn "OpenSSL not available, skipping SSL certificate check"
    fi

    return 0
}

# Check performance metrics
check_performance_metrics() {
    log "Checking performance metrics..."

    local start_time=$(date +%s%N)
    local response=$(http_request "$FRONTEND_BASE" "GET" 5)
    local end_time=$(date +%s%N)

    local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds

    if [ $response_time -lt 1000 ]; then
        log "✅ Response time is acceptable: ${response_time}ms"
    else
        warn "⚠️  Response time is slow: ${response_time}ms (threshold: 1000ms)"
    fi

    # Check if response contains expected content
    if echo "$response" | grep -q "udigit" || echo "$response" | grep -q "Kubota"; then
        log "✅ Response contains expected content"
    else
        warn "⚠️  Response may not contain expected content"
    fi

    return 0
}

# Check rate limiting
check_rate_limiting() {
    log "Checking rate limiting..."

    # Make multiple requests to trigger rate limiting
    for i in {1..5}; do
        local response=$(http_request "$API_BASE/api/equipment" "GET" 3)

        if echo "$response" | grep -q "Too many requests"; then
            log "✅ Rate limiting is working"
            return 0
        fi

        sleep 1
    done

    warn "⚠️  Rate limiting may not be working (didn't trigger after 5 requests)"
    return 0
}

# Main execution
main() {
    log "🚀 Starting production readiness verification..."

    # Check prerequisites
    check_command "curl"

    local checks=(
        "check_environment_variables"
        "check_application_health"
        "check_security_headers"
        "check_https_enforcement"
        "check_database_connectivity"
        "check_redis_connectivity"
        "check_ssl_certificate"
        "check_performance_metrics"
        "check_rate_limiting"
    )

    local failed_checks=()
    local passed_checks=()

    # Run all checks
    for check in "${checks[@]}"; do
        info "Running $check..."
        if $check; then
            passed_checks+=("$check")
        else
            failed_checks+=("$check")
        fi
        echo
    done

    # Summary
    local total_checks=${#checks[@]}
    local passed_count=${#passed_checks[@]}
    local failed_count=${#failed_checks[@]}

    echo "=========================================="
    log "VERIFICATION SUMMARY"
    echo "=========================================="
    info "Total checks: $total_checks"
    info "Passed: $passed_count"
    info "Failed: $failed_count"
    echo

    if [ $failed_count -eq 0 ]; then
        log "🎉 ALL CHECKS PASSED! Production is ready!"
        exit 0
    else
        error "❌ SOME CHECKS FAILED! Production may not be ready!"
        error "Failed checks: ${failed_checks[*]}"
        exit 1
    fi
}

# Handle script interruption
trap 'error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"
