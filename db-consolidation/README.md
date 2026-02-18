# PostgreSQL Database Consolidation

Complete solution for consolidating 5 applications into a single PostgreSQL server.

## Overview

This consolidation package allows you to:
- Migrate from multiple PostgreSQL servers to one unified instance
- Maintain complete isolation between applications
- Manage all databases from a single PostgreSQL server
- Reduce operational overhead and resource usage
- Simplify backup and disaster recovery

## Applications Supported

1. **ACI Dashboard** - Main dashboard application
2. **Kosh Inventory** (ACI Inventory) - Inventory management
3. **ACI Excel Migration** - Excel data migration tool
4. **BOM Compare** - Bill of Materials comparison
5. **Nexus** - Nexus application

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL Consolidated Server               │
│                      localhost:5432                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │aci_dashboard │  │kosh_inventory│  │aci_excel_... │     │
│  │   Database   │  │   Database   │  │   Database   │     │
│  │              │  │              │  │              │     │
│  │ Owner:       │  │ Owner:       │  │ Owner:       │     │
│  │ aci_dash...  │  │ kosh_inv...  │  │ aci_excel... │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ bom_compare  │  │    nexus     │                        │
│  │   Database   │  │   Database   │                        │
│  │              │  │              │                        │
│  │ Owner:       │  │ Owner:       │                        │
│  │ bom_comp...  │  │ nexus_user   │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Option 1: Automated Setup (Recommended)

For Docker-based setup:
```bash
cd db-consolidation
chmod +x *.sh
./05-setup-automated.sh docker
```

For existing PostgreSQL installation:
```bash
cd db-consolidation
chmod +x *.sh
./05-setup-automated.sh native
```

### Option 2: Manual Step-by-Step

1. **Start PostgreSQL server** (Docker):
   ```bash
   docker-compose -f docker-compose.consolidated.yml up -d
   ```

2. **Create databases and users**:
   ```bash
   docker exec -i postgres-consolidated psql -U postgres < 01-setup-databases.sql
   ```

3. **Verify isolation**:
   ```bash
   ./03-verify-isolation.sh
   ```

4. **Migrate data** (if applicable):
   ```bash
   # Edit 02-migrate-data.sh with your old server details
   ./02-migrate-data.sh
   ```

## File Structure

```
db-consolidation/
├── README.md                              # This file
├── QUICK-REFERENCE.md                     # Quick reference guide
├── 01-setup-databases.sql                 # SQL setup script
├── 02-migrate-data.sh                     # Data migration script
├── 03-verify-isolation.sh                 # Isolation verification
├── 04-backup-all.sh                       # Backup script
├── 05-setup-automated.sh                  # Automated setup
├── connection-strings.env                 # Connection string examples
├── docker-compose.consolidated.yml        # Docker Compose config
├── postgresql.conf                        # PostgreSQL configuration
├── pgadmin-servers.json                   # PgAdmin configuration
└── docker-init-scripts/
    └── 01-create-multiple-databases.sh    # Docker init script
```

## Database Details

| Application | Database | User | Port |
|------------|----------|------|------|
| ACI Dashboard | `aci_dashboard` | `aci_dashboard_user` | 5432 |
| Kosh Inventory | `kosh_inventory` | `kosh_inventory_user` | 5432 |
| ACI Excel Migration | `aci_excel_migration` | `aci_excel_migration_user` | 5432 |
| BOM Compare | `bom_compare` | `bom_compare_user` | 5432 |
| Nexus | `nexus` | `nexus_user` | 5432 |

**Note**: All passwords are in [connection-strings.env](connection-strings.env)

## Connection Examples

### Python (SQLAlchemy)

```python
# ACI Dashboard
DATABASE_URL = "postgresql://aci_dashboard_user:AciDash_SecureP@ss2025!@localhost:5432/aci_dashboard"

# Kosh Inventory
DATABASE_URL = "postgresql://kosh_inventory_user:KoshInv_SecureP@ss2025!@localhost:5432/kosh_inventory"
```

### Node.js (TypeORM)

```javascript
// ACI Dashboard
{
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "aci_dashboard_user",
  password: "AciDash_SecureP@ss2025!",
  database: "aci_dashboard"
}
```

### Command Line (psql)

```bash
# ACI Dashboard
PGPASSWORD='AciDash_SecureP@ss2025!' psql -h localhost -p 5432 -U aci_dashboard_user -d aci_dashboard

# Kosh Inventory
PGPASSWORD='KoshInv_SecureP@ss2025!' psql -h localhost -p 5432 -U kosh_inventory_user -d kosh_inventory
```

## Migration Process

### Step 1: Backup Old Databases

Before migration, backup your existing databases:

