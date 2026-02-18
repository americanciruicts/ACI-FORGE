# Maintenance Request System Implementation Plan

## Overview
Implement a comprehensive maintenance request system with form submission, email notifications, file attachments, and role-based viewing capabilities. Rename the application from "Dashboard" to "ACI Portal".

## Requirements Summary
- New "maintenance" role for viewing all maintenance requests
- All authenticated users can submit requests and view their own submissions
- Superusers and maintenance role users can view all requests
- Email notifications to all superusers on submission
- Beautiful form with comprehensive fields
- File attachment support
- SMTP configuration: smtp.americancircuits.com, Port 25

---

## Implementation Steps

### Phase 1: Database Schema & Models

#### 1.1 Create Maintenance Request Model
**File:** `/backend/app/models/maintenance_request.py` (NEW)

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from datetime import datetime
import enum

class PriorityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class WarrantyStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    NOT_APPLICABLE = "not_applicable"

class MaintenanceRequest(BaseModel):
    __tablename__ = "maintenance_requests"

    # Basic fields
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM)
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING)

    # Equipment details
    equipment_name = Column(String(255))
    location = Column(String(255))

    # Date fields
    requested_completion_date = Column(DateTime)
    last_maintenance_date = Column(DateTime)
    maintenance_cycle_days = Column(Integer)  # Regular maintenance cycle in days

    # Warranty information
    warranty_status = Column(Enum(WarrantyStatus), default=WarrantyStatus.NOT_APPLICABLE)
    warranty_expiry_date = Column(DateTime)

    # Parts and tracking
    part_order_list = Column(Text)  # Can be JSON string or comma-separated

    # File attachments (store as JSON array of filenames)
    attachments = Column(Text)  # JSON array: ["file1.jpg", "file2.pdf"]

    # Relationships
    submitter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    submitter = relationship("User", back_populates="maintenance_requests")

    # Audit fields
    completed_at = Column(DateTime)
    completed_by_id = Column(Integer, ForeignKey("users.id"))
    completed_by = relationship("User", foreign_keys=[completed_by_id])
```

#### 1.2 Update User Model
**File:** `/backend/app/models/user.py` (MODIFY)
- Add relationship: `maintenance_requests = relationship("MaintenanceRequest", back_populates="submitter", foreign_keys="[MaintenanceRequest.submitter_id]")`

#### 1.3 Update Base Model Import
**File:** `/backend/app/models/__init__.py` (MODIFY)
- Add import: `from app.models.maintenance_request import MaintenanceRequest, PriorityLevel, RequestStatus, WarrantyStatus`

#### 1.4 Create Database Migration Script
**File:** `/backend/scripts/create_maintenance_role.py` (NEW)
- Create "maintenance" role in the database
- Add migration for maintenance_requests table

---

### Phase 2: Pydantic Schemas

#### 2.1 Create Maintenance Request Schemas
**File:** `/backend/app/schemas/maintenance_request.py` (NEW)

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.maintenance_request import PriorityLevel, RequestStatus, WarrantyStatus

class MaintenanceRequestBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    priority: PriorityLevel = PriorityLevel.MEDIUM
    equipment_name: Optional[str] = None
    location: Optional[str] = None
    requested_completion_date: Optional[datetime] = None
    last_maintenance_date: Optional[datetime] = None
    maintenance_cycle_days: Optional[int] = None
    warranty_status: WarrantyStatus = WarrantyStatus.NOT_APPLICABLE
    warranty_expiry_date: Optional[datetime] = None
    part_order_list: Optional[str] = None

class MaintenanceRequestCreate(MaintenanceRequestBase):
    attachments: Optional[List[str]] = []

class MaintenanceRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[PriorityLevel] = None
    status: Optional[RequestStatus] = None
    equipment_name: Optional[str] = None
    location: Optional[str] = None
    requested_completion_date: Optional[datetime] = None
    last_maintenance_date: Optional[datetime] = None
    maintenance_cycle_days: Optional[int] = None
    warranty_status: Optional[WarrantyStatus] = None
    warranty_expiry_date: Optional[datetime] = None
    part_order_list: Optional[str] = None

class MaintenanceRequestResponse(MaintenanceRequestBase):
    id: int
    status: RequestStatus
    attachments: Optional[List[str]] = []
    submitter_id: int
    submitter_email: str
    submitter_name: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    completed_by_id: Optional[int] = None

    class Config:
        from_attributes = True
```

