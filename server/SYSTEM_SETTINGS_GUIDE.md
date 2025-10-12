# System Settings Database Guide

## Overview

The System Settings module provides a database-driven configuration system for application-wide settings, starting with maintenance mode management. This replaces environment variable-based maintenance mode with a more flexible database solution.

---

## 📁 Files Created

### Model
- **`server/models/SystemSettings.js`** - Database model with singleton pattern

### Controller
- **`server/controllers/systemController.js`** - API endpoints for managing settings

### Routes
- **`server/routes/systemRoutes.js`** - Route definitions

### Scripts
- **`server/scripts/initializeSystemSettings.js`** - Initialization and verification script

---

## 🏗️ Architecture

### Singleton Pattern

The SystemSettings model uses a **singleton pattern** to ensure only one configuration document exists in the database:

```javascript
// Singleton identifier
singleton: {
  type: String,
  default: "system_settings",
  unique: true,
  immutable: true
}
```

### Key Features

✅ **Auto-creation** - Document is created automatically if it doesn't exist  
✅ **Singleton enforcement** - Only one document can exist  
✅ **Audit trail** - Tracks who made changes and when  
✅ **Default values** - Sensible defaults for all settings  
✅ **Verification** - Built-in integrity checking  
✅ **Prevention** - Cannot delete the singleton document  

---

## 📊 Database Schema

```javascript
{
  maintenanceMode: {
    isActive: Boolean,              // Is maintenance mode enabled?
    message: String,                // Message to display to users
    estimatedReturn: String,        // "soon", "2 hours", etc.
    lastUpdatedBy: ObjectId,        // Reference to User who made change
    lastUpdatedAt: Date            // When the change was made
  },
  singleton: String,                // Always "system_settings"
  createdAt: Date,                 // Auto-generated
  updatedAt: Date                  // Auto-generated
}
```

---

## 🚀 Setup & Initialization

### Step 1: Run Initialization Script

```bash
cd server
node scripts/initializeSystemSettings.js
```

This script will:
1. Connect to the database
2. Verify singleton integrity
3. Create the document if it doesn't exist
4. Remove any duplicate documents
5. Display current settings
6. Test static methods

### Step 2: Verify in MongoDB

```javascript
// MongoDB Shell
use your_database_name
db.systemsettings.find().pretty()

// Expected output:
{
  "_id": ObjectId("..."),
  "maintenanceMode": {
    "isActive": false,
    "message": "We're currently performing scheduled maintenance. We'll be back soon! Thank you for your patience.",
    "estimatedReturn": "soon",
    "lastUpdatedBy": null,
    "lastUpdatedAt": null
  },
  "singleton": "system_settings",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("..."),
  "__v": 0
}
```

---

## 🔌 API Endpoints

### Public Endpoints

#### Get System Settings
```http
GET /api/system/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "maintenanceMode": {
      "isActive": false,
      "message": "We're currently performing scheduled maintenance...",
      "estimatedReturn": "soon",
      "lastUpdatedBy": "admin",
      "lastUpdatedAt": "2025-01-12T10:30:00.000Z"
    },
    "lastUpdated": "2025-01-12T10:30:00.000Z"
  }
}
```

#### Get Maintenance Status (Lightweight)
```http
GET /api/system/maintenance-status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isActive": false,
    "message": "We're currently performing scheduled maintenance...",
    "estimatedReturn": "soon"
  }
}
```

### Admin-Only Endpoints

**All admin endpoints require:**
- Valid JWT token in `Authorization: Bearer <token>` header
- User role must be `'admin'`

#### Update Maintenance Mode
```http
PUT /api/system/maintenance-mode
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "isActive": true,
  "message": "Scheduled maintenance in progress. We'll be back at 2 PM EST.",
  "estimatedReturn": "2 PM EST"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Maintenance mode enabled successfully",
  "data": {
    "maintenanceMode": {
      "isActive": true,
      "message": "Scheduled maintenance in progress...",
      "estimatedReturn": "2 PM EST",
      "lastUpdatedBy": "admin",
      "lastUpdatedAt": "2025-01-12T10:30:00.000Z"
    }
  }
}
```

#### Toggle Maintenance Mode (Quick Switch)
```http
POST /api/system/maintenance-mode/toggle
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Maintenance mode enabled successfully",
  "data": {
    "maintenanceMode": {
      "isActive": true,
      "message": "We're currently performing scheduled maintenance...",
      "estimatedReturn": "soon",
      "lastUpdatedBy": "admin",
      "lastUpdatedAt": "2025-01-12T10:30:00.000Z"
    }
  }
}
```

#### Initialize System Settings
```http
POST /api/system/initialize
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "System settings initialized successfully",
  "data": {
    "maintenanceMode": {
      "isActive": false,
      "message": "We're currently performing scheduled maintenance...",
      "estimatedReturn": "soon"
    }
  }
}
```

#### Verify Singleton Integrity
```http
GET /api/system/verify-singleton
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Singleton verification completed",
  "data": {
    "status": "ok",
    "count": 1
  }
}
```

---

## 💻 Usage in Code

### Static Methods

#### Get Instance (Get or Create)
```javascript
const SystemSettings = require("../models/SystemSettings");

const settings = await SystemSettings.getInstance();
console.log(settings.maintenanceMode.isActive);
```

#### Check if Maintenance Mode is Active
```javascript
const isActive = await SystemSettings.isMaintenanceModeActive();
if (isActive) {
  // Maintenance mode is on
}
```

#### Update Maintenance Mode
```javascript
const settings = await SystemSettings.updateMaintenanceMode(
  true,                    // isActive
  "Custom message",        // message (optional)
  "2 hours",              // estimatedReturn (optional)
  adminUserId             // who made the change
);
```

