# Getting Started with PostgreSQL Consolidation

**Quick start guide for consolidating 5 applications into one PostgreSQL server**

## TL;DR - Quick Setup (5 minutes)

If you just want to get started quickly:

```bash
cd /home/tony/ACI-DASHBOARD/db-consolidation
chmod +x *.sh
./05-setup-automated.sh docker
```

That's it! The script will:
- Start PostgreSQL in Docker
- Create all 5 databases
- Create isolated users with unique passwords
- Set up proper permissions
- Verify everything works

## What You're Getting

### Before Consolidation
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ PostgreSQL  │     │ PostgreSQL  │     │ PostgreSQL  │
│   :2001     │     │   :5433     │     │   :5434     │
│             │     │             │     │             │
│ acidashboard│     │    kosh     │     │ aci_excel   │
└─────────────┘     └─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐
│ PostgreSQL  │     │ PostgreSQL  │
│   :5435     │     │   :5436     │
│             │     │             │
│ bom_compare │     │    nexus    │
└─────────────┘     └─────────────┘
```

### After Consolidation
```
┌────────────────────────────────────────────────────────┐
│           PostgreSQL Consolidated Server               │
│                   localhost:5432                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  aci_dashboard │ kosh_inventory │ aci_excel_migration │
│  bom_compare   │ nexus                                │
│                                                        │
│  Each with isolated users and secure passwords        │
└────────────────────────────────────────────────────────┘
```

## Step-by-Step Setup

### Step 1: Choose Your Setup Method

#### Method A: Docker (Recommended - Easiest)

**Pros:**
- Isolated environment
- Easy to start/stop/restart
- Includes PgAdmin web UI
- Easy cleanup if needed

**Cons:**
- Requires Docker installed

**Command:**
```bash
./05-setup-automated.sh docker
```

#### Method B: Native PostgreSQL

**Pros:**
- No Docker overhead
- Direct system integration

**Cons:**
- Requires PostgreSQL 15 installed
- More manual configuration

**Command:**
```bash
./05-setup-automated.sh native
```

### Step 2: Verify Setup

After running the setup script, verify everything:

```bash
# Check database isolation
./03-verify-isolation.sh
```

You should see output like:
```
✓ aci_dashboard_user can access aci_dashboard (EXPECTED)
✓ aci_dashboard_user cannot access kosh_inventory (EXPECTED)
✓ aci_dashboard_user cannot access aci_excel_migration (EXPECTED)
...
✓ All isolation tests passed!
```

### Step 3: Get Connection Strings

All connection strings are in: [connection-strings.env](connection-strings.env)

Quick reference:

```bash
# ACI Dashboard
postgresql://aci_dashboard_user:AciDash_SecureP@ss2025!@localhost:5432/aci_dashboard

# Kosh Inventory
postgresql://kosh_inventory_user:KoshInv_SecureP@ss2025!@localhost:5432/kosh_inventory

# ACI Excel Migration
postgresql://aci_excel_migration_user:AciExcel_SecureP@ss2025!@localhost:5432/aci_excel_migration

# BOM Compare
postgresql://bom_compare_user:BomComp_SecureP@ss2025!@localhost:5432/bom_compare

# Nexus
postgresql://nexus_user:Nexus_SecureP@ss2025!@localhost:5432/nexus
```

### Step 4: Migrate Data (If Needed)

If you have existing data to migrate:

1. **Edit migration script** with your old server details:
   ```bash
   nano 02-migrate-data.sh
   ```

2. **Configure old servers** (around line 40-70):
   ```bash
   # Example for ACI Dashboard
   OLD_ACI_DASHBOARD_HOST="old-server.example.com"
   OLD_ACI_DASHBOARD_PORT="5432"
   OLD_ACI_DASHBOARD_USER="postgres"
   OLD_ACI_DASHBOARD_PASSWORD="oldpassword"
   OLD_ACI_DASHBOARD_DB="acidashboard"
   ```

3. **Run migration**:
   ```bash
   ./02-migrate-data.sh
   ```

4. **Verify migration**:
   ```bash
   # Check table counts
   PGPASSWORD='AciDash_SecureP@ss2025!' psql -h localhost -p 5432 -U aci_dashboard_user -d aci_dashboard -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
   ```

### Step 5: Update Applications

Update each application's `.env` file:

#### ACI Dashboard

File: `/home/tony/ACI-DASHBOARD/backend/.env`

Change:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:2001/acidashboard
```

To:
```env
DATABASE_URL=postgresql://aci_dashboard_user:AciDash_SecureP@ss2025!@localhost:5432/aci_dashboard
```

Restart:
```bash
cd /home/tony/ACI-DASHBOARD
docker-compose restart backend
```

#### Kosh Inventory

Update connection string to:
```env
DATABASE_URL=postgresql://kosh_inventory_user:KoshInv_SecureP@ss2025!@localhost:5432/kosh_inventory
```

#### Other Applications

Follow the same pattern for:
- ACI Excel Migration
- BOM Compare
- Nexus

### Step 6: Test Everything

Test each application:

