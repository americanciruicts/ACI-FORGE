# ACI FORGE

ACI FORGE is a full-stack enterprise dashboard and tool management platform built for American Circuits Inc. It provides centralized authentication, user management, tool access control, SSO integration, and maintenance request tracking.

## Tech Stack

- **Frontend**: Next.js / React with Tailwind CSS
- **Backend**: Python FastAPI
- **Database**: PostgreSQL 15 (shared via ACI consolidated database)
- **Cache**: Redis
- **Reverse Proxy**: Nginx
- **Deployment**: Docker Compose (self-hosted) + Vercel (frontend & serverless API)
- **Tunnel**: Cloudflare Tunnel for secure external access

## Features

- **Authentication & Sessions** — JWT-based auth with 9-hour session timeout, login notifications, and auto-redirect on expiry
- **Single Sign-On (SSO)** — SSO endpoints for seamless login across ACI platforms (NEXUS, KOSH)
- **User Management** — Admin panel with pagination, role management (Admin, Super Admin, User), and email-based usernames
- **Tool Access Control** — Per-user tool assignment via admin interface with `/api/tools/admin/all` endpoint
- **Maintenance Requests** — Submit and track maintenance requests
- **Notifications** — In-app notification system for login events and system alerts
- **Security** — Audit logging, security hardening, and compliance with ACI Security Standards

## Project Structure

```
ACI-FORGE/
├── frontend/              # Next.js React frontend
│   ├── src/app/           # App router pages & components
│   └── Dockerfile
├── backend/
│   ├── app/
│   │   ├── routers/       # API routes (auth, users, admin, sso, tools, notifications, maintenance)
│   │   └── db/            # Database models & connection
│   ├── api/               # Vercel serverless functions
│   ├── database/          # Database utilities
│   └── Dockerfile
├── nginx/                 # Nginx reverse proxy config
├── docker-compose.yml     # Container orchestration
├── VERSION_CONTROL.md     # Version history & release notes
└── ACI Security Standards.md
```

## Services & Ports (Docker)

| Service   | Internal Port | External Port | Description                  |
|-----------|--------------|---------------|------------------------------|
| Frontend  | 3000         | 2004          | Next.js dashboard            |
| Backend   | 8000         | 2003          | FastAPI REST API             |
| Redis     | 6379         | 2002          | Session cache                |
| Nginx     | 2005         | 2005          | Reverse proxy / load balancer|

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Quick Start

```bash
# Clone the repository
git clone git@github.com:americanciruicts/ACI-FORGE.git
cd ACI-FORGE

# Start all services
docker-compose up -d --build

# Frontend available at http://localhost:2004
# Backend API at http://localhost:2003
# Nginx proxy at http://localhost:2005
```

### Environment Variables

Copy the example env files and configure:
- `backend/.env` — Database URLs, JWT secret, session settings
- `frontend/.env` — API URL configuration

## API Endpoints

| Endpoint                   | Method | Description                        |
|----------------------------|--------|------------------------------------|
| `/api/auth/login`          | POST   | User authentication                |
| `/api/auth/session`        | GET    | Validate current session           |
| `/api/users/`              | GET    | List users (admin)                 |
| `/api/tools/admin/all`     | GET    | All tools for admin assignment     |
| `/api/sso/redirect`        | GET    | SSO redirect to NEXUS/KOSH         |
| `/api/notifications/`      | GET    | User notifications                 |
| `/api/maintenance/`        | POST   | Submit maintenance request         |
| `/health`                  | GET    | Health check                       |

## Current Version

**v6.0.0** — See [VERSION_CONTROL.md](VERSION_CONTROL.md) for full release history.

## License

Proprietary — American Circuits Inc. Internal use only.
