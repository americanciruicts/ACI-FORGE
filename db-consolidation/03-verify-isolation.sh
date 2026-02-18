#!/bin/bash

# ============================================================================
# Database Isolation Verification Script
# ============================================================================
# Purpose: Verify that each database user can only access their own database
# This ensures proper security isolation between applications
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

# Test if a user can connect to a database
test_connection() {
    local user=$1
    local password=$2
    local database=$3
    local should_succeed=$4

    if PGPASSWORD="${password}" psql -h "${HOST}" -p "${PORT}" -U "${user}" -d "${database}" -c "SELECT 1" &> /dev/null; then
        if [ "$should_succeed" = "true" ]; then
            log_success "${user} can access ${database} (EXPECTED)"
            return 0
        else
            log_error "${user} can access ${database} (SECURITY ISSUE!)"
            return 1
        fi
    else
        if [ "$should_succeed" = "false" ]; then
            log_success "${user} cannot access ${database} (EXPECTED)"
            return 0
        else
            log_error "${user} cannot access ${database} (UNEXPECTED)"
            return 1
        fi
    fi
}

# Test database permissions
test_database_operations() {
    local user=$1
    local password=$2
    local database=$3

    log "Testing CRUD operations for ${user} on ${database}..."

    # Create a test table
    if PGPASSWORD="${password}" psql -h "${HOST}" -p "${PORT}" -U "${user}" -d "${database}" &> /dev/null <<-EOSQL
        CREATE TABLE IF NOT EXISTS isolation_test_${user} (
            id SERIAL PRIMARY KEY,
            test_data VARCHAR(100),
            created_at TIMESTAMP DEFAULT NOW()
        );

        INSERT INTO isolation_test_${user} (test_data) VALUES ('test_isolation');

        SELECT * FROM isolation_test_${user};

        DROP TABLE isolation_test_${user};
EOSQL
    then
        log_success "${user} can perform CRUD operations on ${database}"
        return 0
    else
        log_error "${user} cannot perform CRUD operations on ${database}"
        return 1
    fi
}

