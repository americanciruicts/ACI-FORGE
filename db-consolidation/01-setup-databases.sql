-- ============================================================================
-- PostgreSQL Database Consolidation Setup Script
-- ============================================================================
-- Purpose: Create isolated databases and users for all five applications
-- Applications: ACI Dashboard, Kosh Inventory, ACI Excel Migration,
--               BOM Compare, Nexus
-- ============================================================================

-- Ensure we're connected as superuser (postgres)
\c postgres

-- ============================================================================
-- 1. CREATE DATABASES
-- ============================================================================

-- Drop existing databases if they exist (CAUTION: Only for fresh setup)
-- Uncomment the following lines if you want to start fresh
-- DROP DATABASE IF EXISTS aci_dashboard;
-- DROP DATABASE IF EXISTS kosh_inventory;
-- DROP DATABASE IF EXISTS aci_excel_migration;
-- DROP DATABASE IF EXISTS bom_compare;
-- DROP DATABASE IF EXISTS nexus;

-- Create databases with proper encoding and collation
CREATE DATABASE aci_dashboard
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    TEMPLATE = template0;

CREATE DATABASE kosh_inventory
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    TEMPLATE = template0;

CREATE DATABASE aci_excel_migration
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    TEMPLATE = template0;

CREATE DATABASE bom_compare
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    TEMPLATE = template0;

CREATE DATABASE nexus
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    TEMPLATE = template0;

-- ============================================================================
-- 2. CREATE USERS WITH SECURE PASSWORDS
-- ============================================================================
-- NOTE: Change these passwords in production!

-- Drop existing users if they exist
DROP USER IF EXISTS aci_dashboard_user;
DROP USER IF EXISTS kosh_inventory_user;
DROP USER IF EXISTS aci_excel_migration_user;
DROP USER IF EXISTS bom_compare_user;
DROP USER IF EXISTS nexus_user;

-- Create users with secure passwords
CREATE USER aci_dashboard_user WITH
    LOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOREPLICATION
    CONNECTION LIMIT -1
    PASSWORD 'AciDash_SecureP@ss2025!';

CREATE USER kosh_inventory_user WITH
    LOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOREPLICATION
    CONNECTION LIMIT -1
    PASSWORD 'KoshInv_SecureP@ss2025!';

CREATE USER aci_excel_migration_user WITH
    LOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOREPLICATION
    CONNECTION LIMIT -1
    PASSWORD 'AciExcel_SecureP@ss2025!';

CREATE USER bom_compare_user WITH
    LOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOREPLICATION
    CONNECTION LIMIT -1
    PASSWORD 'BomComp_SecureP@ss2025!';

CREATE USER nexus_user WITH
    LOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOREPLICATION
    CONNECTION LIMIT -1
    PASSWORD 'Nexus_SecureP@ss2025!';

-- ============================================================================
-- 3. GRANT DATABASE PRIVILEGES
-- ============================================================================

-- Grant connection and usage privileges
GRANT CONNECT ON DATABASE aci_dashboard TO aci_dashboard_user;
GRANT CONNECT ON DATABASE kosh_inventory TO kosh_inventory_user;
GRANT CONNECT ON DATABASE aci_excel_migration TO aci_excel_migration_user;
GRANT CONNECT ON DATABASE bom_compare TO bom_compare_user;
GRANT CONNECT ON DATABASE nexus TO nexus_user;

-- ============================================================================
-- 4. CONFIGURE SCHEMA PRIVILEGES (Per Database)
-- ============================================================================

-- ACI Dashboard
\c aci_dashboard
GRANT ALL PRIVILEGES ON SCHEMA public TO aci_dashboard_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aci_dashboard_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aci_dashboard_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO aci_dashboard_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aci_dashboard_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aci_dashboard_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO aci_dashboard_user;

-- Kosh Inventory
\c kosh_inventory
GRANT ALL PRIVILEGES ON SCHEMA public TO kosh_inventory_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kosh_inventory_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kosh_inventory_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO kosh_inventory_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO kosh_inventory_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO kosh_inventory_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO kosh_inventory_user;

-- ACI Excel Migration
\c aci_excel_migration
GRANT ALL PRIVILEGES ON SCHEMA public TO aci_excel_migration_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aci_excel_migration_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aci_excel_migration_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO aci_excel_migration_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aci_excel_migration_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aci_excel_migration_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO aci_excel_migration_user;

-- BOM Compare
\c bom_compare
GRANT ALL PRIVILEGES ON SCHEMA public TO bom_compare_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bom_compare_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bom_compare_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO bom_compare_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bom_compare_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO bom_compare_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO bom_compare_user;

-- Nexus
\c nexus
GRANT ALL PRIVILEGES ON SCHEMA public TO nexus_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nexus_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nexus_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO nexus_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nexus_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO nexus_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO nexus_user;

-- ============================================================================
-- 5. ENABLE EXTENSIONS (if needed)
-- ============================================================================

-- Enable UUID extension for all databases
\c aci_dashboard
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c kosh_inventory
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c aci_excel_migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c bom_compare
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c nexus
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 6. VERIFY SETUP
-- ============================================================================

\c postgres

-- List all databases
\l

-- List all users
\du

-- Show connection info
\conninfo

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run 02-migrate-data.sh to migrate data from old servers
-- 2. Update application connection strings
-- 3. Test connections with each user
-- ============================================================================
