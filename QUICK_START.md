# 🚀 ACI Portal - Quick Start Guide

## ✅ System is Ready!

Your ACI Portal with Maintenance Request System is **fully operational**.

---

## 🌐 Access Your Application

**Main URL:** http://192.168.1.95:2005

---

## 📝 Submit a Maintenance Request

1. Login to the portal
2. Click **"Maintenance"** in the navbar
3. Fill out the form:
   - Title & Description (required)
   - Priority level
   - Equipment & location
   - Maintenance dates & cycle
   - Warranty information
   - Parts tracking
   - File attachments
4. Click **"Submit Request"**

✅ Email automatically sent to all superusers!

---

## 👥 User Roles

| Role | Can Do |
|------|--------|
| **All Users** | Submit requests, view own submissions |
| **Maintenance** | View ALL requests, update status |
| **Superuser** | Everything + manage users + delete requests |

### Assign Maintenance Role:
1. Login as superuser
2. Go to "User Management"
3. Edit user → Add "maintenance" role → Save

---

## 🛠️ What's Included

✅ Complete backend API (10 endpoints)
✅ Database table for requests
✅ Email notifications to superusers
✅ File upload (images, PDFs, docs)
✅ Beautiful responsive form
✅ Role-based permissions
✅ SMTP configured (smtp.americancircuits.com:25)

---

## 📊 System Status

All containers are **healthy** and running:
- ✅ Backend (Port 2003)
- ✅ Frontend (Port 2004)
- ✅ Nginx (Port 2005)
- ✅ Redis (Port 2002)
- ✅ Database (Connected)

---

## 🔧 Quick Commands

### View Logs:
```bash
docker-compose logs -f
```

### Restart Services:
```bash
docker-compose restart
```

### Check Status:
```bash
docker-compose ps
```

---

## 📚 Documentation

- Full Setup Guide: `MAINTENANCE_SYSTEM_COMPLETE.md`
- System Status: `SYSTEM_STATUS.md`
- Implementation Plan: `MAINTENANCE_REQUEST_PLAN.md`

---

## 🎯 Ready to Go!

**Start using your maintenance system now:**

1. Go to http://192.168.1.95:2005
2. Login
3. Click "Maintenance"
4. Submit your first request!

---

**Questions?** Check the documentation files or view logs for troubleshooting.

🎉 **Congratulations! Your system is production-ready!**
