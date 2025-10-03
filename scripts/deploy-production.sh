#!/bin/bash

# =====================================
# PRODUCTION DEPLOYMENT ORCHESTRATOR
# =====================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TERRAFORM_DIR="${PROJECT_ROOT}/infra/terraform"
KUBERNETES_DIR="${PROJECT_ROOT}/infra/k8s/production"
BACKUP_DIR="${PROJECT_ROOT}/backups"

# Default values
ENVIRONMENT="production"
AWS_REGION="us-east-1"
SKIP_INFRASTRUCTURE=false
SKIP_DEPLOYMENT=false
RUN_VERIFICATION=true

# =====================================
# UTILITY FUNCTIONS
# =====================================

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

# Check if command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        error "$1 is not installed"
        exit 1
    fi
}

# Check if we're in the right directory
check_directory() {
    if [ ! -f "${PROJECT_ROOT}/package.json" ]; then
        error "Not in the correct project directory"
        exit 1
    fi
}

# Check AWS credentials
check_aws_credentials() {
    log "Checking AWS credentials..."

    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured or invalid"
        error "Please run: aws configure"
        exit 1
    fi

    success "AWS credentials verified"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    local prerequisites=(
        "aws"
        "terraform"
        "kubectl"
        "docker"
        "git"
    )

    for cmd in "${prerequisites[@]}"; do
        check_command "$cmd"
    done

    success "All prerequisites installed"
}

# =====================================
# INFRASTRUCTURE DEPLOYMENT
# =====================================

deploy_infrastructure() {
    log "🚀 Starting infrastructure deployment..."

    cd "$TERRAFORM_DIR"

    # Check if Terraform is initialized
    if [ ! -d ".terraform" ]; then
        log "Initializing Terraform..."
        if ! terraform init; then
            error "Failed to initialize Terraform"
            exit 1
        fi
    fi

    # Validate configuration
    log "Validating Terraform configuration..."
    if ! terraform validate; then
        error "Terraform configuration is invalid"
        exit 1
    fi

    # Plan infrastructure
    log "Planning infrastructure changes..."
    if ! terraform plan -var-file="production.tfvars" -out=tfplan; then
        error "Terraform plan failed"
        exit 1
    fi

    # Apply infrastructure with auto-approval for CI/CD
    log "Applying infrastructure changes..."
    if ! terraform apply -auto-approve tfplan; then
        error "Infrastructure deployment failed"
        log "Attempting to show current state..."
        terraform show
        exit 1
    fi

    # Get outputs for later use
    if ! terraform output -json > terraform-outputs.json; then
        warn "Failed to save Terraform outputs, but deployment succeeded"
    fi

    success "Infrastructure deployment completed"
}

# =====================================
# KUBERNETES DEPLOYMENT
# =====================================

configure_kubernetes() {
    log "Configuring Kubernetes access..."

    cd "$TERRAFORM_DIR"

    # Get cluster configuration
    local cluster_name=$(terraform output -raw cluster_name)
    local aws_region=$(terraform output -raw configure_kubectl | grep -o 'region [^ ]*' | awk '{print $2}')

    # Configure kubectl
    aws eks update-kubeconfig --region "$aws_region" --name "$cluster_name"

    success "Kubernetes access configured"
}

deploy_to_kubernetes() {
    log "🚀 Deploying application to Kubernetes..."

    # Apply Kubernetes manifests in order
    log "Applying namespace and configuration..."
    kubectl apply -f "$KUBERNETES_DIR/backend-deployment.yml"
    kubectl apply -f "$KUBERNETES_DIR/frontend-deployment.yml"

    log "Applying network policies..."
    kubectl apply -f "$KUBERNETES_DIR/network-policy.yml"

    log "Applying monitoring stack..."
    kubectl apply -f "$KUBERNETES_DIR/monitoring.yml"

    # Wait for deployments to be ready
    log "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/backend-production
    kubectl wait --for=condition=available --timeout=300s deployment/frontend-production

    # Check pod status
    kubectl get pods -n production
    kubectl get services -n production
    kubectl get ingress -n production

    success "Application deployed to Kubernetes"
}

# =====================================
# APPLICATION DEPLOYMENT
# =====================================

