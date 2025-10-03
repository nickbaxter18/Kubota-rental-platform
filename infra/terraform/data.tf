# =====================================
# DATA SOURCES
# =====================================

data "aws_availability_zones" "available" {
  state = "available"

  filter {
    name   = "region-name"
    values = [var.aws_region]
  }
}

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

# Get current AWS account ID
locals {
  account_id = data.aws_caller_identity.current.account_id
  partition  = data.aws_partition.current.partition
}

# Cloudflare provider configuration would go here if using Cloudflare provider
# data "cloudflare_zones" "domain" {
#   filter {
#     name   = var.domain_name
#     status = "active"
#   }
# }
