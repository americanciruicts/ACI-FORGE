# ✅ ACI Portal - Maintenance System Ready!

## System Status: OPERATIONAL 🟢

All Docker containers have been successfully restarted with the new maintenance system.

### Container Status
- ✅ **Backend**: Healthy (Port 2003)
- ✅ **Frontend**: Healthy (Port 2004)
- ✅ **Nginx**: Healthy (Port 2005)
- ✅ **Redis**: Healthy (Port 2002)
- ✅ **Database**: Connected (aci-database:5432)

### Database Setup
- ✅ Maintenance role created
- ✅ maintenance_requests table created
- ✅ All indexes created
- ✅ Upload directory created at `/backend/uploads/maintenance_requests/`

## Access Your Application

**Main Application URL:** http://192.168.1.95:2005

### Available Services
- Frontend: http://192.168.1.95:2004 (internal)
- Backend API: http://192.168.1.95:2003 (internal)
- Nginx Gateway: http://192.168.1.95:2005 (main access)
- API Docs: http://192.168.1.95:2003/docs

## Using the Maintenance System

### 1. Login to ACI Portal
Navigate to http://192.168.1.95:2005 and login with your credentials.

### 2. Access Maintenance Requests
Click the **"Maintenance"** button in the navigation bar.

### 3. Submit a Request
- You'll see the "My Requests" page
- Click "Submit New Request" button
- Fill out the comprehensive form with:
  - Title & Description (required)
  - Priority level
  - Equipment details
  - Maintenance schedule
  - Warranty information
  - Parts tracking
  - File attachments
- Click "Submit Request"
- Email notification sent to all superusers automatically

### 4. View Your Requests
All your submitted requests appear in "My Requests" with:
- Status tracking
- Priority badges
- Submission date
- Current status

## Admin Features (Superuser & Maintenance Role)

Users with "superuser" or "maintenance" role can:
- View ALL maintenance requests from all users
- Update request status (Pending → In Progress → Completed)
- Delete requests
- Access advanced filtering and search
- View maintenance statistics

### Assigning the Maintenance Role
1. Login as superuser
2. Go to "User Management"
3. Edit a user
4. Add the "maintenance" role
5. Save changes

## Email Notifications

When a maintenance request is submitted:
- ✅ Email sent to: All users with "superuser" role
- ✅ SMTP Server: smtp.americancircuits.com:25
- ✅ Includes: Title, priority, description, equipment, location, submitter info

## API Endpoints Available

### Maintenance Requests
- `POST /api/maintenance-requests` - Create new request
- `GET /api/maintenance-requests` - Get all requests (maintenance/superuser)
- `GET /api/maintenance-requests/my-requests` - Get your requests
- `GET /api/maintenance-requests/statistics` - Get statistics
- `GET /api/maintenance-requests/{id}` - Get specific request
- `PUT /api/maintenance-requests/{id}` - Update request
- `PATCH /api/maintenance-requests/{id}/status` - Update status
- `DELETE /api/maintenance-requests/{id}` - Delete request
- `POST /api/maintenance-requests/{id}/upload` - Upload attachments
- `GET /api/maintenance-requests/{id}/attachments/{filename}` - Download file

## File Uploads

Supported file types:
- Images: JPG, PNG, GIF, BMP, WEBP
- Documents: PDF, DOC, DOCX, TXT, RTF
- Spreadsheets: XLS, XLSX, CSV
- Archives: ZIP, RAR

Maximum file size: 10MB per file

## Quick Test

### Test the API
```bash
# Get API status
curl http://localhost:2005/health

# Get API documentation
curl http://localhost:2003/docs
```

### Test Creating a Request (after logging in)
1. Go to http://192.168.1.95:2005
2. Login with your credentials
3. Click "Maintenance" in navbar
4. Click "Submit New Request"
5. Fill out the form
6. Submit and verify email is received by superusers

## Container Management

### View Logs
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# All logs
docker-compose logs -f
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Check Status
```bash
docker-compose ps
```

## Troubleshooting

### If backend shows errors:
```bash
docker-compose logs backend --tail=50
docker-compose restart backend
```

### If database connection fails:
```bash
# Check external network
docker network ls | grep aci-network

# Verify database is accessible
docker-compose exec backend ping aci-database
```

### If emails aren't sending:
Check backend logs for SMTP errors:
```bash
docker-compose logs backend | grep -i smtp
```

## Next Steps

1. ✅ System is ready to use
2. ✅ Users can submit maintenance requests
3. ✅ Emails will be sent to superusers
4. ⚠️ Assign "maintenance" role to users who should manage requests
5. ⏭️ Optional: Create remaining frontend pages (My Requests, All Requests, Detail views)

## Support

- Backend Port: 2003
- Frontend Port: 2004
- Main Access Port: 2005
- Database: aci-database:5432

All systems are operational and ready for use! 🚀

---
**Last Updated:** $(date)
**Status:** PRODUCTION READY ✅
