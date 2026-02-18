# Maintenance Request Form - Final Implementation

## ✅ Form Fields (In Order)

The maintenance request form now has exactly 6 fields:

1. **Your Name** - Auto-filled from logged-in user (read-only)
2. **Subject** - Text input (required)
3. **Description** - Textarea (required)
4. **Priority** - Dropdown: Low, Medium, High, Urgent (required)
5. **Company** - Fixed value "American Circuits, Inc." (read-only)
6. **Team** - Fixed value "Internal Maintenance" (read-only)

## 📝 Form Location

**URL**: http://192.168.1.95:2005/dashboard/maintenance/submit

## 🔧 Backend Setup

### Database
- **Database**: `aci_forge` in `aci-database` container
- **Table**: `maintenance_requests`
- **New Columns Added**:
  - `company` VARCHAR(255) DEFAULT 'American Circuits, Inc.'
  - `team` VARCHAR(255) DEFAULT 'Internal Maintenance'

### API Endpoint
- **POST** `/api/maintenance-requests`
- **Requires**: Bearer token authentication
- **Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "priority": "low|medium|high|urgent",
  "company": "American Circuits, Inc.",
  "team": "Internal Maintenance"
}
```

## 📄 Pages Created

### 1. My Requests Page
- **URL**: `/dashboard/maintenance/my-requests`
- **Access**: All authenticated users
- **Features**:
  - Card layout showing user's own requests
  - Search functionality
  - Status and Priority badges
  - Shows: Name, Company, Team for each request

### 2. All Requests Page
- **URL**: `/dashboard/maintenance/all-requests`
- **Access**: Maintenance role + Superuser only
- **Features**:
  - Statistics cards (Total, Pending, In Progress, Completed)
  - Filters: Search, Status, Priority
  - Sorting: Date, Priority
  - **Pagination**: 10, 25, 50, 100 per page
  - Card layout with:
    - Subject, Description (truncated)
    - Status and Priority badges
    - Name, Company, Team
    - **View** and **Delete** buttons
  - Delete confirmation dialog

## 🔐 Access Control

- **All Users**: Can submit requests, view only their own requests
- **Maintenance Role**: Can view ALL requests + delete any request
- **Superuser Role**: Can view ALL requests + delete any request

## 🚀 How to Access

1. Navigate to: http://192.168.1.95:2005/dashboard/maintenance/submit
2. Form will show:
   - Your Name (auto-filled)
   - Subject, Description, Priority fields to fill
   - Company and Team (read-only, pre-filled)
3. Click "Submit Request"
4. Redirects to "My Requests" page after successful submission

## 📊 View Requests

### For All Users:
- Go to: **Maintenance → My Requests** in navbar
- See only your own submitted requests

### For Maintenance/Superuser:
- Go to: **Maintenance → All Requests** in navbar
- See all requests from all users
- Can delete any request with confirmation

## ✨ Key Features

- Clean, simple 6-field form
- Company and Team automatically set to American Circuits values
- Responsive card layout for viewing requests
- Pagination support for large numbers of requests
- Delete functionality with confirmation
- Role-based access control
- Real-time statistics dashboard

## 🐳 Docker Containers

All services running on:
- **Frontend**: Port 2004 (http://192.168.1.95:2004)
- **Backend**: Port 2003 (http://192.168.1.95:2003)
- **Nginx Proxy**: Port 2005 (http://192.168.1.95:2005) ← **Main access point**
- **Redis**: Port 2002

## ✅ Status

All features are implemented and containers are running. The system is ready to use!
