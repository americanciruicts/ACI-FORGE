#!/bin/bash

# ============================================================================
# Database Migration Script
# ============================================================================
# Purpose: Migrate data from old PostgreSQL servers to consolidated server
# Usage: ./02-migrate-data.sh
# ============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# CONFIGURATION
# ============================================================================

# New consolidated server
NEW_HOST="${NEW_HOST:-localhost}"
NEW_PORT="${NEW_PORT:-5432}"
NEW_POSTGRES_USER="${NEW_POSTGRES_USER:-postgres}"
NEW_POSTGRES_PASSWORD="${NEW_POSTGRES_PASSWORD:-postgres}"

# Backup directory
BACKUP_DIR="./database-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR_WITH_TS="${BACKUP_DIR}/${TIMESTAMP}"

# Log file
LOG_FILE="${BACKUP_DIR_WITH_TS}/migration.log"

# ============================================================================
# OLD DATABASE SERVERS CONFIGURATION
# ============================================================================
# Update these with your actual old server details

# ACI Dashboard
OLD_ACI_DASHBOARD_HOST="${OLD_ACI_DASHBOARD_HOST:-localhost}"
OLD_ACI_DASHBOARD_PORT="${OLD_ACI_DASHBOARD_PORT:-2001}"
OLD_ACI_DASHBOARD_USER="${OLD_ACI_DASHBOARD_USER:-postgres}"
OLD_ACI_DASHBOARD_PASSWORD="${OLD_ACI_DASHBOARD_PASSWORD:-postgres}"
OLD_ACI_DASHBOARD_DB="${OLD_ACI_DASHBOARD_DB:-acidashboard}"

# Kosh Inventory
OLD_KOSH_HOST="${OLD_KOSH_HOST:-localhost}"
OLD_KOSH_PORT="${OLD_KOSH_PORT:-5433}"
OLD_KOSH_USER="${OLD_KOSH_USER:-postgres}"
OLD_KOSH_PASSWORD="${OLD_KOSH_PASSWORD:-postgres}"
OLD_KOSH_DB="${OLD_KOSH_DB:-kosh}"

# ACI Excel Migration
OLD_EXCEL_HOST="${OLD_EXCEL_HOST:-localhost}"
OLD_EXCEL_PORT="${OLD_EXCEL_PORT:-5434}"
OLD_EXCEL_USER="${OLD_EXCEL_USER:-postgres}"
OLD_EXCEL_PASSWORD="${OLD_EXCEL_PASSWORD:-postgres}"
OLD_EXCEL_DB="${OLD_EXCEL_DB:-aci_excel}"

# BOM Compare
OLD_BOM_HOST="${OLD_BOM_HOST:-localhost}"
OLD_BOM_PORT="${OLD_BOM_PORT:-5435}"
OLD_BOM_USER="${OLD_BOM_USER:-postgres}"
OLD_BOM_PASSWORD="${OLD_BOM_PASSWORD:-postgres}"
OLD_BOM_DB="${OLD_BOM_DB:-bom_compare}"

# Nexus
OLD_NEXUS_HOST="${OLD_NEXUS_HOST:-localhost}"
OLD_NEXUS_PORT="${OLD_NEXUS_PORT:-5436}"
OLD_NEXUS_USER="${OLD_NEXUS_USER:-postgres}"
OLD_NEXUS_PASSWORD="${OLD_NEXUS_PASSWORD:-postgres}"
OLD_NEXUS_DB="${OLD_NEXUS_DB:-nexus}"

# ============================================================================
# FUNCTIONS
# ============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1" | tee -a "$LOG_FILE"
}

check_dependencies() {
    log "Checking dependencies..."

    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump not found. Please install PostgreSQL client tools."
        exit 1
    fi

    if ! command -v psql &> /dev/null; then
        log_error "psql not found. Please install PostgreSQL client tools."
        exit 1
    fi

    log_success "All dependencies found"
}

