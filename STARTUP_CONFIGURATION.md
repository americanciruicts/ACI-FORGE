# ACI Dashboard Startup Configuration

## Issues Fixed

### 1. Frontend Health Check
- **Problem**: Frontend container health check was failing because `curl` was not installed
- **Solution**: Added `curl` installation to the frontend Dockerfile
- **Status**: ✅ Fixed - Container now shows as healthy

### 2. Monitor Service Path
- **Problem**: Systemd monitor service was looking for `/home/tony/ACI DASHBOARD/` (with space) instead of `/home/tony/ACI-DASHBOARD/` (with hyphen)
- **Solution**: Updated service file and monitor.sh script paths
- **Status**: ✅ Fixed - Service is now running successfully

### 3. Container Names in Monitor Script
- **Problem**: Monitor script referenced wrong container names (`acidashboard_*` instead of `aci-dashboard_*`)
- **Solution**: Updated container names in monitor.sh
- **Status**: ✅ Fixed

## Automatic Startup Configuration

### Docker Containers
All ACI Dashboard containers are configured to start automatically on system boot:
- `restart: always` policy is set for all containers
- Docker service is enabled to start on boot
- Containers will start even before user login

### Verified Containers with Auto-Restart:
- ✅ aci-database (PostgreSQL)
- ✅ aci-dashboard_nginx_1
- ✅ aci-dashboard_frontend_1
- ✅ aci-dashboard_backend_1
- ✅ aci-dashboard_redis_1

### Monitor Service
- Service: `aci-dashboard-monitor.service`
- Status: Running
- Monitors containers every 2 minutes
- Automatically restarts failed containers

## Windows Client Configuration

To access the dashboard from Windows machines, add this entry to your Windows hosts file:

### Steps:
1. Open Notepad as Administrator
2. Open file: `C:\Windows\System32\drivers\etc\hosts`
3. Add this line at the end:
   ```
   192.168.1.95  acidashboard.aci.local
   ```

4. Save the file
5. Access the dashboard at: http://acidashboard.aci.local:2005

### Current Server IP:
- **Server IP**: 192.168.1.95

## Verification Commands

### Check all containers are running and healthy:
```bash
docker ps --filter "name=aci-dashboard" --format "table {{.Names}}\t{{.Status}}"
```

### Check monitor service status:
```bash
systemctl --user status aci-dashboard-monitor.service
```

### View monitor service logs:
```bash
journalctl --user -u aci-dashboard-monitor.service -n 50 --no-pager
```

### Restart all services if needed:
```bash
cd /home/tony/ACI-DASHBOARD
docker-compose restart
```

## Why It Should Work Every Morning Now

1. **Docker Auto-Start**: Docker service starts on system boot
2. **Container Auto-Restart**: All containers have `restart: always` policy
3. **Health Checks**: All containers now have working health checks
4. **Monitor Service**: Automatically restarts any failed containers
5. **Fixed Paths**: All configuration paths are now correct

The site will be available within 1-2 minutes after system boot, giving time for:
- Docker service to start
- Containers to initialize
- Health checks to pass
- Frontend to compile and be ready

## Troubleshooting

If the site is not accessible after boot:

1. Check if containers are running:
   ```bash
   docker ps -a --filter "name=aci-dashboard"
   ```

2. Check container logs:
   ```bash
   docker logs aci-dashboard_frontend_1 --tail 50
   docker logs aci-dashboard_nginx_1 --tail 50
   ```

3. Check if port 2005 is accessible:
   ```bash
   curl http://localhost:2005
   ```

4. Restart containers manually:
   ```bash
   cd /home/tony/ACI-DASHBOARD
   docker-compose restart
   ```

## Additional Note

**User Lingering**: To enable the monitor service to start before user login, run:
```bash
sudo loginctl enable-linger tony
```
This requires sudo access but is optional since containers will start anyway.