```bash
# Edit 02-migrate-data.sh with your old server details
nano 02-migrate-data.sh

# Run migration
./02-migrate-data.sh
```

The script will:
- Connect to each old server
- Dump each database
- Restore to the consolidated server
- Verify the migration

### Step 2: Update Application Configuration

Update each application's `.env` file with the new connection string:

**ACI Dashboard** (`backend/.env`):
```env
DATABASE_URL=postgresql://aci_dashboard_user:AciDash_SecureP@ss2025!@localhost:5432/aci_dashboard
```

**Kosh Inventory** (`.env`):
```env
DATABASE_URL=postgresql://kosh_inventory_user:KoshInv_SecureP@ss2025!@localhost:5432/kosh_inventory
```

And so on for other applications...

### Step 3: Test Connectivity

Test each application's database connection:

```bash
# Test ACI Dashboard
PGPASSWORD='AciDash_SecureP@ss2025!' psql -h localhost -p 5432 -U aci_dashboard_user -d aci_dashboard -c "SELECT 1;"

# Test Kosh Inventory
PGPASSWORD='KoshInv_SecureP@ss2025!' psql -h localhost -p 5432 -U kosh_inventory_user -d kosh_inventory -c "SELECT 1;"
```

### Step 4: Verify Isolation

Run the isolation verification script:

```bash
./03-verify-isolation.sh
```

This ensures each user can only access their own database.

### Step 5: Update Applications

1. Stop all applications
2. Update their `.env` files
3. Restart applications
4. Monitor logs for any connection issues

## Backup and Recovery

### Automated Backups

Set up automated backups with cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/db-consolidation/04-backup-all.sh
```

### Manual Backup

```bash
# Backup all databases
./04-backup-all.sh

# Backup single database
PGPASSWORD='postgres' pg_dump \
  -h localhost -p 5432 -U postgres \
  -d aci_dashboard \
  -Fc -f aci_dashboard.dump
```

### Restore from Backup

```bash
# Decompress backup
gunzip aci_dashboard.dump.gz

# Restore
PGPASSWORD='postgres' pg_restore \
  -h localhost -p 5432 -U postgres \
  -d aci_dashboard \
  --clean --if-exists \
  aci_dashboard.dump
```

See `RESTORE_INSTRUCTIONS.md` in backup directory for detailed instructions.

## Management Tools

### PgAdmin (Web UI)

Access PgAdmin at http://localhost:5050

- **Email**: admin@aci.local
- **Password**: admin123

PgAdmin is pre-configured with connections to all databases.

### Command Line

```bash
# Access PostgreSQL as admin
docker exec -it postgres-consolidated psql -U postgres

# View all databases
\l

# View all users
\du

# Connect to specific database
\c aci_dashboard

# View tables
\dt
```

## Monitoring

### Check Connection Count

```sql
SELECT datname, count(*)
FROM pg_stat_activity
GROUP BY datname;
```

### Check Database Sizes

```sql
SELECT
    datname AS database,
    pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database
WHERE datistemplate = false
ORDER BY pg_database_size(datname) DESC;
```

### Check Active Queries

```sql
SELECT
    pid,
    usename,
    datname,
    query_start,
    state,
    query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
```

### View Logs

```bash
# Docker logs
docker logs postgres-consolidated

# Follow logs
docker logs -f postgres-consolidated

# PostgreSQL logs inside container
docker exec -it postgres-consolidated tail -f /var/lib/postgresql/data/pg_log/postgresql-*.log
```

## Performance Tuning

### Resource Allocation

Edit `postgresql.conf` based on your server's RAM:

| RAM | shared_buffers | effective_cache_size | work_mem |
|-----|----------------|----------------------|----------|
| 4GB | 1GB | 3GB | 4MB |
| 8GB | 2GB | 6GB | 8MB |
| 16GB | 4GB | 12GB | 16MB |
| 32GB | 8GB | 24GB | 32MB |

### Connection Pooling

For production, use PgBouncer:

```yaml
pgbouncer:
  image: pgbouncer/pgbouncer
  environment:
    - DATABASES_HOST=postgres-consolidated
    - DATABASES_PORT=5432
    - DATABASES_USER=postgres
    - DATABASES_PASSWORD=postgres
    - POOL_MODE=transaction
    - MAX_CLIENT_CONN=1000
    - DEFAULT_POOL_SIZE=25
  ports:
    - "6432:6432"
