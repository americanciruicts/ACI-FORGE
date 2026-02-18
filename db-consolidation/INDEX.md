# PostgreSQL Consolidation - Complete Package Index

## Overview

This package provides everything you need to consolidate 5 applications into a single PostgreSQL server with complete isolation, security, and ease of management.

## 🚀 Start Here

**New to this package?** Start with:
1. [GETTING-STARTED.md](GETTING-STARTED.md) - Quick start guide (5 minutes)
2. [README.md](README.md) - Complete documentation
3. [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) - Production deployment guide

## 📁 File Structure

```
db-consolidation/
├── Documentation
│   ├── GETTING-STARTED.md          ⭐ START HERE - Quick setup guide
│   ├── README.md                   📖 Complete documentation
│   ├── DEPLOYMENT-CHECKLIST.md     ✅ Production deployment checklist
│   ├── QUICK-REFERENCE.md          📝 Quick command reference (auto-generated)
│   └── INDEX.md                    📑 This file
│
├── Setup Scripts
│   ├── 01-setup-databases.sql      🗄️  SQL script to create databases and users
│   ├── 05-setup-automated.sh       🤖 One-command automated setup (RECOMMENDED)
│   └── docker-init-scripts/
│       └── 01-create-multiple-databases.sh  🐳 Docker initialization script
│
├── Migration & Operations
│   ├── 02-migrate-data.sh          📦 Migrate data from old servers
│   ├── 03-verify-isolation.sh      🔒 Verify database isolation and security
│   └── 04-backup-all.sh            💾 Backup all databases
│
├── Configuration
│   ├── docker-compose.consolidated.yml  🐳 Docker Compose configuration
│   ├── postgresql.conf             ⚙️  PostgreSQL performance tuning
│   ├── pgadmin-servers.json        🌐 PgAdmin pre-configuration
│   └── connection-strings.env      🔗 Connection string examples
│
└── Generated (after setup)
    ├── QUICK-REFERENCE.md          📝 Quick reference guide
    ├── volumes/                    💿 PostgreSQL data volume
    └── database-backups/           💾 Backup storage
```

## 📚 Documentation Guide

### For First-Time Setup
1. **[GETTING-STARTED.md](GETTING-STARTED.md)** - Your first stop
   - 5-minute quick setup
   - Step-by-step instructions
   - Common commands
   - Troubleshooting

### For Complete Understanding
2. **[README.md](README.md)** - Deep dive documentation
   - Architecture overview
   - All features explained
   - Performance tuning
   - Security hardening
   - Monitoring and maintenance
   - Troubleshooting guide

### For Production Deployment
3. **[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)** - Production-ready checklist
   - Pre-deployment planning
   - Step-by-step deployment
   - Post-deployment verification
   - Rollback procedures
   - Success criteria

### For Daily Operations
4. **QUICK-REFERENCE.md** - Command reference (auto-generated after setup)
   - Common commands
   - Connection strings
   - Docker commands
   - Backup/restore
   - Troubleshooting

## 🛠️ Script Guide

### Setup Scripts (Run Once)

#### `05-setup-automated.sh` ⭐ RECOMMENDED
**Purpose**: One-command automated setup

**Usage**:
```bash
./05-setup-automated.sh docker   # For Docker deployment
./05-setup-automated.sh native   # For native PostgreSQL
```

**What it does**:
- Starts PostgreSQL (Docker or native)
- Creates all 5 databases
- Creates all 5 users with secure passwords
- Sets up proper isolation
- Verifies everything works
- Generates documentation

**When to use**: First-time setup or fresh installation

---

#### `01-setup-databases.sql`
**Purpose**: SQL script for manual database setup

**Usage**:
```bash
psql -U postgres -f 01-setup-databases.sql
```

**What it does**:
- Creates 5 databases
- Creates 5 users with unique passwords
- Grants proper privileges
- Enables PostgreSQL extensions

**When to use**:
- Manual setup
- Troubleshooting
- Re-running privileges

---

### Migration Scripts

#### `02-migrate-data.sh`
**Purpose**: Migrate data from old PostgreSQL servers

**Usage**:
```bash
# 1. Edit script to configure old servers
nano 02-migrate-data.sh

# 2. Run migration
./02-migrate-data.sh
```

**What it does**:
- Connects to old database servers
- Dumps each database
- Restores to consolidated server
- Verifies migration success
- Creates backup copies

**When to use**:
- When migrating from existing servers
- When consolidating scattered databases

**Configuration needed**: Yes - old server credentials

---

### Verification Scripts

#### `03-verify-isolation.sh`
**Purpose**: Verify security isolation between databases

**Usage**:
```bash
./03-verify-isolation.sh
```

