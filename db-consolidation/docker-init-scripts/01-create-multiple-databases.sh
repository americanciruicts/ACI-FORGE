#!/bin/bash

# ============================================================================
# Docker Entrypoint Script - Create Multiple Databases
# ============================================================================
# This script runs automatically when PostgreSQL container starts for the
# first time. It creates all databases and users needed for the consolidated
# server.
# ============================================================================

set -e
set -u

# Function to create a database and user
create_database_and_user() {
    local database=$1
    local user=$2
    local password=$3

    echo "Creating database: $database"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        -- Create database
        CREATE DATABASE $database;

        -- Create user
        CREATE USER $user WITH PASSWORD '$password';

        -- Grant privileges
        GRANT ALL PRIVILEGES ON DATABASE $database TO $user;
EOSQL

    echo "Configuring schema privileges for: $database"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$database" <<-EOSQL
        -- Grant schema privileges
        GRANT ALL PRIVILEGES ON SCHEMA public TO $user;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $user;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $user;
        GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO $user;

        -- Set default privileges for future objects
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $user;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $user;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO $user;

        -- Enable commonly used extensions
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOSQL

    echo "✓ Database $database and user $user created successfully"
}

# ============================================================================
# Main execution
# ============================================================================

echo "=========================================="
echo "Setting up consolidated PostgreSQL server"
echo "=========================================="

# ACI Dashboard
create_database_and_user \
    "aci_dashboard" \
    "aci_dashboard_user" \
    "AciDash_SecureP@ss2025!"

# Kosh Inventory
create_database_and_user \
    "kosh_inventory" \
    "kosh_inventory_user" \
    "KoshInv_SecureP@ss2025!"

# ACI Excel Migration
create_database_and_user \
    "aci_excel_migration" \
    "aci_excel_migration_user" \
    "AciExcel_SecureP@ss2025!"

# BOM Compare
create_database_and_user \
    "bom_compare" \
    "bom_compare_user" \
    "BomComp_SecureP@ss2025!"

# Nexus
create_database_and_user \
    "nexus" \
    "nexus_user" \
    "Nexus_SecureP@ss2025!"

echo ""
echo "=========================================="
echo "✓ All databases and users created!"
echo "=========================================="
echo ""
echo "Databases created:"
echo "  - aci_dashboard"
echo "  - kosh_inventory"
echo "  - aci_excel_migration"
echo "  - bom_compare"
echo "  - nexus"
echo ""
echo "Users created with secure passwords."
echo "See connection-strings.env for connection details."
echo "=========================================="