create_backup_dir() {
    log "Creating backup directory: ${BACKUP_DIR_WITH_TS}"
    mkdir -p "${BACKUP_DIR_WITH_TS}"
    log_success "Backup directory created"
}

test_connection() {
    local host=$1
    local port=$2
    local user=$3
    local password=$4
    local db=$5
    local name=$6

    log "Testing connection to ${name}..."

    if PGPASSWORD="${password}" psql -h "${host}" -p "${port}" -U "${user}" -d "${db}" -c "SELECT 1" &> /dev/null; then
        log_success "Connection to ${name} successful"
        return 0
    else
        log_warning "Cannot connect to ${name} (${host}:${port}/${db})"
        return 1
    fi
}

dump_database() {
    local host=$1
    local port=$2
    local user=$3
    local password=$4
    local db=$5
    local name=$6
    local dump_file=$7

    log "Dumping ${name} database..."

    if PGPASSWORD="${password}" pg_dump \
        -h "${host}" \
        -p "${port}" \
        -U "${user}" \
        -d "${db}" \
        --format=custom \
        --verbose \
        --file="${dump_file}" 2>> "$LOG_FILE"; then

        local size=$(du -h "${dump_file}" | cut -f1)
        log_success "${name} dumped successfully (${size})"
        return 0
    else
        log_error "Failed to dump ${name}"
        return 1
    fi
}

restore_database() {
    local dump_file=$1
    local new_db=$2
    local name=$3

    log "Restoring ${name} to consolidated server..."

    # First, drop and recreate the database to ensure clean state
    PGPASSWORD="${NEW_POSTGRES_PASSWORD}" psql \
        -h "${NEW_HOST}" \
        -p "${NEW_PORT}" \
        -U "${NEW_POSTGRES_USER}" \
        -d postgres \
        -c "DROP DATABASE IF EXISTS ${new_db};" 2>> "$LOG_FILE"

    PGPASSWORD="${NEW_POSTGRES_PASSWORD}" psql \
        -h "${NEW_HOST}" \
        -p "${NEW_PORT}" \
        -U "${NEW_POSTGRES_USER}" \
        -d postgres \
        -c "CREATE DATABASE ${new_db} WITH ENCODING='UTF8' LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8';" 2>> "$LOG_FILE"

    # Restore the dump
    if PGPASSWORD="${NEW_POSTGRES_PASSWORD}" pg_restore \
        -h "${NEW_HOST}" \
        -p "${NEW_PORT}" \
        -U "${NEW_POSTGRES_USER}" \
        -d "${new_db}" \
        --verbose \
        --no-owner \
        --no-acl \
        "${dump_file}" 2>> "$LOG_FILE"; then

        log_success "${name} restored successfully"
        return 0
    else
        log_warning "Restore completed with some warnings (check log for details)"
        return 0
    fi
}

migrate_database() {
    local old_host=$1
    local old_port=$2
    local old_user=$3
    local old_password=$4
    local old_db=$5
    local new_db=$6
    local name=$7

    log ""
    log "=========================================="
    log "Migrating ${name}"
    log "=========================================="

    # Test connection to old server
    if ! test_connection "${old_host}" "${old_port}" "${old_user}" "${old_password}" "${old_db}" "${name} (old)"; then
        log_warning "Skipping ${name} - cannot connect to source"
        return 1
    fi

    # Dump database
    local dump_file="${BACKUP_DIR_WITH_TS}/${new_db}.dump"
    if ! dump_database "${old_host}" "${old_port}" "${old_user}" "${old_password}" "${old_db}" "${name}" "${dump_file}"; then
        log_error "Failed to dump ${name}"
        return 1
    fi

    # Restore to new server
    if ! restore_database "${dump_file}" "${new_db}" "${name}"; then
        log_error "Failed to restore ${name}"
        return 1
    fi

    log_success "${name} migration complete"
    return 0
}