---

### Phase 3: Backend Services

#### 3.1 Create Maintenance Request Service
**File:** `/backend/app/services/maintenance_request.py` (NEW)
- CRUD operations for maintenance requests
- File upload handling
- Permission checking (can_view_all, can_edit)
- Status update logic

#### 3.2 Update Email Service
**File:** `/backend/app/services/email.py` (MODIFY)
- Add method: `send_maintenance_request_notification(request: MaintenanceRequest, superusers: List[User])`
- Configure SMTP settings for smtp.americancircuits.com:25

#### 3.3 Update Environment Configuration
**File:** `/backend/.env` and `/backend/app/core/config.py` (MODIFY)
- Add SMTP settings:
  - SMTP_HOST=smtp.americancircuits.com
  - SMTP_PORT=25
  - SMTP_USER (if required)
  - SMTP_PASSWORD (if required)
  - MAINTENANCE_NOTIFICATION_FROM_EMAIL

---

### Phase 4: API Endpoints

#### 4.1 Create Maintenance Request Router
**File:** `/backend/app/routers/maintenance_requests.py` (NEW)

**Endpoints:**
1. `POST /api/maintenance-requests` - Create request (authenticated users)
2. `GET /api/maintenance-requests` - Get all requests (maintenance role + superuser)
3. `GET /api/maintenance-requests/my-requests` - Get user's own requests
4. `GET /api/maintenance-requests/{request_id}` - Get single request
5. `PUT /api/maintenance-requests/{request_id}` - Update request (creator or maintenance role)
6. `DELETE /api/maintenance-requests/{request_id}` - Delete request (creator or superuser)
7. `POST /api/maintenance-requests/{request_id}/upload` - Upload attachment
8. `GET /api/maintenance-requests/{request_id}/attachments/{filename}` - Download attachment
9. `PATCH /api/maintenance-requests/{request_id}/status` - Update status (maintenance role + superuser)

#### 4.2 Update Main App Router
**File:** `/backend/main.py` or `/backend/app/main.py` (MODIFY)
- Register maintenance_requests router

#### 4.3 Create Dependencies
**File:** `/backend/app/core/deps.py` (MODIFY)
- Add: `require_maintenance = require_role("maintenance")`
- Add: `require_maintenance_or_superuser()` function

---

### Phase 5: Frontend - Navbar & Branding

#### 5.1 Update Navbar Component
**File:** `/frontend/components/Navbar.tsx` (MODIFY)
- Add "Maintenance Requests" link (visible to all authenticated users)
- Update navbar items to show:
  - "ACI Portal" (home link)
  - "Maintenance Requests" (all users)
  - "Users" (superuser only)

#### 5.2 Update Page Titles
**Files to modify:**
- `/frontend/app/dashboard/page.tsx` - Change "Dashboard" to "ACI Portal"
- `/frontend/app/dashboard/users/page.tsx` - Update references
- `/frontend/app/layout.tsx` - Update metadata title
- Any other files with "Dashboard" text

---

### Phase 6: Frontend - Maintenance Request Pages

#### 6.1 Create Maintenance Request Layout
**File:** `/frontend/app/dashboard/maintenance/layout.tsx` (NEW)
- Shared layout for maintenance pages

#### 6.2 Create Submit Request Page
**File:** `/frontend/app/dashboard/maintenance/submit/page.tsx` (NEW)
- Beautiful form with all fields
- File upload component with preview
- Form validation
- Success/error notifications
- Redirect to "My Requests" after successful submission

**Form Features:**
- Multi-step form or single-page with sections
- Date pickers for date fields
- Dropdown for priority, status, warranty status
- File upload with drag-and-drop
- Character count for text fields
- Form validation with error messages

#### 6.3 Create My Requests Page
**File:** `/frontend/app/dashboard/maintenance/my-requests/page.tsx` (NEW)
- Display user's submitted requests
- Filter by status, priority, date
- Search functionality
- Table view with sorting
- View details modal/page
- Status badges with colors