**What it does**:
- Tests each user can access their own database
- Verifies users CANNOT access other databases
- Tests CRUD operations
- Checks table counts
- Reports security status

**When to use**:
- After initial setup
- After making permission changes
- During security audits
- Troubleshooting access issues

**Configuration needed**: No (uses connection-strings.env)

---

### Backup Scripts

#### `04-backup-all.sh`
**Purpose**: Create backups of all databases

**Usage**:
```bash
# Manual backup
./04-backup-all.sh

# Scheduled backup (cron)
crontab -e
# Add: 0 2 * * * /path/to/04-backup-all.sh
```

**What it does**:
- Backs up all 5 databases individually
- Creates full cluster backup
- Compresses backups
- Generates restore instructions
- Cleans old backups based on retention policy

**When to use**:
- Before major changes
- Scheduled daily/weekly backups
- Before migrations
- Disaster recovery preparation

**Configuration**:
- `BACKUP_RETENTION_DAYS` - Default: 30 days
- `BACKUP_ROOT` - Default: ./database-backups

---

## 📄 Configuration Files

### `docker-compose.consolidated.yml`
**Purpose**: Docker Compose configuration for PostgreSQL + PgAdmin

**Services**:
- `postgres-consolidated` - Main PostgreSQL server (port 5432)
- `pgadmin` - Web UI for database management (port 5050)
- `redis-shared` - Optional shared cache (port 6379)

**Volumes**:
- `postgres_consolidated_data` - Persistent database storage
- `pgadmin_data` - PgAdmin configuration
- `redis_shared_data` - Redis data

**Networks**:
- `aci-network` - Isolated Docker network (172.25.0.0/16)

**Usage**:
```bash
# Start
docker-compose -f docker-compose.consolidated.yml up -d

# Stop
docker-compose -f docker-compose.consolidated.yml down

# View logs
docker-compose -f docker-compose.consolidated.yml logs -f
```

---

### `postgresql.conf`
**Purpose**: PostgreSQL performance configuration

**Key settings**:
- `max_connections = 200` - Maximum concurrent connections
- `shared_buffers = 1GB` - Memory for caching (adjust for your RAM)
- `effective_cache_size = 3GB` - Available cache (adjust for your RAM)
- `work_mem = 8MB` - Per-operation memory
- Logging configuration
- Autovacuum settings
- Performance tuning

**Customization**: Adjust based on your server's RAM and workload

---

### `connection-strings.env`
**Purpose**: Connection string examples for all applications

**Contains**:
- Standard PostgreSQL connection strings
- SQLAlchemy format (Python)
- TypeORM format (Node.js)
- Prisma format (Node.js)
- psql command-line examples
- Docker internal networking examples
- URL encoding guide

**Usage**: Copy relevant strings to your application's `.env` files

---

### `pgadmin-servers.json`
**Purpose**: Pre-configured PgAdmin server connections

**What it does**: Automatically configures PgAdmin with connections to:
- Consolidated server (admin access)
- All 5 application databases

**Access**: http://localhost:5050
- Email: admin@aci.local
- Password: admin123

---

## 🎯 Quick Start Commands

### Initial Setup
```bash
cd /home/tony/ACI-DASHBOARD/db-consolidation
chmod +x *.sh
./05-setup-automated.sh docker
```

### Daily Operations
```bash
# Start PostgreSQL
docker-compose -f docker-compose.consolidated.yml up -d

# Stop PostgreSQL
docker-compose -f docker-compose.consolidated.yml down

# View logs
docker logs -f postgres-consolidated

# Connect to database
docker exec -it postgres-consolidated psql -U postgres

# Backup all databases
./04-backup-all.sh

# Verify security
./03-verify-isolation.sh
```

### Access PgAdmin
```
URL: http://localhost:5050
Email: admin@aci.local
Password: admin123
```

## 🗂️ Database Details

| Application | Database | User | Password (default) |
|------------|----------|------|--------------------|
| ACI Dashboard | `aci_dashboard` | `aci_dashboard_user` | `AciDash_SecureP@ss2025!` |
| Kosh Inventory | `kosh_inventory` | `kosh_inventory_user` | `KoshInv_SecureP@ss2025!` |
| ACI Excel Migration | `aci_excel_migration` | `aci_excel_migration_user` | `AciExcel_SecureP@ss2025!` |
| BOM Compare | `bom_compare` | `bom_compare_user` | `BomComp_SecureP@ss2025!` |
| Nexus | `nexus` | `nexus_user` | `Nexus_SecureP@ss2025!` |

⚠️ **IMPORTANT**: Change all passwords before production deployment!

## 🔗 Connection Examples