build_and_push_images() {
    log "🏗️  Building and pushing Docker images..."

    # Build backend image
    docker build -f docker/backend/Dockerfile -t udigit-backend:latest backend/
    docker tag udigit-backend:latest ghcr.io/nickbaxter18/kubota-rental-platform/backend:latest

    # Build frontend image
    docker build -f docker/frontend/Dockerfile -t udigit-frontend:latest frontend/
    docker tag udigit-frontend:latest ghcr.io/nickbaxter18/kubota-rental-platform/frontend:latest

    # Push images (requires authentication)
    docker push ghcr.io/nickbaxter18/kubota-rental-platform/backend:latest
    docker push ghcr.io/nickbaxter18/kubota-rental-platform/frontend:latest

    success "Docker images built and pushed"
}

update_kubernetes_images() {
    log "🔄 Updating Kubernetes deployments with new images..."

    # Update deployments with new images
    kubectl set image deployment/backend-production backend=ghcr.io/nickbaxter18/kubota-rental-platform/backend:latest
    kubectl set image deployment/frontend-production frontend=ghcr.io/nickbaxter18/kubota-rental-platform/frontend:latest

    # Wait for rollout to complete
    kubectl rollout status deployment/backend-production
    kubectl rollout status deployment/frontend-production

    success "Kubernetes deployments updated"
}

# =====================================
# VERIFICATION
# =====================================

run_verification() {
    log "🔍 Running production verification..."

    # Run the production verifier script
    if [ -f "${PROJECT_ROOT}/scripts/production-verifier.sh" ]; then
        bash "${PROJECT_ROOT}/scripts/production-verifier.sh"
    else
        warn "Production verifier script not found"
    fi

    # Additional verification steps
    log "Checking application endpoints..."

    # Check backend health
    if curl -f "https://api.udigit-rentals.com/health" &> /dev/null; then
        success "Backend health check passed"
    else
        error "Backend health check failed"
        exit 1
    fi

    # Check frontend health
    if curl -f "https://udigit-rentals.com/health" &> /dev/null; then
        success "Frontend health check passed"
    else
        error "Frontend health check failed"
        exit 1
    fi

    success "Production verification completed"
}

# =====================================
# BACKUP
# =====================================

create_deployment_backup() {
    log "💾 Creating pre-deployment backup..."

    if [ -f "${PROJECT_ROOT}/scripts/production-backup.sh" ]; then
        bash "${PROJECT_ROOT}/scripts/production-backup.sh"
    else
        warn "Backup script not found, skipping backup"
    fi
}

# =====================================
# MAIN DEPLOYMENT FLOW
# =====================================

print_banner() {
    echo -e "${PURPLE}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                 🚀 PRODUCTION DEPLOYMENT                     ║
║                  UDigit Rental Platform                      ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-infrastructure)
                SKIP_INFRASTRUCTURE=true
                shift
                ;;
            --skip-deployment)
                SKIP_DEPLOYMENT=true
                shift
                ;;
            --skip-verification)
                RUN_VERIFICATION=false
                shift
                ;;
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --region)
                AWS_REGION="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-infrastructure    Skip infrastructure deployment"
                echo "  --skip-deployment       Skip application deployment"
                echo "  --skip-verification     Skip production verification"
                echo "  --environment ENV       Set environment (default: production)"
                echo "  --region REGION         Set AWS region (default: us-east-1)"
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
    print_banner

    # Parse command line arguments
    parse_arguments "$@"

    # Set AWS region
    export AWS_REGION="$AWS_REGION"

    # Pre-deployment checks
    check_directory
    check_prerequisites
    check_aws_credentials

    # Create backup before deployment
    create_deployment_backup

    # Infrastructure deployment
    if [ "$SKIP_INFRASTRUCTURE" = false ]; then
        deploy_infrastructure
    else
        log "Skipping infrastructure deployment"
    fi

    # Kubernetes configuration
    configure_kubernetes

    # Application deployment
    if [ "$SKIP_DEPLOYMENT" = false ]; then
        build_and_push_images
        deploy_to_kubernetes
        update_kubernetes_images
    else
        log "Skipping application deployment"
    fi

    # Verification
    if [ "$RUN_VERIFICATION" = true ]; then
        run_verification
    else
        log "Skipping verification"
    fi

    # Final success message
    success "🎉 PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo
    info "Application URLs:"
    info "  Frontend: https://udigit-rentals.com"
    info "  API: https://api.udigit-rentals.com"
    echo
    info "Next steps:"
    info "  - Monitor application in Sentry dashboard"
    info "  - Check Kubernetes pods: kubectl get pods -n production"
    info "  - View logs: kubectl logs -f deployment/backend-production -n production"
    info "  - Run load tests: artillery run scripts/load-test.yml"
}

# =====================================
# SCRIPT ENTRY POINT
# =====================================

# Handle script interruption
trap 'error "Deployment interrupted"; exit 1' INT TERM

# Run main function with all arguments
main "$@"