#### 6.4 Create All Requests Page (Admin)
**File:** `/frontend/app/dashboard/maintenance/all-requests/page.tsx` (NEW)
- Restricted to maintenance role + superuser
- Display all maintenance requests
- Advanced filtering (by user, status, priority, date range)
- Bulk actions (status updates)
- Export to CSV
- Statistics cards (total requests, pending, completed)

#### 6.5 Create Request Detail Page
**File:** `/frontend/app/dashboard/maintenance/[id]/page.tsx` (NEW)
- Full request details
- Timeline of status changes
- Attachment download links
- Edit button (for creator or maintenance role)
- Status update form (for maintenance role + superuser)
- Comments section (future enhancement)

#### 6.6 Create Shared Components
**Files to create:**
- `/frontend/components/maintenance/MaintenanceRequestForm.tsx` - Reusable form
- `/frontend/components/maintenance/RequestCard.tsx` - Request display card
- `/frontend/components/maintenance/StatusBadge.tsx` - Status badge component
- `/frontend/components/maintenance/PriorityBadge.tsx` - Priority badge component
- `/frontend/components/maintenance/FileUpload.tsx` - File upload component
- `/frontend/components/maintenance/AttachmentList.tsx` - Attachment display/download

---

### Phase 7: File Upload Handling

#### 7.1 Create Upload Directory Structure
**Backend:**
- Create directory: `/backend/uploads/maintenance_requests/`
- Add to .gitignore

#### 7.2 File Upload Utilities
**File:** `/backend/app/utils/file_upload.py` (NEW)
- Validate file types (images, PDFs, documents)
- Validate file sizes (max 10MB per file)
- Generate unique filenames
- Save files securely
- Delete files on request deletion

#### 7.3 Static File Serving
**File:** `/backend/main.py` (MODIFY)
- Mount static files for serving attachments
- Add authentication middleware for download endpoints

---

### Phase 8: Email Notifications

#### 8.1 Email Template
**File:** `/backend/app/templates/maintenance_request_notification.html` (NEW)
- HTML email template
- Include request details
- Link to view request on portal

#### 8.2 Notification Logic
- On request creation: Send email to all superusers
- Email includes: title, priority, submitter, description preview, equipment, location
- Link to view full request in portal

---

### Phase 9: Security & Validation

#### 9.1 Input Validation
- Sanitize all text inputs
- Validate file uploads (type, size)
- Validate date ranges
- SQL injection prevention (already handled by SQLAlchemy)

#### 9.2 Authorization Checks
- Ensure users can only edit their own requests (unless maintenance role)
- File download authorization
- Prevent path traversal attacks in file downloads

#### 9.3 Rate Limiting
- Add rate limiting to submission endpoint (prevent spam)

---

### Phase 10: Testing & Documentation

#### 10.1 API Testing
- Test all endpoints with different roles
- Test file upload/download
- Test email notifications

#### 10.2 Frontend Testing
- Test form submission
- Test file uploads
- Test role-based visibility
- Mobile responsiveness

#### 10.3 Documentation
**File:** `/MAINTENANCE_REQUEST_DOCS.md` (NEW)
- User guide for submitting requests
- Admin guide for managing requests
- API documentation

---

## Implementation Order

1. **Database & Models** (Phase 1)
   - Create maintenance_request model
   - Create migration script
   - Seed "maintenance" role

2. **Backend API** (Phases 2-4)
   - Create schemas
   - Create service layer
   - Create API endpoints
   - Update email service
   - Test API with Postman/curl

3. **File Upload** (Phase 7)
   - Implement file upload utilities
   - Test file handling

4. **Email Notifications** (Phase 8)
   - Configure SMTP
   - Create email template
   - Test email sending

5. **Frontend - Branding** (Phase 5)
   - Rename Dashboard to ACI Portal
   - Update navbar

6. **Frontend - Pages** (Phase 6)
   - Create form page
   - Create my requests page
   - Create all requests page (admin)
   - Create detail page
   - Create shared components

7. **Security & Polish** (Phase 9)
   - Add validation
   - Add authorization checks
   - Add rate limiting

8. **Testing** (Phase 10)
   - End-to-end testing
   - Bug fixes
   - Documentation

---

## Files Summary