```

## Security

### Change Default Passwords

**IMPORTANT**: Change all default passwords before production!

```sql
-- Connect as postgres
ALTER USER aci_dashboard_user WITH PASSWORD 'NewSecurePassword123!';
ALTER USER kosh_inventory_user WITH PASSWORD 'NewSecurePassword123!';
-- ... repeat for all users
```

### Enable SSL/TLS

1. Generate SSL certificates
2. Update `postgresql.conf`:
   ```
   ssl = on
   ssl_cert_file = '/path/to/server.crt'
   ssl_key_file = '/path/to/server.key'
   ```
3. Update connection strings to require SSL:
   ```
   postgresql://user:pass@host:port/db?sslmode=require
   ```

### Firewall Configuration

```bash
# Allow PostgreSQL port only from specific IPs
sudo ufw allow from 192.168.1.0/24 to any port 5432

# Or allow only from localhost
sudo ufw allow from 127.0.0.1 to any port 5432
```

### Audit Logging

Enable audit logging in `postgresql.conf`:

```conf
log_connections = on
log_disconnections = on
log_duration = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_statement = 'all'  # Log all queries (may impact performance)
```

## Troubleshooting

### Connection Refused

```bash
# Check if PostgreSQL is running
docker ps | grep postgres-consolidated

# Check logs
docker logs postgres-consolidated

# Verify port is open
netstat -tulpn | grep 5432
```

### Permission Denied

```bash
# Re-run setup script
docker exec -i postgres-consolidated psql -U postgres < 01-setup-databases.sql

# Or manually grant privileges
docker exec -it postgres-consolidated psql -U postgres -d aci_dashboard -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aci_dashboard_user;"
```

### Out of Memory

```bash
# Check PostgreSQL memory usage
docker stats postgres-consolidated

# Adjust postgresql.conf
# Reduce shared_buffers, work_mem, or max_connections
```

### Slow Queries

```sql
-- Enable query logging
ALTER DATABASE aci_dashboard SET log_min_duration_statement = 1000;

-- View slow queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Database Locks

```sql
-- View current locks
SELECT
    pid,
    usename,
    pg_blocking_pids(pid) AS blocked_by,
    query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;

-- Kill blocking query (use with caution!)
SELECT pg_terminate_backend(pid);
```

## Maintenance

### Vacuum and Analyze

```bash
# Manual vacuum all databases
docker exec -it postgres-consolidated vacuumdb -U postgres -a -z -v

# Vacuum specific database
docker exec -it postgres-consolidated vacuumdb -U postgres -d aci_dashboard -z -v
```

### Reindex

```bash
# Reindex all databases
docker exec -it postgres-consolidated reindexdb -U postgres -a

# Reindex specific database
docker exec -it postgres-consolidated reindexdb -U postgres -d aci_dashboard
```

### Update Statistics

```sql
-- For specific database
\c aci_dashboard
ANALYZE;

-- For specific table
ANALYZE users;
```

## Docker Commands Reference

```bash
# Start services
docker-compose -f docker-compose.consolidated.yml up -d

# Stop services
docker-compose -f docker-compose.consolidated.yml down

# Restart PostgreSQL
docker-compose -f docker-compose.consolidated.yml restart postgres-consolidated

# View logs
docker-compose -f docker-compose.consolidated.yml logs -f

# Execute SQL file
docker exec -i postgres-consolidated psql -U postgres < script.sql

# Interactive shell
docker exec -it postgres-consolidated bash

# PostgreSQL shell
docker exec -it postgres-consolidated psql -U postgres

# Remove everything (CAUTION!)
docker-compose -f docker-compose.consolidated.yml down -v
```

## Scaling Considerations

### Vertical Scaling
- Add more CPU cores
- Increase RAM
- Use faster SSD storage
- Adjust `postgresql.conf` accordingly

### Horizontal Scaling
- Set up read replicas for read-heavy workloads
- Use PgBouncer for connection pooling
- Consider partitioning large tables
- Implement caching layer (Redis)

### When to NOT Consolidate
- If databases exceed 500GB each
- If applications require different PostgreSQL versions
- If strict physical isolation is required for compliance
- If network latency between apps and DB is critical

## Compliance and Auditing

### Enable Audit Logging

```conf
# postgresql.conf
log_statement = 'mod'  # Log all data modifications
log_connections = on
log_disconnections = on
log_duration = on
```

### Track Database Changes

```sql
-- Create audit trigger (example)
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (table_name, action, old_data, new_data, changed_by, changed_at)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), current_user, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Support and Contact

For issues or questions:
1. Check this README
2. Review [QUICK-REFERENCE.md](QUICK-REFERENCE.md)
3. Check PostgreSQL logs
4. Review the troubleshooting section
5. Contact your database administrator

## License

Internal use only - ACI Applications

## Changelog

### Version 1.0.0 (2025)
- Initial consolidation setup
- Support for 5 applications
- Docker and native PostgreSQL support
- Automated backup and verification scripts
- PgAdmin integration
- Complete isolation between databases

---

**Last Updated**: 2025-10-20

**Maintained By**: Database Administration Team
