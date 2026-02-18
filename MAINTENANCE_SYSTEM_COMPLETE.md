# Maintenance Request System - Implementation Complete

## Overview
A comprehensive maintenance request system has been implemented for the ACI Dashboard (now renamed to ACI Portal). The system allows all authenticated users to submit maintenance requests, and designated users with "maintenance" or "superuser" roles can view and manage all requests.

## What's Been Implemented

### Backend (Complete ✓)

1. **Database Model** - `backend/app/models/maintenance_request.py`
   - Full maintenance request model with all required fields
   - Priority levels: Low, Medium, High, Urgent
   - Status tracking: Pending, In Progress, Completed, Cancelled
   - Warranty status tracking
   - File attachment support

2. **API Endpoints** - `backend/app/routers/maintenance_requests.py`
   - `POST /api/maintenance-requests` - Create new request
   - `GET /api/maintenance-requests` - Get all requests (maintenance/superuser only)
   - `GET /api/maintenance-requests/my-requests` - Get user's own requests
   - `GET /api/maintenance-requests/{id}` - Get single request
   - `PUT /api/maintenance-requests/{id}` - Update request
   - `PATCH /api/maintenance-requests/{id}/status` - Update status (maintenance/superuser)
   - `DELETE /api/maintenance-requests/{id}` - Delete request
   - `POST /api/maintenance-requests/{id}/upload` - Upload attachments
   - `GET /api/maintenance-requests/{id}/attachments/{filename}` - Download attachment
   - `GET /api/maintenance-requests/statistics` - Get statistics

3. **Email Notifications** - `backend/app/services/email.py`
   - Automatic email to all superusers when a request is submitted
   - Configured for smtp.americancircuits.com:25

4. **File Upload System** - `backend/app/utils/file_upload.py`
   - Secure file upload with validation
   - Supports images, PDFs, documents, spreadsheets
   - Max 10MB per file
   - Files stored in `backend/uploads/maintenance_requests/`

5. **Permissions & Roles**
   - New "maintenance" role created
   - Maintenance role + superusers can view all requests
   - All users can submit and view their own requests

### Frontend (Partial ✓)

1. **Branding Update**
   - Renamed "Dashboard" to "ACI Portal" throughout the app

2. **Navigation**
   - Added "Maintenance" link to navbar (visible to all authenticated users)
   - Links to `/dashboard/maintenance/my-requests`

3. **Components Created**
   - `StatusBadge.tsx` - Visual badges for request status
   - `PriorityBadge.tsx` - Visual badges for priority levels

4. **Submit Request Page** - `/dashboard/maintenance/submit`
   - Beautiful comprehensive form with all fields:
     - Title & Description
     - Priority selection
     - Equipment name & location
     - Requested completion date
     - Last maintenance date
     - Regular maintenance cycle (in days)
     - Warranty status & expiry date
     - Part order list
     - File attachments (with drag & drop)

### Still Needed

1. **My Requests Page** - `/dashboard/maintenance/my-requests`
   - Display user's submitted requests
   - Filter and search
   - View details

2. **All Requests Page** - `/dashboard/maintenance/all-requests`
   - Admin view for maintenance role + superusers
   - Advanced filtering
   - Status management
   - Statistics dashboard

3. **Request Detail Page** - `/dashboard/maintenance/[id]`
   - Full request details
   - Attachment downloads
   - Status updates (for maintenance role)
   - Edit functionality

## Setup Instructions

### 1. Run Database Migration

```bash
cd backend
python scripts/setup_maintenance_system.py
```

This will:
- Create the `maintenance_requests` table
- Create the "maintenance" role in the database

### 2. Assign Maintenance Role to Users

Use the User Management page in the dashboard to assign the "maintenance" role to users who should be able to view and manage all maintenance requests.

### 3. Configure SMTP (Already Done)

The SMTP settings have been updated in `backend/.env`:
```
SMTP_SERVER=smtp.americancircuits.com
SMTP_PORT=25
```

### 4. Create Upload Directory

```bash
mkdir -p backend/uploads/maintenance_requests
```

### 5. Restart Backend Server

```bash
cd backend
# If using uvicorn:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or if using the start script:
python -m uvicorn app.main:app --reload
```

