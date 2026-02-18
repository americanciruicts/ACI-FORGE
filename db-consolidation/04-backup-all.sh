#!/bin/bash

# ============================================================================
# Backup All Databases Script
# ============================================================================
# Purpose: Create backups of all databases on the consolidated server
# Creates both individual database backups and a full cluster backup
# ============================================================================

set -e
set -u

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
HOST="${POSTGRES_HOST:-localhost}"
PORT="${POSTGRES_PORT:-5432}"
ADMIN_USER="${POSTGRES_ADMIN_USER:-postgres}"
ADMIN_PASSWORD="${POSTGRES_ADMIN_PASSWORD:-postgres}"

# Backup configuration
BACKUP_ROOT="${BACKUP_ROOT:-./database-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# ============================================================================
# FUNCTIONS
# ============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    log "Creating backup directory: ${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}"
    log_success "Backup directory created"
}

# Backup a single database
backup_database() {
    local database=$1
    local backup_file="${BACKUP_DIR}/${database}.dump"

    log "Backing up database: ${database}"

    if PGPASSWORD="${ADMIN_PASSWORD}" pg_dump \
        -h "${HOST}" \
        -p "${PORT}" \
        -U "${ADMIN_USER}" \
        -d "${database}" \
        --format=custom \
        --verbose \
        --file="${backup_file}" 2>&1 | grep -v "^pg_dump: " || true; then

        # Get backup size
        local size=$(du -h "${backup_file}" | cut -f1)
        log_success "${database} backed up successfully (${size})"

        # Compress backup
        log "Compressing backup..."
        gzip "${backup_file}"
        local compressed_size=$(du -h "${backup_file}.gz" | cut -f1)
        log_success "Compressed to ${compressed_size}"

        return 0
    else
        log_error "Failed to backup ${database}"
        return 1
    fi
}

# Backup all databases
backup_all_databases() {
    log "=========================================="
    log "Backing up all databases"
    log "=========================================="

    local databases=("aci_dashboard" "kosh_inventory" "aci_excel_migration" "bom_compare" "nexus")

    for db in "${databases[@]}"; do
        backup_database "${db}"
        log ""
    done
}

# Create full cluster backup
backup_cluster() {
    log "=========================================="
    log "Creating full cluster backup"
    log "=========================================="

    local cluster_backup="${BACKUP_DIR}/full_cluster_backup.sql"

    log "Backing up all databases and globals..."

    if PGPASSWORD="${ADMIN_PASSWORD}" pg_dumpall \
        -h "${HOST}" \
        -p "${PORT}" \
        -U "${ADMIN_USER}" \
        --verbose \
        --file="${cluster_backup}" 2>&1 | grep -v "^pg_dump: " || true; then

        local size=$(du -h "${cluster_backup}" | cut -f1)
        log_success "Cluster backed up successfully (${size})"

        # Compress
        log "Compressing cluster backup..."
        gzip "${cluster_backup}"
        local compressed_size=$(du -h "${cluster_backup}.gz" | cut -f1)
        log_success "Compressed to ${compressed_size}"

        return 0
    else
        log_error "Failed to create cluster backup"
        return 1
    fi
}

# Create metadata file
create_metadata() {
    log "Creating backup metadata..."

    local metadata_file="${BACKUP_DIR}/backup_metadata.txt"

    cat > "${metadata_file}" <<EOF
Backup Metadata
================================================================================
Timestamp: ${TIMESTAMP}
Date: $(date)
Server: ${HOST}:${PORT}

Databases Backed Up:
- aci_dashboard
- kosh_inventory
- aci_excel_migration
- bom_compare
- nexus

Backup Format: PostgreSQL custom format (.dump) + gzip compression
Cluster Backup: full_cluster_backup.sql.gz (includes globals and all databases)

Backup Sizes:
EOF

    # Add file sizes
    cd "${BACKUP_DIR}"
    ls -lh *.gz >> "${metadata_file}"

    log_success "Metadata file created"
}

