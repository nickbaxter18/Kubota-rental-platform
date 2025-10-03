# =====================================
# OUTPUTS
# =====================================

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.main.endpoint
  sensitive   = true
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "cluster_security_group_id" {
  description = "Security group ID for the EKS cluster"
  value       = aws_security_group.eks.id
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.database.endpoint
  sensitive   = true
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.database.db_name
}

output "database_username" {
  description = "Database username"
  value       = aws_db_instance.database.username
  sensitive   = true
}

output "load_balancer_dns" {
  description = "Load balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Load balancer zone ID"
  value       = aws_lb.main.zone_id
}

output "secret_arn" {
  description = "Secrets Manager ARN"
  value       = aws_secretsmanager_secret.app_secrets.arn
  sensitive   = true
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket for backups"
  value       = aws_s3_bucket.backups.bucket
}

# Connection commands for kubectl
output "configure_kubectl" {
  description = "Command to configure kubectl for this cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}

# Database connection string (without password for security)
output "database_connection_string" {
  description = "Database connection string template"
  value       = "postgresql://${aws_db_instance.database.username}:<password>@${aws_db_instance.database.endpoint}/${aws_db_instance.database.db_name}"
  sensitive   = true
}

# Redis connection string
output "redis_connection_string" {
  description = "Redis connection string template"
  value       = "redis://:<password>@${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379"
  sensitive   = true
}
