# Version Control Documentation

## Current Version: v6.0.0

### Release Information
- **Release Date**: 2026-04-07
- **Version**: 6.0.0
- **Status**: Active Development

### Version History

#### v6.0.0 (2026-04-07)
- **NEW**: Added `/api/tools/admin/all` endpoint for user management tool assignment
- **FIXED**: Auth flash and session timeout — redirect to login immediately, 9-hour session
- **FIXED**: Vercel build by removing outputDirectory from vercel.json
- **NEW**: SSO redirect after FORGE login for NEXUS and KOSH platforms
- **IMPROVED**: Security hardening, audit logging, and UI improvements across full stack
- **UPDATED**: Session timeout set to 8 hours across all layers with Vercel deployment trigger
- **NEW**: SSO endpoints and login notifications added to Vercel backend
- **UPDATED**: Vercel.json with new Cloudflare tunnel URL for backend API
- **IMPROVED**: Super Admin role display in navbar and profile
- **NEW**: Pagination added to user management page
- **NEW**: SSO notifications, email-based usernames, and notification page improvements
- **UPDATED**: Vercel deployment setup and patches
- **REBRANDED**: ACI DASHBOARD renamed to ACI FORGE
- **RESTRUCTURED**: Project files moved from subdirectory to root
- **ADDED**: README.md with full project documentation

#### v5.1.0 (2025-09-22)
- Updated package.json versions to 5.1.0
- Implemented version control documentation system
- Rebuilt Docker containers with new version
- Fixed port conflicts — moved BOMCompare to port 8081
- **FIXED**: Resolved "failed to fetch" error by seeding database tables
- **FIXED**: Database tables created and populated with 17 users
- **VERIFIED**: All API endpoints working correctly
- **VERIFIED**: Login functionality working with proper credentials
- **UPDATED**: Changed all usernames to simple first names
- All services working correctly — Website is LIVE

#### v0.1.0
- Initial release

### Project Structure
```
ACI-FORGE/
├── frontend/              # Next.js React frontend
├── backend/               # Python FastAPI backend
│   ├── app/routers/       # API routes (auth, users, admin, sso, tools, notifications, maintenance)
│   └── api/               # Vercel serverless functions
├── nginx/                 # Nginx reverse proxy
├── docker-compose.yml     # Container orchestration
├── README.md              # Project documentation
└── VERSION_CONTROL.md     # This document
```

### Change Tracking
All changes should be documented in this file following this format:

#### [Version] - [Date]
- Brief description of changes
- List of modified components
- Any breaking changes
- Dependencies updated

### Development Workflow
1. Update version numbers in package.json files
2. Document changes in this VERSION_CONTROL.md file
3. Rebuild Docker containers with new version
4. Test deployment
5. Commit changes to git

### Container Services
- **Frontend**: Next.js application (Port 2004)
- **Backend**: Python FastAPI (Port 2003)
- **Redis**: Cache service (Port 2002)
- **Nginx**: Reverse proxy (Port 2005)

### Deployment
- **Self-hosted**: Docker Compose on local server with Cloudflare Tunnel
- **Vercel**: Frontend + serverless API functions

### Notes
- Always update this document when making version changes
- Maintain backward compatibility when possible
- Test all services after version updates
