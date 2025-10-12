# Maintenance Mode Guide

## Overview
The maintenance mode middleware allows you to temporarily block non-admin users from accessing the application while performing system maintenance, upgrades, or critical fixes.

## Features
- ✅ Blocks all non-admin traffic during maintenance
- ✅ Allows admin users to bypass maintenance mode
- ✅ Excludes critical routes (health checks, authentication, password reset)
- ✅ Returns proper 503 status code
- ✅ Comprehensive logging of all maintenance mode events
- ✅ Graceful error handling

## Configuration

### Enable Maintenance Mode
Set the environment variable in your `.env` file:
```bash
MAINTENANCE_MODE=true
```

### Disable Maintenance Mode
Set the environment variable to anything other than 'true' or remove it:
```bash
MAINTENANCE_MODE=false
# or
# MAINTENANCE_MODE=
```

## How It Works

### 1. Route Exclusions
The following routes are always accessible, even in maintenance mode:
- `/health` - Health check endpoint
- `/auth/*` - All authentication routes (login, register, OAuth)
- `/api/password-reset/*` - Password reset functionality

### 2. Admin Bypass
Admin users can access the application normally during maintenance mode by:
1. Being authenticated with a valid JWT token
2. Having the `role` field set to `'admin'` in the database

### 3. Non-Admin Response
When maintenance mode is active, non-admin users receive:
```json
{
  "maintenanceMode": true,
  "message": "We're currently performing scheduled maintenance. We'll be back soon! Thank you for your patience.",
  "estimatedReturn": "soon"
}
```
HTTP Status: **503 Service Unavailable**

## Implementation Details

### Location
- **File**: `server/middleware/maintenanceMode.js`
- **Server Integration**: Line 173-175 in `server/server.js`
- **Position**: After authentication setup, before route definitions

### Authentication Flow
```
Request → Maintenance Mode Check → Admin Verification → Route Handler
                ↓                          ↓
          Excluded Route?            Admin User?
                ↓                          ↓
              Yes → Continue           Yes → Continue
               No → Check Auth          No → 503 Error
```

## Logging

All maintenance mode events are logged to `server/logs/reqLog.log`:

### Event Types
1. **MAINTENANCE_ACCESS_ATTEMPT**: When a request arrives during maintenance
2. **MAINTENANCE_ADMIN_BYPASS**: When an admin successfully bypasses maintenance
3. **MAINTENANCE_BLOCKED**: When a non-admin user is blocked
4. **MAINTENANCE_ERROR**: When an error occurs in the middleware

### Log Format
```
20250112	14:30:45	uuid	MAINTENANCE_BLOCKED	GET	/posts	https://example.com
```

## Testing

### Manual Testing

#### 1. Test Maintenance Mode Activation
```bash
# Set maintenance mode
export MAINTENANCE_MODE=true

# Restart your server
npm start

# Try accessing a protected route (should return 503)
curl http://localhost:3500/posts

# Try accessing health check (should work)
curl http://localhost:3500/health
```

#### 2. Test Admin Bypass
```bash
# Login as admin user to get token
curl -X POST http://localhost:3500/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Use token to access during maintenance (should work)
curl http://localhost:3500/posts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 3. Test Excluded Routes
```bash
# These should work even in maintenance mode
curl http://localhost:3500/health
curl http://localhost:3500/auth/login
curl http://localhost:3500/api/password-reset/request
```

### Automated Testing Script
Run the provided test script:
```bash
node test-maintenance-mode.js
```

## Production Deployment

### Step 1: Prepare
1. Notify users of planned maintenance window
2. Set up monitoring alerts
3. Ensure admin credentials are available

### Step 2: Enable Maintenance
```bash
# On Railway/Vercel/your hosting platform
railway variables set MAINTENANCE_MODE=true

# Or use the platform's dashboard to add the environment variable
```

### Step 3: Verify
- Check that the application returns 503 for regular users
- Verify admin access works correctly
- Monitor logs for any issues

### Step 4: Perform Maintenance
- Run database migrations
- Deploy new code
- Test critical functionality

### Step 5: Disable Maintenance
```bash
railway variables set MAINTENANCE_MODE=false
```

### Step 6: Verify Normal Operation
- Test user login and core features
- Monitor error logs
- Check application metrics

## Troubleshooting

### Issue: Admin users are blocked
**Solution**: 
- Verify the user's role is exactly `'admin'` (case-sensitive)
- Check JWT token is valid and not expired
- Ensure JWT_SECRET environment variable matches

### Issue: All users can access during maintenance
**Solution**:
- Verify `MAINTENANCE_MODE=true` is set correctly
- Check environment variable is loaded (restart server)
- Look for typos in variable name

### Issue: Excluded routes are blocked
**Solution**:
- Verify route path matches excluded patterns
- Check middleware placement in server.js
- Review logs for specific route being blocked

## Security Considerations

1. **Admin Authentication**: Only users with JWT tokens AND admin role can bypass
2. **Error Handling**: Errors fail safely by showing maintenance page
3. **Logging**: All bypass attempts are logged for security audit
4. **Token Validation**: JWT tokens are verified with the secret key
5. **Database Check**: User role is verified from database, not just token

## Customization

### Change Maintenance Message
Edit `server/middleware/maintenanceMode.js`, line 91-95:
```javascript
return res.status(503).json({
  maintenanceMode: true,
  message: "Your custom message here",
  estimatedReturn: "2 hours" // or your estimate
});
```

### Add More Excluded Routes
Edit `server/middleware/maintenanceMode.js`, line 22-26:
```javascript
const excludedRoutes = [
  '/health',
  '/auth',
  '/api/password-reset',
  '/your-new-route'  // Add your route here
];
```

### Change Status Code
Edit line 91 to use a different status code (503 is recommended for maintenance):
```javascript
return res.status(503).json({
  // ...
});
```

## Best Practices

1. **Plan Ahead**: Schedule maintenance during low-traffic periods
2. **Communicate**: Notify users in advance via email/notifications
3. **Monitor**: Watch logs and metrics during maintenance
4. **Test First**: Test maintenance mode in staging environment
5. **Quick Toggle**: Have a quick way to disable if issues arise
6. **Admin Access**: Ensure multiple admins can access during maintenance
7. **Document**: Keep track of what was done during maintenance
8. **Verify**: Thoroughly test after disabling maintenance mode

## Support

For issues or questions:
1. Check server logs in `server/logs/`
2. Review this guide's troubleshooting section
3. Test with the provided test script
4. Verify environment variables are set correctly

