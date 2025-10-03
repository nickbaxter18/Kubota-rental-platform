#!/bin/bash

# =====================================
# PRODUCTION BACKUP SCRIPT
# =====================================

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
backup_database() {
    log "Starting database backup..."

    BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"

    # Use pg_dump with connection string
    PGPASSWORD=$DB_PASSWORD pg_dump \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        | gzip > $BACKUP_FILE

    if [ $? -eq 0 ]; then
        log "Database backup completed: $BACKUP_FILE"
        BACKUP_SIZE=$(du -h $BACKUP_FILE | cut -f1)
        log "Backup size: $BACKUP_SIZE"
    else
        error "Database backup failed!"
        exit 1
    fi
}

# Redis backup
backup_redis() {
    log "Starting Redis backup..."

    BACKUP_FILE="$BACKUP_DIR/redis_backup_$DATE.rdb"

    # Use redis-cli to create RDB backup
    redis-cli \
        -h $REDIS_HOST \
        -p $REDIS_PORT \
        -a $REDIS_PASSWORD \
        SAVE

    # Copy the RDB file
    docker cp redis:/data/dump.rdb $BACKUP_FILE

    if [ $? -eq 0 ]; then
        log "Redis backup completed: $BACKUP_FILE"
    else
        error "Redis backup failed!"
        exit 1
    fi
}

# Upload to cloud storage
upload_backup() {
    log "Uploading backups to cloud storage..."

    # Upload database backup
    aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz \
        s3://udigit-backups/database/ \
        --storage-class STANDARD_IA

    # Upload Redis backup
    aws s3 cp $BACKUP_DIR/redis_backup_$DATE.rdb \
        s3://udigit-backups/redis/ \
        --storage-class STANDARD_IA

    if [ $? -eq 0 ]; then
        log "Backups uploaded successfully"
    else
        error "Backup upload failed!"
        exit 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."

    # Local cleanup
    find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find $BACKUP_DIR -type f -name "*.rdb" -mtime +$RETENTION_DAYS -delete

    # Cloud cleanup
    aws s3api list-objects-v2 \
        --bucket udigit-backups \
        --prefix "database/" \
        --query "Contents[?LastModified<=`${RETENTION_DAYS}d`].[Key]" \
        --output text | xargs -I {} aws s3 rm s3://udigit-backups/{} 2>/dev/null || true

    log "Cleanup completed"
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."

    # Test database backup
    gunzip -t $BACKUP_DIR/db_backup_$DATE.sql.gz

    if [ $? -eq 0 ]; then
        log "Database backup verification passed"
    else
        error "Database backup verification failed!"
        exit 1
    fi
}

# Main execution
main() {
    log "Starting production backup process..."

    backup_database
    backup_redis
    verify_backup
    upload_backup
    cleanup_old_backups

    log "Production backup process completed successfully!"

    # Send notification
    curl -X POST \
        -H 'Content-type: application/json' \
        --data '{"text":"✅ Production backup completed successfully"}' \
        $SLACK_WEBHOOK_URL
}

# Run main function
main "$@"