# Create restore instructions
create_restore_instructions() {
    log "Creating restore instructions..."

    local restore_file="${BACKUP_DIR}/RESTORE_INSTRUCTIONS.md"

    cat > "${restore_file}" <<'EOF'
# Database Restore Instructions

## Restore Individual Database

To restore a specific database from backup:

```bash
# 1. Decompress the backup
gunzip aci_dashboard.dump.gz

# 2. Drop existing database (CAUTION!)
PGPASSWORD='postgres' psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS aci_dashboard;"

# 3. Create fresh database
PGPASSWORD='postgres' psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE aci_dashboard;"

# 4. Restore from backup
PGPASSWORD='postgres' pg_restore \
    -h localhost \
    -p 5432 \
    -U postgres \
    -d aci_dashboard \
    --verbose \
    --no-owner \
    --no-acl \
    aci_dashboard.dump
```

## Restore Full Cluster

To restore the entire cluster (all databases):

```bash
# 1. Decompress the backup
gunzip full_cluster_backup.sql.gz

# 2. Stop all applications using the databases

# 3. Drop existing databases (CAUTION!)
PGPASSWORD='postgres' psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS aci_dashboard;"
PGPASSWORD='postgres' psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS kosh_inventory;"
PGPASSWORD='postgres' psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS aci_excel_migration;"
PGPASSWORD='postgres' psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS bom_compare;"
PGPASSWORD='postgres' psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS nexus;"

# 4. Restore from cluster backup
PGPASSWORD='postgres' psql -h localhost -p 5432 -U postgres -f full_cluster_backup.sql
```

## Restore to Different Server

```bash
# Use the same commands but change host/port:
PGPASSWORD='newpassword' pg_restore \
    -h new-server.example.com \
    -p 5432 \
    -U postgres \
    -d aci_dashboard \
    --verbose \
    --no-owner \
    --no-acl \
    aci_dashboard.dump
```

## Verify Restore

After restoring, verify the data:

```bash
# Check table count
PGPASSWORD='postgres' psql -h localhost -p 5432 -U postgres -d aci_dashboard \
    -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# Check row counts for specific tables
PGPASSWORD='postgres' psql -h localhost -p 5432 -U postgres -d aci_dashboard \
    -c "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables;"
```

## Point-in-Time Recovery

For point-in-time recovery, you would need WAL archiving enabled.
This backup is a consistent snapshot at the time of backup creation.

## Important Notes

1. Always test restores in a non-production environment first
2. Ensure sufficient disk space before restoring
3. Stop applications before restoring to avoid connection issues
4. Re-run privileges script after restore if needed
5. Verify application connectivity after restore

## Emergency Contacts

- Database Admin: [contact info]
- DevOps Team: [contact info]
EOF

    log_success "Restore instructions created"
}

# Clean old backups
clean_old_backups() {
    log "=========================================="
    log "Cleaning old backups"
    log "=========================================="

    log "Retention policy: ${RETENTION_DAYS} days"

    local deleted_count=0

    # Find and delete backups older than retention period
    while IFS= read -r -d '' backup_dir; do
        log "Deleting old backup: $(basename "${backup_dir}")"
        rm -rf "${backup_dir}"
        deleted_count=$((deleted_count + 1))
    done < <(find "${BACKUP_ROOT}" -maxdepth 1 -type d -mtime +${RETENTION_DAYS} -print0 2>/dev/null)

    if [ ${deleted_count} -gt 0 ]; then
        log_success "Deleted ${deleted_count} old backup(s)"
    else
        log "No old backups to delete"
    fi
}

# Calculate total backup size
calculate_backup_size() {
    log "=========================================="
    log "Backup Statistics"
    log "=========================================="

    local total_size=$(du -sh "${BACKUP_DIR}" | cut -f1)
    log "Total backup size: ${total_size}"

    local all_backups_size=$(du -sh "${BACKUP_ROOT}" | cut -f1)
    log "All backups size: ${all_backups_size}"

    local backup_count=$(find "${BACKUP_ROOT}" -maxdepth 1 -type d | wc -l)
    backup_count=$((backup_count - 1))  # Subtract root directory
    log "Total backup sets: ${backup_count}"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    log "=========================================="
    log "PostgreSQL Backup Script"
    log "=========================================="
    log "Server: ${HOST}:${PORT}"
    log "Timestamp: ${TIMESTAMP}"
    log ""

    # Create backup directory
    create_backup_dir
    log ""

    # Backup all databases individually
    backup_all_databases

    # Create full cluster backup
    backup_cluster
    log ""

    # Create metadata and instructions
    create_metadata
    create_restore_instructions
    log ""

    # Clean old backups
    clean_old_backups
    log ""

    # Show statistics
    calculate_backup_size
    log ""

    # Summary
    log "=========================================="
    log "Backup Complete!"
    log "=========================================="
    log_success "All databases backed up successfully"
    log ""
    log "Backup location: ${BACKUP_DIR}"
    log ""
    log "Files created:"
    log "  - aci_dashboard.dump.gz"
    log "  - kosh_inventory.dump.gz"
    log "  - aci_excel_migration.dump.gz"
    log "  - bom_compare.dump.gz"
    log "  - nexus.dump.gz"
    log "  - full_cluster_backup.sql.gz"
    log "  - backup_metadata.txt"
    log "  - RESTORE_INSTRUCTIONS.md"
    log ""
    log_success "Backup completed successfully!"
}

# Check dependencies
if ! command -v pg_dump &> /dev/null; then
    log_error "pg_dump not found. Please install PostgreSQL client tools."
    exit 1
fi

if ! command -v pg_dumpall &> /dev/null; then
    log_error "pg_dumpall not found. Please install PostgreSQL client tools."
    exit 1
fi

# Run main function
main "$@"
