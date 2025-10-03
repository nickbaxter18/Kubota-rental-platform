#!/bin/bash

# =====================================
# PRODUCTION SECRETS MANAGEMENT SCRIPT
# =====================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

success() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENVIRONMENT="production"
SECRETS_FILE="${PROJECT_ROOT}/.env.${ENVIRONMENT}"
KUBERNETES_NAMESPACE="production"

# =====================================
# UTILITY FUNCTIONS
# =====================================

check_command() {
    if ! command -v "$1" &> /dev/null; then
        error "$1 is not installed"
        exit 1
    fi
}

generate_secret() {
    local length=${1:-32}
    if command -v openssl &> /dev/null; then
        openssl rand -base64 "$length"
    elif command -v python3 &> /dev/null; then
        python3 -c "import secrets,base64; print(base64.b64decode(secrets.token_bytes($length)).decode())"
    else
        # Fallback for systems without openssl or python3
        tr -dc 'A-Za-z0-9!@#$%^&*()_+' < /dev/urandom | head -c "$length"
    fi
}

# =====================================
# SECRET GENERATION
# =====================================

generate_production_secrets() {
    log "Generating production secrets..."

    local secrets=(
        "JWT_SECRET:64"
        "JWT_REFRESH_SECRET:64"
        "DB_PASSWORD:32"
        "REDIS_PASSWORD:32"
        "SENTRY_DSN:128"
    )

    echo "# =====================================" > "$SECRETS_FILE"
    echo "# PRODUCTION ENVIRONMENT SECRETS" >> "$SECRETS_FILE"
    echo "# Generated on: $(date)" >> "$SECRETS_FILE"
    echo "# =====================================" >> "$SECRETS_FILE"
    echo "" >> "$SECRETS_FILE"

    for secret_def in "${secrets[@]}"; do
        local secret_name=$(echo "$secret_def" | cut -d: -f1)
        local secret_length=$(echo "$secret_def" | cut -d: -f2)

        local secret_value
        secret_value=$(generate_secret "$secret_length")

        echo "${secret_name}=${secret_value}" >> "$SECRETS_FILE"

        # Set environment variable for immediate use
        export "${secret_name}=${secret_value}"
    done

    success "Production secrets generated in $SECRETS_FILE"
}

# =====================================
# KUBERNETES SECRETS
# =====================================

create_kubernetes_secrets() {
    log "Creating Kubernetes secrets..."

    # Check if we're in Kubernetes context
    if ! kubectl cluster-info &> /dev/null; then
        error "Not connected to Kubernetes cluster"
        error "Please run: aws eks update-kubeconfig or equivalent"
        exit 1
    fi

    # Create namespace if it doesn't exist
    if ! kubectl get namespace "$KUBERNETES_NAMESPACE" &> /dev/null; then
        log "Creating namespace $KUBERNETES_NAMESPACE..."
        kubectl create namespace "$KUBERNETES_NAMESPACE"
    fi

    # Load secrets from file
    if [ -f "$SECRETS_FILE" ]; then
        source "$SECRETS_FILE"
    else
        error "Secrets file not found: $SECRETS_FILE"
        exit 1
    fi

    # Create backend secrets
    log "Creating backend secrets..."
    kubectl create secret generic backend-secrets \
        --namespace="$KUBERNETES_NAMESPACE" \
        --from-literal=database-url="$DATABASE_URL" \
        --from-literal=redis-url="$REDIS_URL" \
        --from-literal=jwt-secret="$JWT_SECRET" \
        --from-literal=sentry-dsn="$SENTRY_DSN" \
        --dry-run=client -o yaml | kubectl apply -f -

    # Create frontend secrets
    log "Creating frontend secrets..."
    kubectl create secret generic frontend-secrets \
        --namespace="$KUBERNETES_NAMESPACE" \
        --from-literal=sentry-dsn="$SENTRY_DSN" \
        --dry-run=client -o yaml | kubectl apply -f -

    success "Kubernetes secrets created"
}

# =====================================
# AWS SECRETS MANAGER
# =====================================

