# PostgreSQL Consolidation Deployment Checklist

Use this checklist to ensure a smooth deployment of your consolidated PostgreSQL server.

## Pre-Deployment

### Planning Phase

- [ ] Document current database configurations
  - [ ] List all database servers (host, port, credentials)
  - [ ] Note database sizes and table counts
  - [ ] Identify peak usage times
  - [ ] Document application dependencies

- [ ] Capacity planning
  - [ ] Calculate total storage needed (sum of all databases + 50% buffer)
  - [ ] Determine RAM requirements (16GB minimum recommended)
  - [ ] Estimate connection count (sum of all app connections)
  - [ ] Plan for future growth

- [ ] Schedule deployment
  - [ ] Choose maintenance window (low traffic time)
  - [ ] Notify all stakeholders
  - [ ] Plan rollback strategy
  - [ ] Prepare communication templates

### Backup Phase

- [ ] Backup all existing databases
  ```bash
  ./02-migrate-data.sh
  ```

- [ ] Verify backup integrity
  - [ ] Check backup file sizes
  - [ ] Test restore on a separate server
  - [ ] Document backup locations

- [ ] Create application snapshots
  - [ ] Backup application configuration files
  - [ ] Document current connection strings
  - [ ] Take VM/container snapshots if applicable

## Deployment Phase

### Step 1: Setup Consolidated Server

#### Option A: Docker Deployment (Recommended)

- [ ] Verify Docker and Docker Compose installed
  ```bash
  docker --version
  docker-compose --version
  ```

- [ ] Review and customize configuration
  - [ ] Edit `postgresql.conf` for your hardware
  - [ ] Review `docker-compose.consolidated.yml`
  - [ ] Customize passwords in init scripts

- [ ] Deploy using automated script
  ```bash
  cd /home/tony/ACI-DASHBOARD/db-consolidation
  ./05-setup-automated.sh docker
  ```

- [ ] Verify container is running
  ```bash
  docker ps | grep postgres-consolidated
  ```

#### Option B: Native PostgreSQL Installation

- [ ] Install PostgreSQL 15
  ```bash
  sudo apt update
  sudo apt install postgresql-15
  ```

- [ ] Run setup script
  ```bash
  cd /home/tony/ACI-DASHBOARD/db-consolidation
  ./05-setup-automated.sh native
  ```

### Step 2: Verify Database Setup

- [ ] Check all databases created
  ```bash
  docker exec -it postgres-consolidated psql -U postgres -c "\l"
  ```

- [ ] Verify all users created
  ```bash
  docker exec -it postgres-consolidated psql -U postgres -c "\du"
  ```

- [ ] Test user connections
  ```bash
  ./03-verify-isolation.sh
  ```

- [ ] Check database isolation
  - [ ] Each user can access only their database
  - [ ] Users cannot see other databases
  - [ ] CRUD operations work correctly

### Step 3: Data Migration

- [ ] Configure migration script
  - [ ] Edit `02-migrate-data.sh`
  - [ ] Set old server credentials
  - [ ] Verify connectivity to old servers

- [ ] Run data migration
  ```bash
  ./02-migrate-data.sh
  ```

- [ ] Verify data migrated correctly
  - [ ] Check table counts match
  - [ ] Verify row counts for key tables
  - [ ] Test critical queries
  - [ ] Check for missing indexes

- [ ] Compare data integrity
  ```sql
  -- On old server
  SELECT COUNT(*) FROM users;
  SELECT md5(array_agg(md5((t.*)::text))::text) FROM users t;

  -- On new server (should match)
  SELECT COUNT(*) FROM users;
  SELECT md5(array_agg(md5((t.*)::text))::text) FROM users t;
  ```

### Step 4: Update Applications

#### ACI Dashboard

- [ ] Stop application
  ```bash
  docker-compose stop backend
  ```

- [ ] Update `.env` file
  ```bash
  nano /home/tony/ACI-DASHBOARD/backend/.env
  # Update DATABASE_URL
  DATABASE_URL=postgresql://aci_dashboard_user:AciDash_SecureP@ss2025!@localhost:5432/aci_dashboard
  ```