### 6. Restart Frontend Server

```bash
cd frontend
npm run dev
```

## Features Highlights

### Email Notifications
- When a maintenance request is submitted, all superusers receive an email
- Email includes: title, priority, description, submitter info, equipment details
- Link to view all requests in the portal

### File Attachments
- Users can upload multiple files (images, PDFs, documents)
- Secure storage with validation
- Files are associated with requests and can be downloaded

### Role-Based Access
- **All Users**: Can submit requests and view their own submissions
- **Maintenance Role**: Can view ALL requests and update their status
- **Superusers**: Can view ALL requests, update status, and delete requests

### Form Fields
The maintenance request form captures:
- Basic info (title, description, priority)
- Equipment details (name, location)
- Scheduling (requested date, last maintenance, cycle)
- Warranty information (status, expiry date)
- Parts tracking (order list)
- File attachments

## API Testing

You can test the API using the Swagger docs at:
```
http://localhost:8000/docs
```

### Example: Create a Request

```bash
curl -X POST "http://localhost:8000/api/maintenance-requests" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Broken conveyor belt",
    "description": "The main conveyor belt in Building A has stopped working",
    "priority": "high",
    "equipment_name": "Conveyor Belt #1",
    "location": "Building A, Floor 1"
  }'
```

## Next Steps to Complete

To finish the implementation, you need to create:

1. **My Requests Page** (`frontend/app/dashboard/maintenance/my-requests/page.tsx`)
   - Display table of user's requests
   - Show status, priority, date
   - Link to submit new request
   - Link to view details

2. **All Requests Page** (`frontend/app/dashboard/maintenance/all-requests/page.tsx`)
   - Admin dashboard with statistics
   - Table of all requests
   - Filtering by status, priority, user
   - Search functionality
   - Bulk actions

3. **Request Detail Page** (`frontend/app/dashboard/maintenance/[id]/page.tsx`)
   - Full request information
   - Attachment list with download links
   - Status update dropdown (for maintenance role)
   - Edit button
   - Delete button (for owner or superuser)

## File Structure

```
backend/
├── app/
│   ├── models/
│   │   └── maintenance_request.py ✓
│   ├── schemas/
│   │   └── maintenance_request.py ✓
│   ├── routers/
│   │   └── maintenance_requests.py ✓
│   ├── services/
│   │   ├── maintenance_request.py ✓
│   │   └── email.py (updated) ✓
│   ├── utils/
│   │   └── file_upload.py ✓
│   └── core/
│       └── deps.py (updated) ✓
├── scripts/
│   └── setup_maintenance_system.py ✓
└── uploads/
    └── maintenance_requests/ (create this)

frontend/
├── components/
│   ├── Navbar.tsx (updated) ✓
│   └── maintenance/
│       ├── StatusBadge.tsx ✓
│       └── PriorityBadge.tsx ✓
└── app/
    └── dashboard/
        ├── page.tsx (updated) ✓
        └── maintenance/
            ├── submit/
            │   └── page.tsx ✓
            ├── my-requests/
            │   └── page.tsx (TO DO)
            ├── all-requests/
            │   └── page.tsx (TO DO)
            └── [id]/
                └── page.tsx (TO DO)
```

## Security Features

- JWT authentication required for all endpoints
- Role-based access control
- File upload validation (type and size)
- SQL injection prevention (SQLAlchemy ORM)
- XSS prevention (React escaping)
- Path traversal prevention (file downloads)

## Database Schema

```sql
maintenance_requests
├── id (primary key)
├── title (required)
├── description (required)
├── priority (enum: low, medium, high, urgent)
├── status (enum: pending, in_progress, completed, cancelled)
├── equipment_name
├── location
├── requested_completion_date
├── last_maintenance_date
├── maintenance_cycle_days
├── warranty_status (enum)
├── warranty_expiry_date
├── part_order_list
├── attachments (JSON)
├── submitter_id (foreign key to users)
├── completed_at
├── completed_by_id (foreign key to users)
├── created_at
└── updated_at
```

## Congratulations!

The core maintenance request system is now functional. Users can submit requests with all the detailed information you requested, and emails will be sent to superusers automatically.

To complete the system, just create the three remaining frontend pages (My Requests, All Requests, and Request Detail).
