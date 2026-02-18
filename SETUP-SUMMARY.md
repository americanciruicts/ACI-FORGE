# ACI Dashboard Configuration Summary

## ✅ Configuration Complete

All configurations have been updated to run the ACI Dashboard on port 2005 and integrate OLLAMA WebUI (ACI Chat) on port 4000.

## Changes Made

### 1. ACI Dashboard - Port 2005 Configuration

#### Nginx Configuration
- **File**: `nginx/nginx.conf`
- **Change**: Updated main server to listen on port 2005
- **Before**: `listen 80;`
- **After**: `listen 2005;` with server_name `acidashboard.aci.local localhost`

#### Docker Compose
- **File**: `docker-compose.yml`
- **Change**: Updated nginx port mapping
- **Before**: `"2005:80"`
- **After**: `"2005:2005"`
- **Note**: Frontend remains on internal port 3000, proxied through nginx

#### Backend Configuration
- **File**: `backend/app/core/config.py`
- **Change**: Updated FRONTEND_URL default
- **After**: `http://acidashboard.aci.local:2005`

#### Frontend Security Headers
- **File**: `frontend/next.config.js`
- **Change**: Added port 4000 to CSP and frame-src for OLLAMA integration
- **Added**: `http://acidashboard.aci.local:4000` to connect-src and frame-src

#### Environment Variables
- **File**: `.env`
- **Change**: Updated CORS and frontend URL settings
- **After**:
  - `FRONTEND_URL=http://acidashboard.aci.local:2005`
  - Added port 4000 to ALLOWED_ORIGINS

### 2. ACI Chat (OLLAMA WebUI) - Port 4000 Configuration

#### Created OLLAMA Docker Compose
- **File**: `~/OLLAMA WEBUI/docker-compose.yml` (NEW)
- **Services**:
  - `ollama`: OLLAMA backend on port 11434
  - `open-webui`: Web interface on port 4000 (internal 8080)
- **Access**: `http://acidashboard.aci.local:4000`

#### Created Environment File
- **File**: `~/OLLAMA WEBUI/.env` (NEW)
- **Configuration**:
  - PORT=4000
  - WEBUI_NAME="ACI Chat"
  - Integration with ACI Dashboard

### 3. Backend Tool Updates

#### Updated Seed Data
- **File**: `backend/seed_data.py`
- **Change**: Replaced `aci_chatgpt` with `aci_chat`
- **Tool Name**: "ACI Chat"
- **Description**: "AI-powered chat using OLLAMA (Local LLM)"
- **Route**: `/dashboard/tools/aci-chat`

#### Updated Dependencies
- **File**: `backend/app/core/deps.py`
- **Change**: Replaced `require_aci_chatgpt` with `require_aci_chat`

#### Updated Tool Routes
- **File**: `backend/app/routers/tools.py`
- **Changes**:
  - Replaced ChatGPT endpoints with ACI Chat endpoints
  - Added URL to response: `http://acidashboard.aci.local:4000`
  - Updated access control to use `require_aci_chat`

### 4. Frontend Dashboard Updates

#### Updated Tool Display
- **File**: `frontend/app/dashboard/page.tsx`
- **Changes**:
  - Replaced `aci_chatgpt` case with `aci_chat`
  - Updated href to `http://acidashboard.aci.local:4000/`
  - Updated title to "ACI Chat"
  - Updated description to "AI-powered chat using OLLAMA (Local LLM)"

### 5. Startup Scripts

#### ACI Dashboard Startup Script
- **File**: `start-dashboard.sh` (NEW)
- **Purpose**: Easy startup of ACI Dashboard
- **Usage**: `./start-dashboard.sh`

#### ACI Chat Startup Script
- **File**: `~/OLLAMA WEBUI/start-aci-chat.sh` (NEW)
- **Purpose**: Easy startup of OLLAMA WebUI
- **Usage**: `./start-aci-chat.sh`

### 6. Documentation

#### Port Configuration Guide
- **File**: `README-PORTS.md` (NEW)
- **Content**: Complete port mapping and troubleshooting guide

## Port Summary

| Service | Port | Access URL | Type |
|---------|------|------------|------|
| **ACI Dashboard** | 2005 | http://acidashboard.aci.local:2005 | Main Entry (Nginx) |
| Frontend (Next.js) | 3000 | Internal only | Proxied via Nginx |
| Backend API | 2003 | http://acidashboard.aci.local:2003 | REST API |
| PostgreSQL | 2001 | Internal only | Database |
| Redis | 2002 | Internal only | Cache |
| **ACI Chat** | 4000 | http://acidashboard.aci.local:4000 | OLLAMA WebUI |
| OLLAMA API | 11434 | http://localhost:11434 | LLM Backend |
| BOM Compare | 8081 | http://acidashboard.aci.local:8081 | Tool |

## Next Steps

### 1. Update Database
You need to run the seed script to update the database with the new tool configuration:

```bash
cd ~/ACI-DASHBOARD/backend
source ../.venv/bin/activate
python seed_data.py
```

### 2. Start ACI Dashboard
```bash
cd ~/ACI-DASHBOARD
./start-dashboard.sh
```

### 3. Start ACI Chat
```bash
cd ~/OLLAMA\ WEBUI
./start-aci-chat.sh
```

### 4. Update /etc/hosts (REQUIRED)
Make sure your hosts file has the correct entry:
```bash
sudo sh -c 'echo "127.0.0.1 acidashboard.aci.local" >> /etc/hosts'
```

**Note**: You can also access the dashboard via `http://localhost:2005` if you prefer not to configure /etc/hosts.

### 5. First Time OLLAMA Setup
After starting ACI Chat for the first time:
1. Open http://acidashboard.aci.local:4000
2. Create an admin account
3. Pull a model: `ollama pull llama2` or `ollama pull mistral`
4. Start chatting!

## Testing Checklist

- [ ] Access ACI Dashboard at http://acidashboard.aci.local:2005
- [ ] Login with existing credentials
- [ ] Verify all tools are visible on dashboard
- [ ] Click "ACI Chat" tool - should open http://acidashboard.aci.local:4000
- [ ] Verify OLLAMA WebUI loads correctly
- [ ] Test chat functionality with a local model

## Rollback Information

If you need to rollback any changes, the previous configuration was:
- Main dashboard accessed on port 80 (via nginx)
- Tool was called `aci_chatgpt` instead of `aci_chat`
- No OLLAMA integration

All changes are in version control. Use `git diff` to see changes.

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify ports are not in use: `sudo netstat -tulpn | grep -E ':(2005|4000)'`
3. Check service status: `docker-compose ps`
4. Restart services: `docker-compose restart`

---

**Configuration Date**: October 6, 2025
**Configured By**: Claude Code Assistant
