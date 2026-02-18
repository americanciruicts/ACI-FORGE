# ACI Dashboard - Port Configuration

## Overview
This document describes the port configuration for the ACI Dashboard and related services.

## Port Mapping

### ACI Dashboard (Main Application)
- **Port 2005**: Nginx reverse proxy - **Main access point**
  - URL: `http://acidashboard.aci.local:2005`
  - This is the main entry point for the ACI Dashboard

- **Port 3000**: Frontend (Next.js) - Internal only
  - Accessed through nginx on port 2005
  - Not directly accessible from outside

- **Port 2003**: Backend API (FastAPI) - External access
  - URL: `http://acidashboard.aci.local:2003`
  - REST API endpoints

- **Port 2001**: PostgreSQL Database - Internal only
  - Database for user management and tool assignments

- **Port 2002**: Redis Cache - Internal only
  - Session management and caching

- **Port 8081**: BOM Compare Tool
  - URL: `http://acidashboard.aci.local:8081`
  - Accessed as a tool from the dashboard

### ACI Chat (OLLAMA WebUI) - Port 4000 Series
- **Port 4000**: OLLAMA WebUI - **Main access point**
  - URL: `http://acidashboard.aci.local:4000`
  - AI chat interface using local LLMs
  - Integrated as a tool in the ACI Dashboard

- **Port 11434**: OLLAMA API
  - URL: `http://localhost:11434`
  - OLLAMA backend for model inference

### Other Tools
- **Port 5002**: Kosh (ACI Inventory) - If available
- **Port 6003**: ACI Excel Migration - If available

## Quick Start

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

## Accessing the Application

1. **Main Dashboard**: http://acidashboard.aci.local:2005
2. **ACI Chat**: http://acidashboard.aci.local:4000
3. **API Documentation**: http://acidashboard.aci.local:2003/docs

## Network Configuration

Make sure `acidashboard.aci.local` is added to your `/etc/hosts` file:

```bash
sudo nano /etc/hosts
```

Add the following line:
```
127.0.0.1    acidashboard.aci.local
```

## Security Notes

- The frontend runs on internal port 3000 and is proxied through nginx on port 2005
- All external access should go through nginx (port 2005) for security headers and rate limiting
- Database and Redis are not exposed externally (internal Docker network only)
- CORS is configured to allow communication between ports

## Troubleshooting

### Check if ports are in use:
```bash
sudo netstat -tulpn | grep -E ':(2005|4000|2003|11434)'
```

### View logs:
```bash
# ACI Dashboard
cd ~/ACI-DASHBOARD
docker-compose logs -f

# ACI Chat
cd ~/OLLAMA\ WEBUI
docker-compose logs -f
```

### Restart services:
```bash
# ACI Dashboard
cd ~/ACI-DASHBOARD
docker-compose restart

# ACI Chat
cd ~/OLLAMA\ WEBUI
docker-compose restart
```
