#!/bin/bash

# =====================================
# PRODUCTION DATABASE MIGRATION SCRIPT
# =====================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"

# Default values
ENVIRONMENT="production"
MIGRATION_TYPE="latest"
CREATE_BACKUP=true
DRY_RUN=false

# =====================================
# UTILITY FUNCTIONS
# =====================================

check_command() {
    if ! command -v "$1" &> /dev/null; then
        error "$1 is not installed"
        exit 1
    fi
}

check_directory() {
    if [ ! -f "${BACKEND_DIR}/package.json" ]; then
        error "Backend directory not found"
        exit 1
    fi
}

check_environment_variables() {
    log "Checking environment variables..."

    local required_vars=(
        "DATABASE_URL"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done

    success "Environment variables verified"
}

# =====================================
# BACKUP FUNCTIONS
# =====================================

create_database_backup() {
    log "Creating database backup before migration..."

    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"

    # Use pg_dump to create backup
    if command -v pg_dump &> /dev/null; then
        # Extract database connection details from DATABASE_URL
        # Format: postgresql://user:password@host:port/database
        local db_url="${DATABASE_URL}"

        # Create backup
        if pg_dump "$db_url" -f "$backup_file" --no-owner --no-privileges --clean; then
            log "Database backup created: $backup_file"
            return 0
        else
            error "Failed to create database backup"
            return 1
        fi
    else
        warn "pg_dump not available, skipping backup"
        return 0
    fi
}

# =====================================
# MIGRATION FUNCTIONS
# =====================================

run_migrations() {
    log "Running database migrations..."

    cd "$BACKEND_DIR"

    # Check if TypeORM CLI is available
    if [ -f "node_modules/.bin/typeorm" ]; then
        log "Running TypeORM migrations..."

        if [ "$DRY_RUN" = true ]; then
            log "DRY RUN: Would run migrations..."
            node_modules/.bin/typeorm migration:show
        else
            # Run pending migrations
            if node_modules/.bin/typeorm migration:run; then
                success "Migrations completed successfully"
            else
                error "Migration failed"
                exit 1
            fi
        fi
    else
        warn "TypeORM CLI not found, checking for custom migration script..."

        # Check for custom migration script
        if [ -f "src/migrations/run-migrations.ts" ]; then
            if [ "$DRY_RUN" = true ]; then
                log "DRY RUN: Would run custom migrations..."
            else
                log "Running custom migration script..."
                if npx ts-node src/migrations/run-migrations.ts; then
                    success "Custom migrations completed successfully"
                else
                    error "Custom migration failed"
                    exit 1
                fi
            fi
        else
            warn "No migration system found"
        fi
    fi
}

show_migration_status() {
    log "Checking migration status..."

    cd "$BACKEND_DIR"

    if command -v npx &> /dev/null && [ -f "node_modules/.bin/typeorm" ]; then
        echo "Current migration status:"
        node_modules/.bin/typeorm migration:show
    else
        warn "Cannot check migration status - TypeORM CLI not available"
    fi
}

create_initial_migration() {
    log "Creating initial migration..."

    cd "$BACKEND_DIR"

    if [ -f "node_modules/.bin/typeorm" ]; then
        if node_modules/.bin/typeorm migration:create src/migrations/InitialSchema; then
            success "Initial migration created"
        else
            error "Failed to create initial migration"
            exit 1
        fi
    else
        error "TypeORM CLI not available"
        exit 1
    fi
}

# =====================================
# VALIDATION FUNCTIONS
# =====================================

validate_database_connection() {
    log "Validating database connection..."

    # Simple connection test using psql
    if command -v psql &> /dev/null; then
        # Extract connection details from DATABASE_URL
        local db_url="${DATABASE_URL}"

        if psql "$db_url" -c "SELECT 1;" &> /dev/null; then
            success "Database connection successful"
        else
            error "Database connection failed"
            exit 1
        fi
    else
        warn "psql not available, skipping connection test"
    fi
}

validate_migration_safety() {
    log "Validating migration safety..."

    # Check if we're running against production
    if [[ "${DATABASE_URL:-}" == *"prod"* ]]; then
        warn "Running migrations against PRODUCTION database!"
        read -p "Are you sure you want to continue? (yes/no): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            error "Migration cancelled by user"
            exit 1
        fi
    fi

    success "Migration safety validated"
}

# =====================================
# MAIN FUNCTIONS
# =====================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --migration-type)
                MIGRATION_TYPE="$2"
                shift 2
                ;;
            --no-backup)
                CREATE_BACKUP=false
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --create-migration)
                CREATE_MIGRATION=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --environment ENV        Set environment (default: production)"
                echo "  --migration-type TYPE    Set migration type (default: latest)"
                echo "  --no-backup             Skip database backup"
                echo "  --dry-run               Show what would be done"
                echo "  --create-migration      Create initial migration"
                echo "  --help                  Show this help message"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

main() {
    echo -e "${BLUE}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║              DATABASE MIGRATION SCRIPT                        ║
║                  UDigit Rental Platform                      ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    # Parse command line arguments
    local CREATE_MIGRATION=false
    parse_arguments "$@"

    # Pre-migration checks
    check_directory
    check_command "node"
    check_command "npm"

    # Load environment variables
    if [ -f "../.env.${ENVIRONMENT}" ]; then
        log "Loading environment variables from .env.${ENVIRONMENT}"
        source "../.env.${ENVIRONMENT}"
    else
        warn "Environment file .env.${ENVIRONMENT} not found"
    fi

    check_environment_variables
    validate_database_connection
    validate_migration_safety

    # Show current status
    show_migration_status

    # Create backup if requested
    if [ "$CREATE_BACKUP" = true ]; then
        create_database_backup
    fi

    # Create initial migration if requested
    if [ "$CREATE_MIGRATION" = true ]; then
        create_initial_migration
        exit 0
    fi

    # Run migrations
    run_migrations

    # Post-migration validation
    log "Validating migration results..."
    show_migration_status

    success "🎉 DATABASE MIGRATION COMPLETED SUCCESSFULLY!"

    if [ "$DRY_RUN" = true ]; then
        info "This was a dry run - no actual changes were made"
    fi
}

# =====================================
# SCRIPT ENTRY POINT
# =====================================

# Handle script interruption
trap 'error "Migration interrupted"; exit 1' INT TERM

# Run main function with all arguments
main "$@"