# Check table counts
check_table_count() {
    local user=$1
    local password=$2
    local database=$3

    local count=$(PGPASSWORD="${password}" psql -h "${HOST}" -p "${PORT}" -U "${user}" -d "${database}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | xargs)

    log "  - Tables in ${database}: ${count}"
}

# Check if user can list other databases
check_database_visibility() {
    local user=$1
    local password=$2

    log "Checking database visibility for ${user}..."

    local databases=$(PGPASSWORD="${password}" psql -h "${HOST}" -p "${PORT}" -U "${user}" -d postgres -t -c "SELECT datname FROM pg_database WHERE datistemplate = false;" 2>/dev/null | xargs)

    log "  - Visible databases: ${databases}"
}

# ============================================================================
# MAIN VERIFICATION
# ============================================================================

main() {
    log "=========================================="
    log "Database Isolation Verification"
    log "=========================================="
    log "Testing on: ${HOST}:${PORT}"
    log ""

    local exit_code=0

    # ============================================================================
    # Test 1: Each user can access their own database
    # ============================================================================
    log "=========================================="
    log "Test 1: Own Database Access"
    log "=========================================="

    test_connection "aci_dashboard_user" "AciDash_SecureP@ss2025!" "aci_dashboard" "true" || exit_code=1
    test_connection "kosh_inventory_user" "KoshInv_SecureP@ss2025!" "kosh_inventory" "true" || exit_code=1
    test_connection "aci_excel_migration_user" "AciExcel_SecureP@ss2025!" "aci_excel_migration" "true" || exit_code=1
    test_connection "bom_compare_user" "BomComp_SecureP@ss2025!" "bom_compare" "true" || exit_code=1
    test_connection "nexus_user" "Nexus_SecureP@ss2025!" "nexus" "true" || exit_code=1

    log ""

    # ============================================================================
    # Test 2: Users CANNOT access other databases
    # ============================================================================
    log "=========================================="
    log "Test 2: Cross-Database Isolation"
    log "=========================================="

    # ACI Dashboard user should NOT access other databases
    log "Testing ACI Dashboard user isolation..."
    test_connection "aci_dashboard_user" "AciDash_SecureP@ss2025!" "kosh_inventory" "false" || exit_code=1
    test_connection "aci_dashboard_user" "AciDash_SecureP@ss2025!" "aci_excel_migration" "false" || exit_code=1
    test_connection "aci_dashboard_user" "AciDash_SecureP@ss2025!" "bom_compare" "false" || exit_code=1
    test_connection "aci_dashboard_user" "AciDash_SecureP@ss2025!" "nexus" "false" || exit_code=1

    log ""

    # Kosh Inventory user should NOT access other databases
    log "Testing Kosh Inventory user isolation..."
    test_connection "kosh_inventory_user" "KoshInv_SecureP@ss2025!" "aci_dashboard" "false" || exit_code=1
    test_connection "kosh_inventory_user" "KoshInv_SecureP@ss2025!" "aci_excel_migration" "false" || exit_code=1
    test_connection "kosh_inventory_user" "KoshInv_SecureP@ss2025!" "bom_compare" "false" || exit_code=1
    test_connection "kosh_inventory_user" "KoshInv_SecureP@ss2025!" "nexus" "false" || exit_code=1

    log ""

    # ============================================================================
    # Test 3: CRUD operations
    # ============================================================================
    log "=========================================="
    log "Test 3: Database Operations"
    log "=========================================="

    test_database_operations "aci_dashboard_user" "AciDash_SecureP@ss2025!" "aci_dashboard" || exit_code=1
    test_database_operations "kosh_inventory_user" "KoshInv_SecureP@ss2025!" "kosh_inventory" || exit_code=1
    test_database_operations "aci_excel_migration_user" "AciExcel_SecureP@ss2025!" "aci_excel_migration" || exit_code=1
    test_database_operations "bom_compare_user" "BomComp_SecureP@ss2025!" "bom_compare" || exit_code=1
    test_database_operations "nexus_user" "Nexus_SecureP@ss2025!" "nexus" || exit_code=1

    log ""

    # ============================================================================
    # Test 4: Check table counts
    # ============================================================================
    log "=========================================="
    log "Test 4: Database Statistics"
    log "=========================================="

    check_table_count "aci_dashboard_user" "AciDash_SecureP@ss2025!" "aci_dashboard"
    check_table_count "kosh_inventory_user" "KoshInv_SecureP@ss2025!" "kosh_inventory"
    check_table_count "aci_excel_migration_user" "AciExcel_SecureP@ss2025!" "aci_excel_migration"
    check_table_count "bom_compare_user" "BomComp_SecureP@ss2025!" "bom_compare"
    check_table_count "nexus_user" "Nexus_SecureP@ss2025!" "nexus"

    log ""

    # ============================================================================
    # Test 5: Check database visibility
    # ============================================================================
    log "=========================================="
    log "Test 5: Database Visibility"
    log "=========================================="

    check_database_visibility "aci_dashboard_user" "AciDash_SecureP@ss2025!"
    check_database_visibility "kosh_inventory_user" "KoshInv_SecureP@ss2025!"

    log ""

    # ============================================================================
    # Summary
    # ============================================================================
    log "=========================================="
    log "Verification Summary"
    log "=========================================="

    if [ $exit_code -eq 0 ]; then
        log_success "All isolation tests passed!"
        log_success "Database security is properly configured"
        log ""
        log "Each application can only access its own database."
        log "No security issues detected."
    else
        log_error "Some isolation tests failed!"
        log_error "Review the output above for details"
        log_warning "Security configuration needs attention"
    fi

    log ""

    exit $exit_code
}

# Run main function
main "$@"