#### Verify Singleton
```javascript
const result = await SystemSettings.verifySingleton();
// Returns: { status: "ok|created|repaired", count: 1, ... }
```

### Instance Methods

#### Toggle Maintenance Mode
```javascript
const settings = await SystemSettings.getInstance();
await settings.toggleMaintenanceMode(adminUserId);
console.log(settings.maintenanceMode.isActive); // toggled value
```

---

## 🔄 Integration with Maintenance Mode Middleware

### Current: Environment Variable
```javascript
// server/middleware/maintenanceMode.js
const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
```

### Enhanced: Database + Environment Variable
```javascript
const SystemSettings = require("../models/SystemSettings");

const maintenanceMode = async (req, res, next) => {
  try {
    // Check environment variable first (for emergency override)
    const envMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    
    // Check database setting
    const dbMaintenanceMode = await SystemSettings.isMaintenanceModeActive();
    
    // Maintenance is active if EITHER is true
    const isMaintenanceMode = envMaintenanceMode || dbMaintenanceMode;
    
    if (!isMaintenanceMode) {
      return next();
    }
    
    // ... rest of your middleware logic
  } catch (error) {
    console.error('Maintenance mode check error:', error);
    // Fail open - allow access on error
    return next();
  }
};
```

---

## 🧪 Testing

### Test Script

```bash
# Initialize and verify
node scripts/initializeSystemSettings.js
```

### Manual Testing with cURL

**Get Settings:**
```bash
curl http://localhost:3500/api/system/settings
```

**Get Maintenance Status:**
```bash
curl http://localhost:3500/api/system/maintenance-status
```

**Enable Maintenance (Admin):**
```bash
curl -X PUT http://localhost:3500/api/system/maintenance-mode \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": true,
    "message": "Test maintenance message",
    "estimatedReturn": "30 minutes"
  }'
```

**Toggle Maintenance (Admin):**
```bash
curl -X POST http://localhost:3500/api/system/maintenance-mode/toggle \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🔒 Security

### Admin-Only Operations

The following operations require admin authentication:
- ✅ Update maintenance mode
- ✅ Toggle maintenance mode
- ✅ Initialize settings
- ✅ Verify singleton

### Middleware Stack

```javascript
// Admin routes use both JWT verification and admin role check
router.use(verifyJWT);       // 1. Verify JWT token
router.use(verifyAdmin);     // 2. Check if user is admin
```

### Audit Trail

All changes are tracked:
- **Who**: `lastUpdatedBy` field stores admin user ID
- **When**: `lastUpdatedAt` timestamp
- **What**: Logged to `reqLog.log` file

Example log entry:
```
20250112	10:30:45	uuid	MAINTENANCE_MODE_UPDATED	ENABLED	By: admin	Message: Scheduled maintenance...
```

---

## 🐛 Troubleshooting

### Issue: Multiple SystemSettings documents exist

**Solution:**
```bash
node scripts/initializeSystemSettings.js
# This will automatically remove duplicates
```

**Or manually:**
```javascript
const result = await SystemSettings.verifySingleton();
// Result will show how many were removed
```

### Issue: Cannot create SystemSettings document

**Check:**
1. Database connection is working
2. User has write permissions
3. No unique index conflicts

**Fix:**
```javascript
// Drop indexes and recreate
db.systemsettings.dropIndexes();
await SystemSettings.getInstance();
```

### Issue: Maintenance mode not activating

**Check:**
1. Database value: `db.systemsettings.find()`
2. Environment variable: `echo $MAINTENANCE_MODE`
3. Middleware integration
4. Frontend is checking correct endpoint

**Debug:**
```javascript
const isActive = await SystemSettings.isMaintenanceModeActive();
console.log('DB maintenance mode:', isActive);
console.log('ENV maintenance mode:', process.env.MAINTENANCE_MODE);
```

---

## 📈 Future Enhancements

The SystemSettings model can be extended to include:

### Additional Settings

```javascript
{
  maintenanceMode: { /* existing */ },
  
  featureFlags: {
    enableNewFeature: Boolean,
    betaFeatures: [String]
  },
  
  emailSettings: {
    smtpServer: String,
    fromEmail: String,
    replyToEmail: String
  },
  
  securitySettings: {
    maxLoginAttempts: Number,
    sessionTimeout: Number,
    requireEmailVerification: Boolean
  },
  
  contentSettings: {
    maxPostsPerDay: Number,
    maxImageSize: Number,
    allowedFileTypes: [String]
  }
}
```

### API for Each Setting Type

```javascript
// Add new static methods
systemSettingsSchema.statics.updateFeatureFlag = async function(flagName, value) { /* ... */ };
systemSettingsSchema.statics.getEmailSettings = async function() { /* ... */ };
```

---

## ✅ Checklist

Before deploying:

- [ ] Run initialization script
- [ ] Verify singleton exists in database
- [ ] Test public endpoints
- [ ] Test admin endpoints with valid token
- [ ] Test admin endpoints with invalid token (should fail)
- [ ] Verify audit trail is working
- [ ] Update maintenance middleware to check database
- [ ] Test maintenance mode on/off
- [ ] Document any custom settings added
- [ ] Update frontend to use new API endpoints

---

## 📚 Related Documentation

- `MAINTENANCE_MODE_GUIDE.md` - Middleware documentation
- `MAINTENANCE_MODE_COMPLETE_SETUP.md` - Full system overview
- Server README - General server documentation

---

**System Settings is now database-driven and ready for production use!** 🚀