create_aws_secrets() {
    log "Creating AWS Secrets Manager entries..."

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured"
        exit 1
    fi

    # Load secrets from file
    if [ -f "$SECRETS_FILE" ]; then
        source "$SECRETS_FILE"
    else
        error "Secrets file not found: $SECRETS_FILE"
        exit 1
    fi

    local secret_name="udigit-${ENVIRONMENT}-app-secrets"

    # Create or update secret in AWS Secrets Manager
    if aws secretsmanager describe-secret --secret-id "$secret_name" &> /dev/null; then
        log "Updating existing secret: $secret_name"
        aws secretsmanager update-secret \
            --secret-id "$secret_name" \
            --secret-string "{\"JWT_SECRET\":\"$JWT_SECRET\",\"DB_PASSWORD\":\"$DB_PASSWORD\",\"REDIS_PASSWORD\":\"$REDIS_PASSWORD\",\"SENTRY_DSN\":\"$SENTRY_DSN\"}"
    else
        log "Creating new secret: $secret_name"
        aws secretsmanager create-secret \
            --name "$secret_name" \
            --secret-string "{\"JWT_SECRET\":\"$JWT_SECRET\",\"DB_PASSWORD\":\"$DB_PASSWORD\",\"REDIS_PASSWORD\":\"$REDIS_PASSWORD\",\"SENTRY_DSN\":\"$SENTRY_DSN\"}" \
            --description "Application secrets for UDigit Rental Platform"
    fi

    success "AWS Secrets Manager entries created"
}

# =====================================
# SECRET VALIDATION
# =====================================

validate_secrets() {
    log "Validating secrets..."

    local required_secrets=(
        "JWT_SECRET"
        "DB_PASSWORD"
        "REDIS_PASSWORD"
        "SENTRY_DSN"
    )

    local missing_secrets=()

    for secret in "${required_secrets[@]}"; do
        if [ -z "${!secret:-}" ]; then
            missing_secrets+=("$secret")
        fi
    done

    if [ ${#missing_secrets[@]} -ne 0 ]; then
        error "Missing required secrets: ${missing_secrets[*]}"
        return 1
    fi

    # Validate secret strength
    if [ ${#JWT_SECRET} -lt 32 ]; then
        error "JWT_SECRET is too weak (minimum 32 characters)"
        return 1
    fi

    if [ ${#DB_PASSWORD} -lt 16 ]; then
        error "DB_PASSWORD is too weak (minimum 16 characters)"
        return 1
    fi

    success "All secrets validated"
    return 0
}

# =====================================
# SECRET ROTATION
# =====================================

rotate_secrets() {
    log "Rotating existing secrets..."

    # Backup current secrets
    local backup_file="${SECRETS_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    if [ -f "$SECRETS_FILE" ]; then
        cp "$SECRETS_FILE" "$backup_file"
        log "Backed up current secrets to: $backup_file"
    fi

    # Generate new secrets
    generate_production_secrets

    # Update Kubernetes secrets
    create_kubernetes_secrets

    # Update AWS Secrets Manager
    create_aws_secrets

    success "Secrets rotated successfully"
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
            --rotate)
                ROTATE_SECRETS=true
                shift
                ;;
            --validate-only)
                VALIDATE_ONLY=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --environment ENV       Set environment (default: production)"
                echo "  --rotate               Rotate existing secrets"
                echo "  --validate-only        Only validate existing secrets"
                echo "  --help                 Show this help message"
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
║              SECRETS MANAGEMENT SCRIPT                        ║
║                  UDigit Rental Platform                      ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    # Parse command line arguments
    local ROTATE_SECRETS=false
    local VALIDATE_ONLY=false
    parse_arguments "$@"

    # Update configuration based on environment
    SECRETS_FILE="${PROJECT_ROOT}/.env.${ENVIRONMENT}"

    # Validate only mode
    if [ "$VALIDATE_ONLY" = true ]; then
        if [ -f "$SECRETS_FILE" ]; then
            log "Loading existing secrets from $SECRETS_FILE"
            source "$SECRETS_FILE"
            validate_secrets
            success "Secret validation completed"
        else
            error "Secrets file not found: $SECRETS_FILE"
            exit 1
        fi
        exit 0
    fi

    # Check prerequisites
    check_command "kubectl"

    # Generate secrets
    if [ "$ROTATE_SECRETS" = true ]; then
        rotate_secrets
    else
        generate_production_secrets
    fi

    # Validate generated secrets
    source "$SECRETS_FILE"
    validate_secrets

    # Create Kubernetes secrets
    create_kubernetes_secrets

    # Create AWS Secrets Manager entries
    create_aws_secrets

    success "🎉 SECRETS MANAGEMENT COMPLETED SUCCESSFULLY!"
    echo
    info "Secrets file: $SECRETS_FILE"
    info "Kubernetes namespace: $KUBERNETES_NAMESPACE"
    echo
    warn "IMPORTANT: Store the secrets file securely and distribute to authorized personnel only"
    info "Next steps:"
    info "  - Deploy infrastructure with secrets"
    info "  - Run database migrations"
    info "  - Deploy application"
}

# =====================================
# SCRIPT ENTRY POINT
# =====================================

# Handle script interruption
trap 'error "Secrets management interrupted"; exit 1' INT TERM

# Run main function with all arguments
main "$@"