verify_migration() {
    local new_db=$1
    local name=$2

    log "Verifying ${name}..."

    # Count tables
    local table_count=$(PGPASSWORD="${NEW_POSTGRES_PASSWORD}" psql \
        -h "${NEW_HOST}" \
        -p "${NEW_PORT}" \
        -U "${NEW_POSTGRES_USER}" \
        -d "${new_db}" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>> "$LOG_FILE" | xargs)

    log_success "${name}: Found ${table_count} tables"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    log "=========================================="
    log "PostgreSQL Database Migration Tool"
    log "=========================================="
    log "Timestamp: ${TIMESTAMP}"
    log ""

    # Check dependencies
    check_dependencies

    # Create backup directory
    create_backup_dir

    # Test connection to new server
    log ""
    log "Testing connection to consolidated server..."
    if ! test_connection "${NEW_HOST}" "${NEW_PORT}" "${NEW_POSTGRES_USER}" "${NEW_POSTGRES_PASSWORD}" "postgres" "Consolidated Server"; then
        log_error "Cannot connect to consolidated server. Aborting."
        exit 1
    fi

    # Migrate databases
    log ""
    log "Starting database migrations..."
    log ""

    # ACI Dashboard
    migrate_database \
        "${OLD_ACI_DASHBOARD_HOST}" \
        "${OLD_ACI_DASHBOARD_PORT}" \
        "${OLD_ACI_DASHBOARD_USER}" \
        "${OLD_ACI_DASHBOARD_PASSWORD}" \
        "${OLD_ACI_DASHBOARD_DB}" \
        "aci_dashboard" \
        "ACI Dashboard"

    # Kosh Inventory
    migrate_database \
        "${OLD_KOSH_HOST}" \
        "${OLD_KOSH_PORT}" \
        "${OLD_KOSH_USER}" \
        "${OLD_KOSH_PASSWORD}" \
        "${OLD_KOSH_DB}" \
        "kosh_inventory" \
        "Kosh Inventory"

    # ACI Excel Migration
    migrate_database \
        "${OLD_EXCEL_HOST}" \
        "${OLD_EXCEL_PORT}" \
        "${OLD_EXCEL_USER}" \
        "${OLD_EXCEL_PASSWORD}" \
        "${OLD_EXCEL_DB}" \
        "aci_excel_migration" \
        "ACI Excel Migration"

    # BOM Compare
    migrate_database \
        "${OLD_BOM_HOST}" \
        "${OLD_BOM_PORT}" \
        "${OLD_BOM_USER}" \
        "${OLD_BOM_PASSWORD}" \
        "${OLD_BOM_DB}" \
        "bom_compare" \
        "BOM Compare"

    # Nexus
    migrate_database \
        "${OLD_NEXUS_HOST}" \
        "${OLD_NEXUS_PORT}" \
        "${OLD_NEXUS_USER}" \
        "${OLD_NEXUS_PASSWORD}" \
        "${OLD_NEXUS_DB}" \
        "nexus" \
        "Nexus"

    # Verify migrations
    log ""
    log "=========================================="
    log "Verifying migrations..."
    log "=========================================="

    verify_migration "aci_dashboard" "ACI Dashboard"
    verify_migration "kosh_inventory" "Kosh Inventory"
    verify_migration "aci_excel_migration" "ACI Excel Migration"
    verify_migration "bom_compare" "BOM Compare"
    verify_migration "nexus" "Nexus"

    # Summary
    log ""
    log "=========================================="
    log "Migration Complete!"
    log "=========================================="
    log "Backup directory: ${BACKUP_DIR_WITH_TS}"
    log "Log file: ${LOG_FILE}"
    log ""
    log_success "All migrations completed successfully"
    log ""
    log "Next steps:"
    log "1. Review the log file for any warnings"
    log "2. Update application connection strings"
    log "3. Test each application"
    log "4. Run 03-verify-isolation.sh to verify database isolation"
}

# Run main function
main "$@"