- [ ] Test connection
  ```bash
  PGPASSWORD='AciDash_SecureP@ss2025!' psql -h localhost -p 5432 -U aci_dashboard_user -d aci_dashboard -c "SELECT 1;"
  ```

- [ ] Start application
  ```bash
  docker-compose up -d backend
  ```

- [ ] Verify application works
  - [ ] Login works
  - [ ] Data displays correctly
  - [ ] CRUD operations work
  - [ ] Check application logs

#### Kosh Inventory

- [ ] Stop application

- [ ] Update connection string
  ```
  DATABASE_URL=postgresql://kosh_inventory_user:KoshInv_SecureP@ss2025!@localhost:5432/kosh_inventory
  ```

- [ ] Test connection

- [ ] Start application

- [ ] Verify functionality

#### ACI Excel Migration

- [ ] Stop application

- [ ] Update connection string
  ```
  DATABASE_URL=postgresql://aci_excel_migration_user:AciExcel_SecureP@ss2025!@localhost:5432/aci_excel_migration
  ```

- [ ] Test connection

- [ ] Start application

- [ ] Verify functionality

#### BOM Compare

- [ ] Stop application

- [ ] Update connection string
  ```
  DATABASE_URL=postgresql://bom_compare_user:BomComp_SecureP@ss2025!@localhost:5432/bom_compare
  ```

- [ ] Test connection

- [ ] Start application

- [ ] Verify functionality

#### Nexus

- [ ] Stop application

- [ ] Update connection string
  ```
  DATABASE_URL=postgresql://nexus_user:Nexus_SecureP@ss2025!@localhost:5432/nexus
  ```

- [ ] Test connection

- [ ] Start application

- [ ] Verify functionality

## Post-Deployment

### Testing Phase

- [ ] Smoke tests for each application
  - [ ] User login
  - [ ] View data
  - [ ] Create record
  - [ ] Update record
  - [ ] Delete record

- [ ] Performance testing
  - [ ] Monitor query response times
  - [ ] Check connection pool usage
  - [ ] Verify no connection leaks
  - [ ] Monitor resource usage (CPU, RAM, disk I/O)

- [ ] Integration testing
  - [ ] Test all application features
  - [ ] Verify data consistency
  - [ ] Test concurrent access
  - [ ] Verify backups work

### Monitoring Setup

- [ ] Configure monitoring
  - [ ] Set up PostgreSQL metrics collection
  - [ ] Configure alerts for high CPU/memory
  - [ ] Monitor connection counts
  - [ ] Track slow queries

- [ ] Set up log monitoring
  ```bash
  docker logs -f postgres-consolidated
  ```

- [ ] Configure PgAdmin access
  - [ ] Access http://localhost:5050
  - [ ] Login with admin@aci.local / admin123
  - [ ] Verify all databases visible

### Backup and Recovery

- [ ] Test backup script
  ```bash
  ./04-backup-all.sh
  ```

- [ ] Verify backups created
  ```bash
  ls -lh database-backups/
  ```

- [ ] Test restore procedure
  - [ ] Create test database
  - [ ] Restore from backup
  - [ ] Verify data integrity

- [ ] Schedule automated backups
  ```bash
  crontab -e
  # Add: 0 2 * * * /home/tony/ACI-DASHBOARD/db-consolidation/04-backup-all.sh
  ```

- [ ] Configure backup retention
  - [ ] Set `BACKUP_RETENTION_DAYS` in `04-backup-all.sh`
  - [ ] Verify old backups are cleaned up

### Security Hardening

- [ ] Change default passwords
  ```sql
  -- Connect as postgres
  ALTER USER aci_dashboard_user WITH PASSWORD 'NewStrongPassword!';
  ALTER USER kosh_inventory_user WITH PASSWORD 'NewStrongPassword!';
  ALTER USER aci_excel_migration_user WITH PASSWORD 'NewStrongPassword!';
  ALTER USER bom_compare_user WITH PASSWORD 'NewStrongPassword!';
  ALTER USER nexus_user WITH PASSWORD 'NewStrongPassword!';
  ALTER USER postgres WITH PASSWORD 'NewAdminPassword!';
  ```

