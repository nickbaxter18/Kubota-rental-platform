# =====================================
# PRODUCTION TERRAFORM VARIABLES
# =====================================

aws_region     = "us-east-1"
environment    = "production"
domain_name    = "udigit-rentals.com"

# Database configuration
db_instance_class = "db.t3.medium"

# Redis configuration
redis_node_type = "cache.t3.micro"

# EKS configuration
eks_node_instance_types = ["t3.medium"]

# Enable monitoring
enable_monitoring = true

# Backup retention
backup_retention_days = 30

# SSL certificate ARN (if using ACM)
# ssl_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/..."

# Sentry DSN (will be set via environment variable)
# sentry_dsn = "https://..."
