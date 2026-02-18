#!/bin/bash

# ============================================================================
# Automated Complete Setup Script
# ============================================================================
# Purpose: One-command setup for consolidated PostgreSQL server
# This script orchestrates all setup steps automatically
# ============================================================================

set -e
set -u

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-docker}"  # docker or native

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

log_section() {
    echo ""
    echo -e "${MAGENTA}=========================================="
    echo -e "$1"
    echo -e "==========================================${NC}"
    echo ""
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."

    if [ "$MODE" = "docker" ]; then
        if ! command -v docker &> /dev/null; then
            log_error "Docker not found. Please install Docker."
            exit 1
        fi

        if ! command -v docker-compose &> /dev/null; then
            log_error "Docker Compose not found. Please install Docker Compose."
            exit 1
        fi
    else
        if ! command -v psql &> /dev/null; then
            log_error "PostgreSQL client not found. Please install PostgreSQL."
            exit 1
        fi
    fi

    log_success "All dependencies found"
}

# Setup Docker environment
setup_docker() {
    log_section "Setting up Docker environment"

    cd "${SCRIPT_DIR}"

    # Create required directories
    log "Creating required directories..."
    mkdir -p volumes/postgres-data
    mkdir -p docker-init-scripts
    chmod +x docker-init-scripts/*.sh 2>/dev/null || true

    # Stop any existing containers
    log "Stopping existing containers..."
    docker-compose -f docker-compose.consolidated.yml down 2>/dev/null || true

    # Start PostgreSQL container
    log "Starting PostgreSQL container..."
    docker-compose -f docker-compose.consolidated.yml up -d postgres-consolidated

    # Wait for PostgreSQL to be ready
    log "Waiting for PostgreSQL to be ready..."
    local attempts=0
    local max_attempts=30

    while ! docker exec postgres-consolidated pg_isready -U postgres &> /dev/null; do
        attempts=$((attempts + 1))
        if [ $attempts -ge $max_attempts ]; then
            log_error "PostgreSQL failed to start within timeout"
            docker-compose -f docker-compose.consolidated.yml logs postgres-consolidated
            exit 1
        fi
        echo -n "."
        sleep 2
    done

    echo ""
    log_success "PostgreSQL is ready!"

    # Wait a bit more for initialization scripts to complete
    log "Waiting for initialization to complete..."
    sleep 5

    log_success "Docker environment ready"
}

# Setup native PostgreSQL
setup_native() {
    log_section "Setting up native PostgreSQL"

    log "Running setup SQL script..."

    # Check if PostgreSQL is running
    if ! pg_isready -h localhost -p 5432 &> /dev/null; then
        log_error "PostgreSQL is not running on localhost:5432"
        log "Please start PostgreSQL service first"
        exit 1
    fi

    # Run setup script
    PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -f "${SCRIPT_DIR}/01-setup-databases.sql"

    log_success "Native PostgreSQL setup complete"
}

# Verify setup
verify_setup() {
    log_section "Verifying setup"

    if [ "$MODE" = "docker" ]; then
        export POSTGRES_HOST=localhost
        export POSTGRES_PORT=5432
    fi

    # Make verification script executable
    chmod +x "${SCRIPT_DIR}/03-verify-isolation.sh"

    # Run verification
    "${SCRIPT_DIR}/03-verify-isolation.sh"
}

# Display connection information
display_connection_info() {
    log_section "Connection Information"

    echo -e "${CYAN}=========================================="
    echo -e "PostgreSQL Consolidated Server"
    echo -e "==========================================${NC}"
    echo ""

    if [ "$MODE" = "docker" ]; then
        echo "Server: localhost:5432"
        echo "Container: postgres-consolidated"
        echo ""
        echo "To access PostgreSQL inside container:"
        echo "  docker exec -it postgres-consolidated psql -U postgres"
        echo ""
        echo "PgAdmin (optional):"
        echo "  URL: http://localhost:5050"
        echo "  Email: admin@aci.local"
        echo "  Password: admin123"
    else
        echo "Server: localhost:5432"
    fi

    echo ""
    echo -e "${CYAN}Databases Created:${NC}"
    echo "  1. aci_dashboard"
    echo "  2. kosh_inventory"
    echo "  3. aci_excel_migration"
    echo "  4. bom_compare"
    echo "  5. nexus"
    echo ""

    echo -e "${CYAN}Users Created:${NC}"
    echo "  - aci_dashboard_user"
    echo "  - kosh_inventory_user"
    echo "  - aci_excel_migration_user"
    echo "  - bom_compare_user"
    echo "  - nexus_user"
    echo ""

    echo -e "${CYAN}Connection Strings:${NC}"
    echo "See: ${SCRIPT_DIR}/connection-strings.env"
    echo ""

    echo -e "${YELLOW}Quick Test Commands:${NC}"
    echo ""
    echo "# ACI Dashboard"
    echo "PGPASSWORD='AciDash_SecureP@ss2025!' psql -h localhost -p 5432 -U aci_dashboard_user -d aci_dashboard"
    echo ""
    echo "# Kosh Inventory"
    echo "PGPASSWORD='KoshInv_SecureP@ss2025!' psql -h localhost -p 5432 -U kosh_inventory_user -d kosh_inventory"
    echo ""
}

# Create quick reference guide
create_quick_reference() {
    log "Creating quick reference guide..."

    cat > "${SCRIPT_DIR}/QUICK-REFERENCE.md" <<'EOF'
# PostgreSQL Consolidated Server - Quick Reference

## Server Details

- **Host**: localhost
- **Port**: 5432
- **Admin User**: postgres
- **Admin Password**: postgres

## Databases

| Application | Database | User | Password |
|------------|----------|------|----------|
| ACI Dashboard | aci_dashboard | aci_dashboard_user | AciDash_SecureP@ss2025! |
| Kosh Inventory | kosh_inventory | kosh_inventory_user | KoshInv_SecureP@ss2025! |
| ACI Excel Migration | aci_excel_migration | aci_excel_migration_user | AciExcel_SecureP@ss2025! |
| BOM Compare | bom_compare | bom_compare_user | BomComp_SecureP@ss2025! |
| Nexus | nexus | nexus_user | Nexus_SecureP@ss2025! |

## Common Commands

### Connect to Database

```bash
# ACI Dashboard
PGPASSWORD='AciDash_SecureP@ss2025!' psql -h localhost -p 5432 -U aci_dashboard_user -d aci_dashboard

# Kosh Inventory
PGPASSWORD='KoshInv_SecureP@ss2025!' psql -h localhost -p 5432 -U kosh_inventory_user -d kosh_inventory
```

### Docker Commands

```bash
# Start server
docker-compose -f docker-compose.consolidated.yml up -d

# Stop server
docker-compose -f docker-compose.consolidated.yml down

# View logs
docker-compose -f docker-compose.consolidated.yml logs -f postgres-consolidated

# Access PostgreSQL shell
docker exec -it postgres-consolidated psql -U postgres

# Restart server
docker-compose -f docker-compose.consolidated.yml restart postgres-consolidated
```

### Backup Commands

```bash
# Backup all databases
./04-backup-all.sh

# Backup single database
PGPASSWORD='postgres' pg_dump -h localhost -p 5432 -U postgres -d aci_dashboard -Fc -f aci_dashboard.dump
```

### Verification Commands

```bash
# Verify isolation
./03-verify-isolation.sh

# List all databases
docker exec -it postgres-consolidated psql -U postgres -c "\l"

# List all users
docker exec -it postgres-consolidated psql -U postgres -c "\du"
```

## Migration Steps

1. **Backup old databases**:
   ```bash
   ./02-migrate-data.sh
   ```

2. **Update application .env files** with new connection strings from `connection-strings.env`

3. **Test connectivity** for each application

4. **Verify isolation**:
   ```bash
   ./03-verify-isolation.sh
   ```

5. **Monitor logs** for any issues

## Troubleshooting

### Cannot connect to database

```bash
# Check if container is running
docker ps | grep postgres-consolidated

# Check PostgreSQL logs
docker logs postgres-consolidated

# Verify port is open
netstat -tulpn | grep 5432
```

### Permission denied errors

```bash
# Re-run privileges script
docker exec -it postgres-consolidated psql -U postgres < 01-setup-databases.sql
```

### Container won't start

```bash
# Check logs
docker-compose -f docker-compose.consolidated.yml logs

# Remove and recreate
docker-compose -f docker-compose.consolidated.yml down -v
docker-compose -f docker-compose.consolidated.yml up -d
```

## Security Checklist

- [ ] Changed default passwords
- [ ] Updated connection strings in all applications
- [ ] Enabled SSL/TLS for connections
- [ ] Configured firewall rules
- [ ] Set up automated backups
- [ ] Configured log monitoring
- [ ] Tested disaster recovery
- [ ] Documented access procedures

## Files Reference

- `01-setup-databases.sql` - Database and user creation
- `02-migrate-data.sh` - Data migration script
- `03-verify-isolation.sh` - Isolation verification
- `04-backup-all.sh` - Backup script
- `05-setup-automated.sh` - Automated setup
- `connection-strings.env` - Connection string examples
- `docker-compose.consolidated.yml` - Docker Compose configuration

## Support

For issues or questions:
1. Check the logs first
2. Review this quick reference
3. Check the detailed scripts
4. Contact your database administrator
EOF

    log_success "Quick reference guide created: QUICK-REFERENCE.md"
}

# Display next steps
display_next_steps() {
    log_section "Next Steps"

    echo -e "${GREEN}Setup completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo ""
    echo "1. Review connection strings:"
    echo "   cat ${SCRIPT_DIR}/connection-strings.env"
    echo ""
    echo "2. Update your application .env files with new connection strings"
    echo ""
    echo "3. Migrate data from old servers (if applicable):"
    echo "   ${SCRIPT_DIR}/02-migrate-data.sh"
    echo ""
    echo "4. Test each application's database connectivity"
    echo ""
    echo "5. Set up automated backups:"
    echo "   Add ${SCRIPT_DIR}/04-backup-all.sh to cron"
    echo ""
    echo "6. Review quick reference:"
    echo "   cat ${SCRIPT_DIR}/QUICK-REFERENCE.md"
    echo ""
    echo -e "${CYAN}Important:${NC}"
    echo "  - Change default passwords in production!"
    echo "  - Enable SSL/TLS for production databases"
    echo "  - Configure firewall rules"
    echo "  - Set up monitoring and alerting"
    echo ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    clear

    echo -e "${MAGENTA}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║     PostgreSQL Database Consolidation - Automated Setup         ║
║                                                                  ║
║     Consolidating 5 applications into 1 PostgreSQL server       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    log "Mode: ${MODE}"
    log "Script directory: ${SCRIPT_DIR}"
    echo ""

    # Check dependencies
    check_dependencies

    # Setup based on mode
    if [ "$MODE" = "docker" ]; then
        setup_docker
    elif [ "$MODE" = "native" ]; then
        setup_native
    else
        log_error "Invalid mode: ${MODE}"
        log "Usage: $0 [docker|native]"
        exit 1
    fi

    # Verify setup
    verify_setup

    # Create quick reference
    create_quick_reference

    # Display connection information
    display_connection_info

    # Display next steps
    display_next_steps

    log_success "Setup completed successfully!"
}

# Show usage if help requested
if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    echo "Usage: $0 [MODE]"
    echo ""
    echo "Modes:"
    echo "  docker  - Set up using Docker (default)"
    echo "  native  - Set up on existing PostgreSQL installation"
    echo ""
    echo "Examples:"
    echo "  $0              # Use Docker"
    echo "  $0 docker       # Use Docker"
    echo "  $0 native       # Use native PostgreSQL"
    exit 0
fi

# Run main function
main "$@"