- [ ] Update connection strings in applications

- [ ] Configure firewall
  ```bash
  sudo ufw allow from 192.168.1.0/24 to any port 5432
  ```

- [ ] Enable SSL/TLS (production)
  - [ ] Generate SSL certificates
  - [ ] Update `postgresql.conf`
  - [ ] Update connection strings with `?sslmode=require`

- [ ] Review pg_hba.conf
  ```bash
  docker exec -it postgres-consolidated cat /var/lib/postgresql/data/pg_hba.conf
  ```

- [ ] Enable audit logging
  - [ ] Configure log settings in `postgresql.conf`
  - [ ] Set up log rotation
  - [ ] Configure log shipping to SIEM

### Documentation

- [ ] Document new architecture
  - [ ] Update system diagrams
  - [ ] Document connection strings (securely!)
  - [ ] Update runbooks

- [ ] Update application documentation
  - [ ] Update README files
  - [ ] Update deployment guides
  - [ ] Document troubleshooting steps

- [ ] Create incident response plan
  - [ ] Document rollback procedure
  - [ ] List emergency contacts
  - [ ] Prepare communication templates

### Decommissioning Old Servers

**WAIT AT LEAST 1 WEEK BEFORE DECOMMISSIONING!**

- [ ] Monitor new system for stability

- [ ] Confirm no issues reported

- [ ] Create final backups of old servers
  ```bash
  # Backup each old server one last time
  ```

- [ ] Stop old database servers
  ```bash
  # Do NOT delete data yet!
  docker-compose stop old-db-server
  ```

- [ ] Archive old server data
  - [ ] Create full backups
  - [ ] Store in secure location
  - [ ] Document retention period

- [ ] Update DNS/hosts files if applicable

- [ ] Remove old server references
  - [ ] Update monitoring
  - [ ] Remove from backup schedules
  - [ ] Update documentation

- [ ] After 30 days: Delete old servers
  - [ ] Verify no issues in new system
  - [ ] Get final approval
  - [ ] Permanently delete old data
  - [ ] Document decommissioning

## Rollback Procedure

If issues occur, follow this rollback procedure:

### Immediate Rollback (Within 1 hour)

1. [ ] Stop all applications
2. [ ] Revert application configuration to old connection strings
3. [ ] Start old database servers
4. [ ] Restart applications
5. [ ] Verify applications work
6. [ ] Notify stakeholders
7. [ ] Schedule post-mortem

### Delayed Rollback (After 1 hour)

1. [ ] Stop all applications
2. [ ] Dump data from consolidated server
3. [ ] Restore to old servers
4. [ ] Update application configuration
5. [ ] Restart applications
6. [ ] Verify data integrity
7. [ ] Notify stakeholders
8. [ ] Schedule post-mortem

## Success Criteria

Deployment is considered successful when:

- [ ] All 5 applications running on consolidated database
- [ ] All applications functioning correctly
- [ ] No performance degradation
- [ ] Database isolation verified
- [ ] Backups working and tested
- [ ] Monitoring in place and alerting
- [ ] No critical issues for 48 hours
- [ ] Stakeholders notified of success
- [ ] Documentation updated
- [ ] Team trained on new system

## Contacts

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| Database Admin | [Name] | [Email/Phone] | 24/7 |
| DevOps Lead | [Name] | [Email/Phone] | Business hours |
| Application Owner | [Name] | [Email/Phone] | Business hours |
| IT Support | [Name] | [Email/Phone] | 24/7 |

## Notes

Use this space for deployment-specific notes:

```
Date: _____________
Deployed by: _____________
Start time: _____________
End time: _____________
Issues encountered: _____________
Resolution: _____________
```

---

**Important**: Check off each item as you complete it. Do not skip steps!

**Remember**: You can always rollback if serious issues occur. Don't rush!
