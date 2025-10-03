# 🚀 Production Deployment Guide

## Prerequisites

- ✅ GitHub repository created
- ✅ Production domain configured
- ✅ SSL certificates installed
- ✅ Database and Redis provisioned
- ✅ Cloud storage configured
- ✅ CI/CD pipeline ready

## Quick Start

### 1. Environment Setup
```bash
# Clone repository
git clone https://github.com/nickbaxter18/kubota-rental-platform.git
cd kubota-rental-platform

# Install dependencies
pnpm install

# Setup production environment
cp .env.example .env.production
# Edit .env.production with your production values
```

### 2. Infrastructure Deployment

```bash
# Deploy infrastructure
cd infra/terraform
terraform init
terraform plan -var="environment=production"
terraform apply -var="environment=production"

# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name udigit-production
```

### 3. Application Deployment

```bash
# Deploy via GitHub Actions
# Go to Actions tab and run "Production Deployment" workflow

# Or deploy manually
kubectl apply -f infra/k8s/production/
kubectl rollout status deployment/backend-production
kubectl rollout status deployment/frontend-production
```

### 4. Verification

```bash
# Health checks
curl https://api.udigit-rentals.com/health
curl https://udigit-rentals.com/health

# Load testing
npx artillery run scripts/load-test.yml

# Monitoring
# Check Sentry dashboard
# Check Grafana dashboard
```

## Architecture

```javascript
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloudflare   │    │   Kubernetes    │    │     AWS RDS     │
│     CDN         │───▶│   Cluster       │───▶│   PostgreSQL    │
└─────────────────┘    │                 │    └─────────────────┘
                       │   ┌─────────┐   │
┌─────────────────┐    │   │  Redis  │   │    ┌─────────────────┐
│     Users       │───▶│   │ Cluster │   │───▶│   AWS S3/R2     │
└─────────────────┘    │   └─────────┘   │    └─────────────────┘
                       │                 │
┌─────────────────┐    │   ┌─────────┐   │    ┌─────────────────┐
│   Monitoring    │◀───┤   │ Sentry  │◀──┤    │   Logging       │
│   (Grafana)     │    │   └─────────┘   │    │   (CloudWatch)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Security Checklist

- [ ] SSL certificates configured
- [ ] Security headers implemented
- [ ] Rate limiting active
- [ ] Secrets management configured
- [ ] Firewall rules set
- [ ] DDoS protection enabled

## Performance Checklist

- [ ] CDN configured
- [ ] Database indexes optimized
- [ ] Redis caching active
- [ ] Image optimization enabled
- [ ] Compression enabled

## Monitoring Checklist

- [ ] Sentry error tracking
- [ ] Grafana dashboards
- [ ] Alert rules configured
- [ ] Log aggregation setup
- [ ] Performance monitoring

## Backup & Recovery

- [ ] Daily database backups
- [ ] Redis backups configured
- [ ] Disaster recovery plan
- [ ] Backup verification
- [ ] Recovery testing

## Support

For production issues:

1. Check health endpoints
2. Review Sentry errors
3. Check Grafana metrics
4. Review application logs
5. Contact on-call engineer

## Environment Variables

### Required Variables
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key
SENTRY_DSN=https://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Optional Variables
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CACHE_TTL=3600
COMPRESSION_LEVEL=6
```

## Deployment Commands

### Blue-Green Deployment
```bash
# Deploy new version
kubectl set image deployment/backend-production backend=your-new-image:tag
kubectl set image deployment/frontend-production frontend=your-new-image:tag

# Monitor rollout
kubectl rollout status deployment/backend-production
kubectl rollout status deployment/frontend-production
```

### Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/backend-production
kubectl rollout undo deployment/frontend-production
```

### Scaling
```bash
# Scale deployments
kubectl scale deployment backend-production --replicas=5
kubectl scale deployment frontend-production --replicas=3
```

## Health Checks

### Application Health
- **Backend**: `https://api.udigit-rentals.com/health`
- **Frontend**: `https://udigit-rentals.com/health`

### Infrastructure Health
```bash
# Kubernetes nodes
kubectl get nodes

# Pod status
kubectl get pods -n production

# Service status
kubectl get services -n production
```

## Monitoring

### Sentry
- **Dashboard**: Access via web interface
- **Error tracking**: Automatic error capture
- **Performance monitoring**: Transaction tracing

### Logs
```bash
# View logs
kubectl logs -f deployment/backend-production -n production
kubectl logs -f deployment/frontend-production -n production

# Previous pod logs
kubectl logs --previous deployment/backend-production -n production
```

## Troubleshooting

### Common Issues

1. **High CPU Usage**
   ```bash
   kubectl top pods -n production
   kubectl describe pod <pod-name> -n production
   ```

2. **Memory Leaks**
   ```bash
   kubectl top pods -n production --sort-by=memory
   ```

3. **Database Connection Issues**
   ```bash
   kubectl exec -it deployment/backend-production -n production -- /bin/sh
   # Check database connectivity
   ```

4. **Service Discovery Issues**
   ```bash
   kubectl get endpoints -n production
   nslookup backend-production.production.svc.cluster.local
   ```

## Security

### SSL/TLS
- Certificates managed via cert-manager
- Automatic renewal configured
- HTTP to HTTPS redirect active

### Network Policies
```bash
# View network policies
kubectl get networkpolicies -n production

# Create network policy
kubectl apply -f infra/k8s/production/network-policy.yml
```

### Secrets Management
```bash
# View secrets
kubectl get secrets -n production

# Update secret
kubectl create secret generic backend-secrets \
  --from-literal=database-url="postgresql://..." \
  --dry-run=client -o yaml | kubectl apply -f -
```

## Performance Optimization

### Horizontal Pod Autoscaling
```bash
# Enable HPA
kubectl autoscale deployment backend-production \
  --cpu-percent=70 --min=3 --max=10 -n production

kubectl autoscale deployment frontend-production \
  --cpu-percent=70 --min=2 --max=5 -n production
```

### Resource Limits
```bash
# Update resource limits
kubectl set resources deployment/backend-production \
  -n production --limits=cpu=1000m,memory=1Gi
```

## Backup and Recovery

### Automated Backups
```bash
# Run backup script
./scripts/production-backup.sh

# Schedule via cron
0 2 * * * /path/to/kubota-rental-platform/scripts/production-backup.sh
```

### Manual Recovery
```bash
# Scale down application
kubectl scale deployment backend-production --replicas=0 -n production
kubectl scale deployment frontend-production --replicas=0 -n production

# Restore database
psql $DATABASE_URL < backup_file.sql

# Scale back up
kubectl scale deployment backend-production --replicas=3 -n production
kubectl scale deployment frontend-production --replicas=2 -n production
```

## Cost Optimization

### Resource Optimization
- Right-size pods based on usage
- Use spot instances for non-critical workloads
- Implement auto-scaling policies

### Storage Optimization
- Use appropriate storage classes
- Implement data retention policies
- Archive old data to cheaper storage

## Compliance

### Data Protection
- PII data encrypted at rest and in transit
- Regular security audits
- Access logging enabled

### GDPR Compliance
- Data processing agreements in place
- User consent management
- Data deletion capabilities

## Emergency Contacts

### Development Team
- **On-call Engineer**: +1-XXX-XXX-XXXX
- **Tech Lead**: tech-lead@udigit-rentals.com
- **DevOps Team**: devops@udigit-rentals.com

### External Services
- **Cloud Provider**: AWS Support
- **CDN Provider**: Cloudflare Support
- **Monitoring**: Sentry Support

---

**Last Updated**: October 2025
**Version**: 1.0.0
**Environment**: Production
