terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# =====================================
# VPC CONFIGURATION
# =====================================
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "udigit-${var.environment}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "udigit-${var.environment}-public-${count.index}"
    Environment = var.environment
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "udigit-${var.environment}-private-${count.index}"
    Environment = var.environment
  }
}

# =====================================
# SECURITY GROUPS
# =====================================
resource "aws_security_group" "eks" {
  name_prefix = "udigit-${var.environment}-eks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# =====================================
# EKS CLUSTER
# =====================================
resource "aws_eks_cluster" "main" {
  name     = "udigit-${var.environment}"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_AmazonEKSClusterPolicy,
    aws_iam_role_policy_attachment.eks_cluster_AmazonEKSVPCResourceController,
  ]
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "udigit-${var.environment}-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id

  instance_types = ["t3.medium"]
  capacity_type  = "ON_DEMAND"

  scaling_config {
    desired_size = 3
    max_size     = 5
    min_size     = 2
  }

  update_config {
    max_unavailable = 1
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_nodes_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.eks_nodes_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.eks_nodes_AmazonEC2ContainerRegistryReadOnly,
  ]
}

# =====================================
# RDS DATABASE
# =====================================
resource "aws_db_subnet_group" "database" {
  name       = "udigit-${var.environment}-db"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "udigit-${var.environment}-db"
    Environment = var.environment
  }
}

resource "aws_db_instance" "database" {
  identifier = "udigit-${var.environment}-db"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true

  db_name  = "udigit_${var.environment}"
  username = "udigit_${var.environment}"
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.database.name
  vpc_security_group_ids = [aws_security_group.database.id]

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  multi_az            = var.environment == "production"
  skip_final_snapshot = var.environment != "production"

  tags = {
    Name        = "udigit-${var.environment}-db"
    Environment = var.environment
  }
}

# =====================================
# ELASTICACHE REDIS
# =====================================
resource "aws_elasticache_subnet_group" "redis" {
  name       = "udigit-${var.environment}-redis"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "udigit-${var.environment}-redis"
  engine              = "redis"
  node_type           = "cache.t3.micro"
  num_cache_nodes     = 1
  parameter_group_name = "default.redis6.x"
  engine_version      = "6.x"

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  tags = {
    Name        = "udigit-${var.environment}-redis"
    Environment = var.environment
  }
}

# =====================================
# S3 BUCKET FOR BACKUPS
# =====================================
resource "aws_s3_bucket" "backups" {
  bucket = "udigit-${var.environment}-backups"

  tags = {
    Name        = "udigit-${var.environment}-backups"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "cleanup"
    status = "Enabled"

    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

# =====================================
# CLOUDFLARE INTEGRATION (Optional)
# =====================================
# Uncomment and configure if using Cloudflare
# resource "cloudflare_zone" "main" {
#   zone = var.domain_name
# }

# resource "cloudflare_record" "api" {
#   zone_id = cloudflare_zone.main.id
#   name    = "api"
#   value   = aws_lb.main.dns_name
#   type    = "CNAME"
#   ttl     = 300
#   proxied = true
# }

# resource "cloudflare_record" "frontend" {
#   zone_id = cloudflare_zone.main.id
#   name    = "@"
#   value   = aws_lb.main.dns_name
#   type    = "CNAME"
#   ttl     = 300
#   proxied = true
# }

# =====================================
# LOAD BALANCER
# =====================================
resource "aws_lb" "main" {
  name               = "udigit-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.environment == "production"

  tags = {
    Name        = "udigit-${var.environment}-alb"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "frontend" {
  name     = "udigit-${var.environment}-frontend"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
}

resource "aws_lb_target_group" "backend" {
  name     = "udigit-${var.environment}-backend"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
}

# =====================================
# SECRETS MANAGER
# =====================================
resource "aws_secretsmanager_secret" "app_secrets" {
  name = "udigit-${var.environment}-app-secrets"
  recovery_window_in_days = var.environment == "production" ? 30 : 0
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    JWT_SECRET       = random_password.jwt_secret.result
    DB_PASSWORD      = random_password.db_password.result
    REDIS_PASSWORD   = random_password.redis_password.result
    SENTRY_DSN       = var.sentry_dsn
  })
}

# =====================================
# OUTPUTS
# =====================================
output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.database.endpoint
}

output "load_balancer_dns" {
  description = "Load balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "secret_arn" {
  description = "Secrets Manager ARN"
  value       = aws_secretsmanager_secret.app_secrets.arn
}