1. **Test database connectivity**:
   ```bash
   # ACI Dashboard
   PGPASSWORD='AciDash_SecureP@ss2025!' psql -h localhost -p 5432 -U aci_dashboard_user -d aci_dashboard -c "SELECT 1;"
   ```

2. **Test application**:
   - Open application in browser
   - Login
   - View data
   - Try creating/updating records

3. **Check logs**:
   ```bash
   # PostgreSQL logs
   docker logs postgres-consolidated

   # Application logs
   docker logs aci-dashboard-backend
   ```

## Common Tasks

### View All Databases

```bash
docker exec -it postgres-consolidated psql -U postgres -c "\l"
```

### Connect to a Database

```bash
# As admin
docker exec -it postgres-consolidated psql -U postgres -d aci_dashboard

# As application user
PGPASSWORD='AciDash_SecureP@ss2025!' psql -h localhost -p 5432 -U aci_dashboard_user -d aci_dashboard
```

### Backup All Databases

```bash
./04-backup-all.sh
```

Backups are stored in: `./database-backups/[timestamp]/`

### Access PgAdmin Web UI

1. Open browser: http://localhost:5050
2. Login:
   - Email: admin@aci.local
   - Password: admin123
3. Databases are pre-configured!

### View Logs

```bash
# Follow logs in real-time
docker logs -f postgres-consolidated

# View last 100 lines
docker logs --tail 100 postgres-consolidated
```

### Restart PostgreSQL

```bash
docker-compose -f docker-compose.consolidated.yml restart postgres-consolidated
```

### Stop Everything

```bash
docker-compose -f docker-compose.consolidated.yml down
```

### Start Everything

```bash
docker-compose -f docker-compose.consolidated.yml up -d
```

## Troubleshooting

### "Cannot connect to database"

**Check if PostgreSQL is running:**
```bash
docker ps | grep postgres-consolidated
```

**If not running, start it:**
```bash
docker-compose -f docker-compose.consolidated.yml up -d
```

**Check logs for errors:**
```bash
docker logs postgres-consolidated
```

### "Permission denied for database"

**Re-run the setup script:**
```bash
docker exec -i postgres-consolidated psql -U postgres < 01-setup-databases.sql
```

### "Connection refused"

**Check port is accessible:**
```bash
netstat -tulpn | grep 5432
```

**Check firewall:**
```bash
sudo ufw status
```

### "Docker container won't start"

**View error logs:**
```bash
docker-compose -f docker-compose.consolidated.yml logs
```

**Remove and recreate:**
```bash
docker-compose -f docker-compose.consolidated.yml down -v
docker-compose -f docker-compose.consolidated.yml up -d
```

## Next Steps

Now that you have the consolidated server running:

1. **Set up automated backups**:
   ```bash
   crontab -e
   # Add: 0 2 * * * /home/tony/ACI-DASHBOARD/db-consolidation/04-backup-all.sh
   ```

2. **Change default passwords** (IMPORTANT for production!):
   ```sql
   docker exec -it postgres-consolidated psql -U postgres
   ALTER USER aci_dashboard_user WITH PASSWORD 'YourNewStrongPassword';
   ```

3. **Configure monitoring**:
   - Set up alerts for high CPU/memory
   - Monitor disk space
   - Track slow queries

4. **Review security**:
   - See [README.md](README.md#security) for security checklist
   - Enable SSL/TLS for production
   - Configure firewall rules

5. **Documentation**:
   - Update your system documentation
   - Share connection strings with team (securely!)
   - Document any customizations

## Documentation Files

- **[README.md](README.md)** - Complete documentation (read this for deep dive)
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Quick command reference
- **[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)** - Deployment checklist
- **[connection-strings.env](connection-strings.env)** - All connection strings
- **This file** - Getting started guide (you are here)

## Need Help?

1. Check [README.md](README.md) for detailed documentation
2. Review [QUICK-REFERENCE.md](QUICK-REFERENCE.md) for commands
3. Check PostgreSQL logs: `docker logs postgres-consolidated`
4. Review troubleshooting section above

## Summary of What Was Created

The setup script created:

✓ **5 isolated databases**: `aci_dashboard`, `kosh_inventory`, `aci_excel_migration`, `bom_compare`, `nexus`

✓ **5 secure users**: Each with unique passwords and isolated access

✓ **Proper permissions**: Each user can only access their own database

✓ **PostgreSQL extensions**: uuid-ossp, pgcrypto enabled

✓ **PgAdmin web UI**: For easy database management

✓ **Backup scripts**: Automated backup of all databases

✓ **Verification scripts**: To ensure security and isolation

✓ **Complete documentation**: Everything you need to know

## Quick Commands Cheat Sheet

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

# Verify isolation
./03-verify-isolation.sh

# Migrate data
./02-migrate-data.sh

# Access PgAdmin
# Open browser: http://localhost:5050
```

---

**You're all set!** 🎉

Your consolidated PostgreSQL server is ready to use. Each application has its own isolated database with secure access.

**Remember**: Change default passwords before going to production!
