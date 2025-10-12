# Maintenance Mode - Quick Reference

## 🚀 Quick Start

### Enable Maintenance Mode
```bash
# In .env file
MAINTENANCE_MODE=true
```

### Disable Maintenance Mode
```bash
# In .env file
MAINTENANCE_MODE=false
# or remove the variable
```

## 📍 Key Files

| File | Purpose |
|------|---------|
| `server/middleware/maintenanceMode.js` | Main middleware implementation |
| `server/server.js` (lines 173-175) | Middleware integration |
| `MAINTENANCE_MODE_GUIDE.md` | Complete documentation |
| `test-maintenance-mode.js` | Testing script |

## 🔓 Excluded Routes (Always Accessible)

```
✓ /health
✓ /auth/*
✓ /api/password-reset/*
```

## 👤 Admin Bypass

Requirements:
1. Valid JWT token in `Authorization: Bearer <token>` header
2. User role must be `'admin'` in database

## 📝 Response Format

**Status Code:** 503 Service Unavailable

```json
{
  "maintenanceMode": true,
  "message": "We're currently performing scheduled maintenance. We'll be back soon! Thank you for your patience.",
  "estimatedReturn": "soon"
}
```

## 🧪 Testing

```bash
# Run test suite
node test-maintenance-mode.js

# Or with custom admin credentials
ADMIN_USERNAME=admin ADMIN_PASSWORD=password123 node test-maintenance-mode.js
```

## 📊 Log Events

| Event | Description |
|-------|-------------|
| `MAINTENANCE_ACCESS_ATTEMPT` | Request received during maintenance |
| `MAINTENANCE_ADMIN_BYPASS` | Admin successfully bypassed |
| `MAINTENANCE_BLOCKED` | Non-admin user blocked |
| `MAINTENANCE_ERROR` | Middleware error occurred |

Log file: `server/logs/reqLog.log`

## 🔧 Common Commands

```bash
# Enable maintenance (Unix/Mac)
export MAINTENANCE_MODE=true

# Enable maintenance (Windows CMD)
set MAINTENANCE_MODE=true

# Enable maintenance (Windows PowerShell)
$env:MAINTENANCE_MODE="true"

# Restart server
npm start

# Test health endpoint
curl http://localhost:3500/health

# Test protected endpoint
curl http://localhost:3500/posts
```

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Admins blocked | Check user role is exactly `'admin'` (lowercase) |
| All users can access | Verify `MAINTENANCE_MODE=true` and restart server |
| Excluded routes blocked | Check route paths match excluded patterns |

## 📦 Production Deployment

### Railway
```bash
railway variables set MAINTENANCE_MODE=true
railway up
```

### Vercel
```bash
vercel env add MAINTENANCE_MODE
# Enter: true
vercel --prod
```

### Environment Variables Dashboard
Add: `MAINTENANCE_MODE` = `true`

## ⚡ Emergency Disable

If you need to quickly disable maintenance mode:

1. **Through Dashboard**: Set `MAINTENANCE_MODE=false`
2. **Through CLI**: `railway variables set MAINTENANCE_MODE=false`
3. **Through Code**: Comment out line 175 in `server/server.js` and redeploy

## 📞 Quick Reference Links

- Full Guide: `MAINTENANCE_MODE_GUIDE.md`
- Middleware: `server/middleware/maintenanceMode.js`
- Integration: `server/server.js:173-175`
- Tests: `test-maintenance-mode.js`

