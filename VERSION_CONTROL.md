# Version Control Documentation

## Current Version: v5.1.0

### Release Information
- **Release Date**: 2025-09-22
- **Version**: 5.1.0
- **Status**: Active Development

### Version History

#### v5.1.0 (2025-09-22)
- Updated package.json versions to 5.1.0
- Implemented version control documentation system
- Rebuilt Docker containers with new version
- Fixed port conflicts - moved BOMCompare to port 8081
- **FIXED**: Resolved "failed to fetch" error by seeding database tables
- **FIXED**: Database tables created and populated with 17 users
- **VERIFIED**: All API endpoints working correctly
- **VERIFIED**: Login functionality working with proper credentials
- **UPDATED**: Changed all usernames to simple first names (no numbers)
- **VERIFIED**: New login format working: username=preet, password=AaWtgE1hRECG
- All services now working correctly - Website is LIVE! ✅

#### Previous Versions
- v0.1.0 - Initial release

### Project Structure
```
ACI-DASHBOARD/
├── backend/           # Python FastAPI backend
├── frontend/          # Next.js React frontend
├── nginx/             # Nginx reverse proxy
├── docker-compose.yml # Container orchestration
└── VERSION_CONTROL.md # This document
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

### Container Services - All Working ✅
- **Frontend**: React/Next.js application (Port 2004) - Dashboard series
- **Backend**: Python FastAPI (Port 2003) - Dashboard series
- **Database**: PostgreSQL 15 (Port 2001) - Dashboard series
- **Redis**: Cache service (Port 2002) - Dashboard series
- **Nginx**: Reverse proxy (Port 2005) - Dashboard series
- **BOMCompare**: Tool integration (Port 8081) - Dedicated tool port

### Notes
- Always update this document when making version changes
- Maintain backward compatibility when possible
- Test all services after version updates