### ACI Dashboard (Python/FastAPI)
```python
DATABASE_URL = "postgresql://aci_dashboard_user:AciDash_SecureP@ss2025!@localhost:5432/aci_dashboard"
```

### Kosh Inventory
```
postgresql://kosh_inventory_user:KoshInv_SecureP@ss2025!@localhost:5432/kosh_inventory
```

### Command Line
```bash
PGPASSWORD='AciDash_SecureP@ss2025!' psql -h localhost -p 5432 -U aci_dashboard_user -d aci_dashboard
```

## 📋 Typical Workflow

### 1. Initial Setup (First Time)
```bash
# Navigate to directory
cd /home/tony/ACI-DASHBOARD/db-consolidation

# Make scripts executable
chmod +x *.sh

# Run automated setup
./05-setup-automated.sh docker

# Verify isolation
./03-verify-isolation.sh
```

### 2. Migrate Data (If Applicable)
```bash
# Configure old servers
nano 02-migrate-data.sh

# Run migration
./02-migrate-data.sh

# Verify data
PGPASSWORD='AciDash_SecureP@ss2025!' psql -h localhost -p 5432 -U aci_dashboard_user -d aci_dashboard -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
```

### 3. Update Applications
```bash
# Update each application's .env file
# Example for ACI Dashboard:
nano /home/tony/ACI-DASHBOARD/backend/.env
# Change DATABASE_URL to:
# DATABASE_URL=postgresql://aci_dashboard_user:AciDash_SecureP@ss2025!@localhost:5432/aci_dashboard

# Restart application
docker-compose restart backend
```

### 4. Set Up Backups
```bash
# Test backup
./04-backup-all.sh

# Schedule automated backups
crontab -e
# Add: 0 2 * * * /home/tony/ACI-DASHBOARD/db-consolidation/04-backup-all.sh
```

### 5. Production Hardening
```bash
# Change passwords
docker exec -it postgres-consolidated psql -U postgres
ALTER USER aci_dashboard_user WITH PASSWORD 'NewStrongPassword!';

# Update connection strings in applications

# Configure firewall
sudo ufw allow from 192.168.1.0/24 to any port 5432

# Enable SSL (see README.md for details)
```

## 🆘 Troubleshooting

### Quick Fixes

**Cannot connect to database**:
```bash
docker ps | grep postgres-consolidated  # Check if running
docker logs postgres-consolidated       # Check logs
```

**Permission denied**:
```bash
docker exec -i postgres-consolidated psql -U postgres < 01-setup-databases.sql
```

**Container won't start**:
```bash
docker-compose -f docker-compose.consolidated.yml down -v
docker-compose -f docker-compose.consolidated.yml up -d
```

**Forgot a password**:
See [connection-strings.env](connection-strings.env)

For detailed troubleshooting, see [README.md - Troubleshooting section](README.md#troubleshooting)

## 🔐 Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Update `connection-strings.env` (don't commit to git!)
- [ ] Configure firewall rules
- [ ] Enable SSL/TLS
- [ ] Set up automated backups
- [ ] Configure monitoring
- [ ] Review audit logging
- [ ] Test disaster recovery
- [ ] Document procedures
- [ ] Train team members

See [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) for complete checklist.

## 📞 Support

For help:
1. Check [GETTING-STARTED.md](GETTING-STARTED.md)
2. Read [README.md](README.md) troubleshooting section
3. Review PostgreSQL logs: `docker logs postgres-consolidated`
4. Check application logs
5. Verify network connectivity
6. Review [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)

## 🎉 Success Indicators

Setup is successful when:
- ✅ All 5 databases created
- ✅ All users can access their own databases
- ✅ Users CANNOT access other databases
- ✅ Applications connect successfully
- ✅ CRUD operations work
- ✅ Backups run successfully
- ✅ PgAdmin accessible

## 📝 Change Log

### Version 1.0.0 (2025-10-20)
- Initial release
- Support for 5 applications
- Docker and native PostgreSQL support
- Automated setup and migration
- Complete documentation
- Security isolation
- Backup and recovery tools

## 📄 License

Internal use only - ACI Applications

---

**Last Updated**: 2025-10-20

**Package Version**: 1.0.0

**Maintained By**: Database Administration Team

---

## Quick Navigation

- 🚀 [Getting Started](GETTING-STARTED.md)
- 📖 [Complete Documentation](README.md)
- ✅ [Deployment Checklist](DEPLOYMENT-CHECKLIST.md)
- 🔗 [Connection Strings](connection-strings.env)
- 📑 [This Index](INDEX.md)

**Ready to start?** → [GETTING-STARTED.md](GETTING-STARTED.md)
