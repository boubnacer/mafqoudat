# System Settings - Quick Reference

## 🚀 Quick Start

### Initialize
```bash
cd server
node scripts/initializeSystemSettings.js
```

---

## 📡 API Endpoints

### Public
```
GET  /api/system/settings              # Get all settings
GET  /api/system/maintenance-status    # Get maintenance status only
```

### Admin Only
```
PUT  /api/system/maintenance-mode      # Update maintenance mode
POST /api/system/maintenance-mode/toggle  # Quick on/off toggle
POST /api/system/initialize            # Initialize settings
GET  /api/system/verify-singleton      # Verify integrity
```

---

## 💻 Code Examples

### Check Maintenance Status
```javascript
const SystemSettings = require("./models/SystemSettings");

const isActive = await SystemSettings.isMaintenanceModeActive();
```

### Get Settings
```javascript
const settings = await SystemSettings.getInstance();
console.log(settings.maintenanceMode.isActive);
```

### Update Maintenance Mode
```javascript
await SystemSettings.updateMaintenanceMode(
  true,           // isActive
  "Custom msg",   // message
  "2 hours",      // estimatedReturn
  adminUserId     // who updated
);
```

### Toggle Maintenance
```javascript
const settings = await SystemSettings.getInstance();
await settings.toggleMaintenanceMode(adminUserId);
```

---

## 🧪 Test with cURL

### Get Status
```bash
curl http://localhost:3500/api/system/maintenance-status
```

### Enable Maintenance
```bash
curl -X PUT http://localhost:3500/api/system/maintenance-mode \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true, "message": "Maintenance in progress"}'
```

### Toggle
```bash
curl -X POST http://localhost:3500/api/system/maintenance-mode/toggle \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📊 Database

### Collection
```
systemsettings
```

### Document Structure
```javascript
{
  _id: ObjectId("..."),
  maintenanceMode: {
    isActive: false,
    message: "We're currently performing scheduled maintenance...",
    estimatedReturn: "soon",
    lastUpdatedBy: ObjectId("..."),
    lastUpdatedAt: Date
  },
  singleton: "system_settings",
  createdAt: Date,
  updatedAt: Date
}
```

### MongoDB Query
```javascript
db.systemsettings.find().pretty()
```

---

## 🔧 Maintenance Workflow

### Enable Maintenance
```bash
# 1. Admin logs in
curl -X POST http://localhost:3500/auth/login \
  -d '{"username":"admin","password":"pass"}'

# 2. Enable maintenance
curl -X PUT http://localhost:3500/api/system/maintenance-mode \
  -H "Authorization: Bearer TOKEN" \
  -d '{"isActive": true}'

# 3. Verify
curl http://localhost:3500/api/system/maintenance-status
```

### Perform Maintenance
```bash
# Do your maintenance tasks here
# - Database migrations
# - Deploy new code
# - etc.
```

### Disable Maintenance
```bash
curl -X PUT http://localhost:3500/api/system/maintenance-mode \
  -H "Authorization: Bearer TOKEN" \
  -d '{"isActive": false}'
```

---

## 🔒 Security

**Admin Required:**
- Update maintenance mode
- Toggle maintenance mode
- Initialize settings
- Verify singleton

**Public Access:**
- Get settings (read-only)
- Get maintenance status

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Multiple documents | Run: `node scripts/initializeSystemSettings.js` |
| Cannot update | Check admin token and role |
| 404 errors | Verify route is added to server.js |
| Document not found | Run initialization script |

---

## 📚 Full Documentation

See `SYSTEM_SETTINGS_GUIDE.md` for complete documentation.

---

## ✅ Checklist

- [ ] Run initialization script
- [ ] Verify document exists in MongoDB
- [ ] Test GET endpoints
- [ ] Test admin endpoints
- [ ] Verify singleton (only 1 document)
- [ ] Test maintenance mode on/off
- [ ] Update middleware to use database
- [ ] Deploy to production

---

**Quick commands:**

```bash
# Initialize
node scripts/initializeSystemSettings.js

# Test
curl http://localhost:3500/api/system/maintenance-status

# Enable (with token)
curl -X POST http://localhost:3500/api/system/maintenance-mode/toggle \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

That's it! System settings are ready to use. 🎉