### New Files (26)
**Backend:**
1. `/backend/app/models/maintenance_request.py`
2. `/backend/app/schemas/maintenance_request.py`
3. `/backend/app/services/maintenance_request.py`
4. `/backend/app/routers/maintenance_requests.py`
5. `/backend/app/utils/file_upload.py`
6. `/backend/app/templates/maintenance_request_notification.html`
7. `/backend/scripts/create_maintenance_role.py`
8. `/backend/uploads/maintenance_requests/` (directory)

**Frontend:**
9. `/frontend/app/dashboard/maintenance/layout.tsx`
10. `/frontend/app/dashboard/maintenance/submit/page.tsx`
11. `/frontend/app/dashboard/maintenance/my-requests/page.tsx`
12. `/frontend/app/dashboard/maintenance/all-requests/page.tsx`
13. `/frontend/app/dashboard/maintenance/[id]/page.tsx`
14. `/frontend/components/maintenance/MaintenanceRequestForm.tsx`
15. `/frontend/components/maintenance/RequestCard.tsx`
16. `/frontend/components/maintenance/StatusBadge.tsx`
17. `/frontend/components/maintenance/PriorityBadge.tsx`
18. `/frontend/components/maintenance/FileUpload.tsx`
19. `/frontend/components/maintenance/AttachmentList.tsx`

**Documentation:**
20. `/MAINTENANCE_REQUEST_DOCS.md`

### Modified Files (12)
**Backend:**
1. `/backend/app/models/user.py` - Add maintenance_requests relationship
2. `/backend/app/models/__init__.py` - Import MaintenanceRequest
3. `/backend/app/services/email.py` - Add notification method
4. `/backend/app/core/config.py` - Add SMTP settings
5. `/backend/app/core/deps.py` - Add maintenance role dependency
6. `/backend/.env` - Add SMTP configuration
7. `/backend/main.py` - Register router, mount static files

**Frontend:**
8. `/frontend/components/Navbar.tsx` - Add maintenance link
9. `/frontend/app/dashboard/page.tsx` - Rename to "ACI Portal"
10. `/frontend/app/dashboard/users/page.tsx` - Update references
11. `/frontend/app/layout.tsx` - Update metadata
12. `/frontend/.env.local` or `/frontend/next.config.js` - API URL if needed

---

## Database Schema

```sql
CREATE TABLE maintenance_requests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    equipment_name VARCHAR(255),
    location VARCHAR(255),
    requested_completion_date TIMESTAMP,
    last_maintenance_date TIMESTAMP,
    maintenance_cycle_days INTEGER,
    warranty_status VARCHAR(20) DEFAULT 'not_applicable',
    warranty_expiry_date TIMESTAMP,
    part_order_list TEXT,
    attachments TEXT,
    submitter_id INTEGER NOT NULL REFERENCES users(id),
    completed_at TIMESTAMP,
    completed_by_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maintenance_requests_submitter ON maintenance_requests(submitter_id);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_priority ON maintenance_requests(priority);
CREATE INDEX idx_maintenance_requests_created_at ON maintenance_requests(created_at);
```

---

## Key Design Decisions

1. **Role Strategy**: Created dedicated "maintenance" role rather than overloading existing roles
2. **File Storage**: Local filesystem storage (can be upgraded to S3 later)
3. **Attachment Storage**: JSON array in database column (simple for small number of files)
4. **Status Workflow**: Simple status enum (can be enhanced with workflow engine later)
5. **Email Service**: Reuse existing email service infrastructure
6. **UI Pattern**: Follow existing glass-card design system from User Management page
7. **Routing**: Use /dashboard/maintenance/* for all maintenance-related pages
8. **Authorization**: Combination of role-based and ownership-based access control

---

## Estimated Complexity

- **Backend**: Medium complexity (~800-1000 lines of code)
- **Frontend**: High complexity (~1200-1500 lines of code across multiple components)
- **Total Files**: 38 files (26 new, 12 modified)
- **Key Challenges**:
  - File upload handling with security
  - Email configuration and testing
  - Complex form with many fields
  - Role-based access control across multiple pages

---

## Next Steps After Approval

1. Start with database model and migration
2. Build backend API with testing
3. Configure email service
4. Build frontend pages incrementally
5. Integration testing
6. Deployment
