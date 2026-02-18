# ACI Dashboard Deployment Guide

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- `/etc/hosts` configured with `acidashboard.aci.local`

### Add to /etc/hosts
```bash
echo "127.0.0.1    acidashboard.aci.local" | sudo tee -a /etc/hosts
```

## Option 1: Start Everything (Recommended)

Use the master startup script to start both ACI Dashboard and ACI Chat:

```bash
cd ~
chmod +x start-all-aci-services.sh
./start-all-aci-services.sh
```

This will start:
- ACI Dashboard on port 2005
- ACI Chat (OLLAMA) on port 4000

## Option 2: Start Services Individually

### Start ACI Dashboard
```bash
cd ~/ACI-DASHBOARD
chmod +x start-dashboard.sh
./start-dashboard.sh
```

### Start ACI Chat (OLLAMA)
```bash
cd ~/OLLAMA\ WEBUI
chmod +x start-aci-chat.sh
./start-aci-chat.sh
```

## Initial Database Setup

After starting the ACI Dashboard for the first time, seed the database:

```bash
cd ~/ACI-DASHBOARD/backend
source ../.venv/bin/activate  # If using virtual environment
python fix_complete_setup.py
```

This will create:
- All user accounts with updated tool assignments
- Tools including the new "ACI Chat" tool pointing to port 4000
- Roles and permissions

## Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| **ACI Dashboard** | http://acidashboard.aci.local:2005 | Main dashboard interface |
| **ACI Chat** | http://acidashboard.aci.local:4000 | OLLAMA WebUI for AI chat |
| **Backend API** | http://acidashboard.aci.local:2003 | REST API |
| **API Docs** | http://acidashboard.aci.local:2003/docs | Swagger documentation |
| **BOM Compare** | http://acidashboard.aci.local:8081 | BOM comparison tool |

## First Time Setup - ACI Chat

When you first access ACI Chat (http://acidashboard.aci.local:4000):

1. Create an admin account
2. Pull a model using the OLLAMA interface or CLI:
   ```bash
   docker exec -it aci-ollama ollama pull llama2
   # or
   docker exec -it aci-ollama ollama pull mistral
   # or
   docker exec -it aci-ollama ollama pull codellama
   ```
3. Start chatting with your local AI model!

## Using the Dashboard

1. Open http://acidashboard.aci.local:2005
2. Login with your credentials (see USER_CREDENTIALS.md)
3. Click on "ACI Chat" tool card to open the OLLAMA WebUI in a new tab
4. All other tools work similarly

## Architecture

```
┌─────────────────────────────────────────────┐
│  User Browser                               │
└─────────────────┬───────────────────────────┘
                  │
                  ├──→ http://acidashboard.aci.local:2005
                  │    (ACI Dashboard - Nginx on port 2005)
                  │    │
                  │    ├──→ Frontend (Next.js on port 3000)
                  │    └──→ Backend (FastAPI on port 2003)
                  │
                  └──→ http://acidashboard.aci.local:4000
                       (ACI Chat - OLLAMA WebUI)
                       └──→ OLLAMA API (port 11434)
```

## Monitoring and Troubleshooting

### View all running containers
```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

### View logs

**ACI Dashboard:**
```bash
cd ~/ACI-DASHBOARD
docker-compose logs -f
```

**Specific service:**
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f nginx
```

**ACI Chat:**
```bash
cd ~/OLLAMA\ WEBUI
docker-compose logs -f
```

### Check if ports are available
```bash
sudo netstat -tulpn | grep -E ':(2005|4000|2003|11434)'
```

### Restart services

**ACI Dashboard:**
```bash
cd ~/ACI-DASHBOARD
docker-compose restart
```

**ACI Chat:**
```bash
cd ~/OLLAMA\ WEBUI
docker-compose restart
```

### Stop all services

**ACI Dashboard:**
```bash
cd ~/ACI-DASHBOARD
docker-compose down
```

**ACI Chat:**
```bash
cd ~/OLLAMA\ WEBUI
docker-compose down
```

## Common Issues

### Port already in use
If port 2005 or 4000 is already in use:
```bash
# Find what's using the port
sudo lsof -i :2005
sudo lsof -i :4000

# Kill the process or change the port in docker-compose.yml
```

### Cannot access acidashboard.aci.local
Make sure your /etc/hosts file has the entry:
```bash
grep acidashboard /etc/hosts
# Should show: 127.0.0.1    acidashboard.aci.local
```

### ACI Chat not loading
1. Check OLLAMA container is running: `docker ps | grep ollama`
2. Check OLLAMA logs: `cd ~/OLLAMA\ WEBUI && docker-compose logs ollama`
3. Restart the service: `docker-compose restart`

### Database connection issues
1. Check PostgreSQL is running: `docker ps | grep postgres`
2. Check database logs: `cd ~/ACI-DASHBOARD && docker-compose logs db`
3. Verify connection string in .env file

## Security Notes

- Change default passwords in production
- Update JWT secret keys in .env
- Configure HTTPS for production use
- Enable firewall rules to restrict access
- Regular backups of PostgreSQL database

## Backup

### Database backup
```bash
docker exec aci-dashboard-db-1 pg_dump -U postgres acidashboard > backup.sql
```

### Restore database
```bash
cat backup.sql | docker exec -i aci-dashboard-db-1 psql -U postgres acidashboard
```

## Updates

To update the configuration or code:

1. Pull latest changes (if using git)
2. Rebuild containers:
   ```bash
   cd ~/ACI-DASHBOARD
   docker-compose build
   docker-compose up -d
   ```

## Support

For issues, check:
1. This deployment guide
2. README-PORTS.md for port configuration
3. SETUP-SUMMARY.md for configuration details
4. Container logs using docker-compose logs

---

**Last Updated**: October 6, 2025
