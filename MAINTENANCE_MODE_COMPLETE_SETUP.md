# Maintenance Mode - Complete Setup Guide

## 📋 Overview

This document provides a complete overview of the maintenance mode system implemented for both backend and frontend.

---

## 🗂️ File Structure

### Backend Files
```
server/
├── middleware/
│   └── maintenanceMode.js                    ✅ Middleware implementation
├── env.maintenance.example                   ✅ Environment variable example
└── [Documentation]
    ├── MAINTENANCE_MODE_GUIDE.md             ✅ Complete backend guide
    └── MAINTENANCE_MODE_QUICK_REFERENCE.md   ✅ Quick reference card

Root:
└── test-maintenance-mode.js                  ✅ Backend testing script
```

### Frontend Files
```
client/
├── src/
│   ├── components/
│   │   └── MaintenanceMode.jsx               ✅ React component
│   ├── app/state/
│   │   └── maintenanceSlice.js               ✅ Redux state management
│   ├── utils/
│   │   ├── maintenanceModeInterceptor.js     ✅ Axios interceptor
│   │   └── testMaintenanceMode.js            ✅ Testing utilities
│   └── examples/
│       └── MaintenanceModeExample.jsx        ✅ Implementation examples
└── [Documentation]
    ├── MAINTENANCE_MODE_INTEGRATION_GUIDE.md ✅ Complete frontend guide
    └── MAINTENANCE_MODE_QUICK_START.md       ✅ Quick start guide

Root:
└── MAINTENANCE_MODE_COMPLETE_SETUP.md        ✅ This file
```

---

## 🚀 Complete Setup Instructions

### Part 1: Backend Setup (Already Complete)

The backend middleware is already integrated in `server/server.js` at line 173-175.

**To enable maintenance mode:**
```bash
# In server/.env
MAINTENANCE_MODE=true
```

**To disable maintenance mode:**
```bash
# In server/.env
MAINTENANCE_MODE=false
```

### Part 2: Frontend Setup (5 Steps)

#### Step 1: Add Redux Slice to Store

Edit `client/src/app/store.js`:

```javascript
import maintenanceReducer from './state/maintenanceSlice';

export const store = configureStore({
  reducer: {
    // ... existing reducers
    maintenance: maintenanceReducer, // Add this
  },
});
```

#### Step 2: Update API Base Query

Find your RTK Query API slice (likely `client/src/app/api/apiSlice.js` or similar):

```javascript
import { setMaintenanceMode } from '../state/maintenanceSlice';

const baseQueryWithMaintenanceCheck = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  
  if (result.error?.status === 503 && result.error?.data?.maintenanceMode) {
    api.dispatch(setMaintenanceMode({
      isActive: true,
      message: result.error.data.message,
      estimatedReturn: result.error.data.estimatedReturn
    }));
  }
  
  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithMaintenanceCheck, // Use this instead
  // ... rest of config
});
```

#### Step 3: Add to App.js

Edit `client/src/App.js`:

```javascript
import { useSelector } from 'react-redux';
import { selectIsMaintenanceActive } from './app/state/maintenanceSlice';
import MaintenanceMode from './components/MaintenanceMode';

function App() {
  const isMaintenanceMode = useSelector(selectIsMaintenanceActive);
  
  if (isMaintenanceMode) {
    return <MaintenanceMode />;
  }
  
  return (
    // Your normal app structure
  );
}
```

#### Step 4: Load Test Utilities (Optional - Development Only)

Edit `client/src/index.js` (add at bottom):

```javascript
if (process.env.NODE_ENV === 'development') {
  import('./utils/testMaintenanceMode');
}
```

#### Step 5: Test

**Browser console:**
```javascript
enableTestMaintenanceMode()  // Show maintenance screen
disableTestMaintenanceMode() // Hide maintenance screen
```

**Or with real backend:**
```bash
# Terminal 1 - Start backend with maintenance mode
cd server
echo "MAINTENANCE_MODE=true" >> .env
npm start

# Terminal 2 - Start frontend
cd client
npm start
```

---

## 🎯 How It Works

### Backend Flow
```
1. Request arrives at server
2. Maintenance middleware checks MAINTENANCE_MODE env var
3. If enabled:
   a. Check if route is excluded (/health, /auth/*, /api/password-reset/*)
   b. If excluded → Allow through
   c. If not excluded → Check if user is admin
   d. If admin → Allow through (bypass)
   e. If not admin → Return 503 with maintenance JSON
```

### Frontend Flow
```
1. API request made via RTK Query
2. Server returns 503 with maintenanceMode: true
3. Base query interceptor detects 503 + maintenanceMode
4. Dispatch setMaintenanceMode action to Redux
5. App.js reads isMaintenanceMode from Redux
6. MaintenanceMode component displays
7. User sees professional maintenance screen in their language
```

---

## 🧪 Testing Checklist

### Backend Testing
- [ ] Set `MAINTENANCE_MODE=true` in server/.env
- [ ] Restart server
- [ ] Try accessing `/posts` → Should get 503 response
- [ ] Try accessing `/health` → Should work (excluded route)
- [ ] Login as admin → Should bypass maintenance mode
- [ ] Login as regular user → Should get 503 response
- [ ] Check `server/logs/reqLog.log` for maintenance events
- [ ] Run: `node test-maintenance-mode.js`

### Frontend Testing
- [ ] Test console command: `enableTestMaintenanceMode()`
- [ ] Verify maintenance screen displays
- [ ] Check English language
- [ ] Check French language (if available)
- [ ] Check Arabic language (if available, should be RTL)
- [ ] Test light theme
- [ ] Test dark theme
- [ ] Test on mobile screen size
- [ ] Test on tablet screen size
- [ ] Test on desktop screen size
- [ ] Verify logo displays correctly
- [ ] Test console command: `disableTestMaintenanceMode()`
- [ ] Test with real backend maintenance mode enabled

### Integration Testing
- [ ] Backend maintenance enabled + Frontend running → Show maintenance
- [ ] Backend maintenance disabled + Frontend running → Normal app
- [ ] Admin user + Backend maintenance enabled → Should see normal app
- [ ] Regular user + Backend maintenance enabled → Should see maintenance screen
- [ ] Network tab shows 503 responses
- [ ] Redux devtools shows maintenance state updates

---

## 🎨 Customization Guide

### Change Maintenance Messages

Edit `client/src/components/MaintenanceMode.jsx` around line 160:

```javascript
const messages = {
  en: {
    title: "Your custom English title",
    subtitle: "Your custom English subtitle",
    estimatedReturn: "Custom time estimate",
    updating: "Custom progress message"
  },
  fr: { /* French translations */ },
  ar: { /* Arabic translations */ }
};
```

### Change Colors

Edit `MaintenanceMode.jsx` styled components:

```javascript
// Dark mode gradient
background: 'linear-gradient(135deg, #yourcolors)'

// Light mode gradient  
background: 'linear-gradient(135deg, #yourcolors)'
```

### Change Animation Speed

```javascript
animation: `${pulse} 3s ease-in-out infinite` // Change 2s to 3s for slower
animation: `${float} 4s ease-in-out infinite` // Change 3s to 4s for slower
```

### Add More Languages

```javascript
const messages = {
  en: { /* ... */ },
  fr: { /* ... */ },
  ar: { /* ... */ },
  es: {
    title: "Título en español",
    subtitle: "Subtítulo en español",
    estimatedReturn: "Tiempo estimado: Pronto",
    updating: "Actualizando..."
  }
};
```

---

## 📊 Monitoring & Logging

### Backend Logs

Location: `server/logs/reqLog.log`

Events logged:
- `MAINTENANCE_ACCESS_ATTEMPT` - Any request during maintenance
- `MAINTENANCE_ADMIN_BYPASS` - Admin user bypassed maintenance
- `MAINTENANCE_BLOCKED` - Non-admin user blocked
- `MAINTENANCE_ERROR` - Error in middleware

Example:
```
20250112	14:30:45	uuid	MAINTENANCE_BLOCKED	GET	/posts	https://example.com
```

### Frontend Console

Development mode logs:
```javascript
🔧 Maintenance mode activated: { message: "...", estimatedReturn: "..." }
✅ Maintenance mode deactivated
```

Check state anytime:
```javascript
getMaintenanceState()
```

---

## 🚨 Troubleshooting

### Backend Issues

| Problem | Solution |
|---------|----------|
| All users blocked including admins | Check user role is exactly `'admin'` (lowercase) |
| Maintenance mode not activating | Verify `MAINTENANCE_MODE=true` (exact string) |
| Excluded routes blocked | Check route path matches excluded patterns exactly |
| Errors in middleware | Check `server/logs/errLog.log` |

### Frontend Issues

| Problem | Solution |
|---------|----------|
| Maintenance screen not showing | Check Redux state: `getMaintenanceState()` |
| Wrong language displayed | Verify LanguageContext is properly set |
| Wrong theme colors | Check `theme.palette.mode` value |
| Logo not visible | Ensure `maflogo.png` in `public/` folder |
| Stuck in maintenance mode | Run: `disableTestMaintenanceMode()` |

### Integration Issues

| Problem | Solution |
|---------|----------|
| 503 errors but no maintenance screen | Verify base query interceptor is set up |
| Maintenance slice not found | Check Redux store includes maintenance reducer |
| Component import errors | Verify all files are in correct locations |

---

## 🔒 Security Considerations

1. **Admin Verification**: Only users with `role === 'admin'` in database can bypass
2. **JWT Required**: Admin bypass requires valid JWT token
3. **Database Check**: Role is verified from database, not just token
4. **Fail-Safe**: Errors in middleware show maintenance page (safe default)
5. **Logging**: All bypass attempts are logged for audit trail
6. **Token Validation**: JWT tokens verified with secret key

---

## 🎯 Production Deployment

### Pre-Deployment

1. Test in staging environment first
2. Notify users of planned maintenance window
3. Prepare rollback plan
4. Set up monitoring alerts

### Enable Maintenance

**Railway:**
```bash
railway variables set MAINTENANCE_MODE=true
```

**Vercel:**
```bash
vercel env add MAINTENANCE_MODE
# Enter: true
vercel --prod
```

**Other platforms:**
Use platform's dashboard to add environment variable `MAINTENANCE_MODE=true`

### During Maintenance

1. Verify maintenance screen is displaying
2. Test admin bypass works
3. Monitor logs for issues
4. Perform maintenance tasks
5. Test critical functionality

### Disable Maintenance

```bash
railway variables set MAINTENANCE_MODE=false
# or your platform's method
```

### Post-Deployment

1. Verify app is accessible to all users
2. Check for errors in logs
3. Monitor application metrics
4. Test key user flows

---

## 📞 Support & Documentation

### Quick References
- **Backend Quick Ref**: `MAINTENANCE_MODE_QUICK_REFERENCE.md`
- **Frontend Quick Start**: `client/MAINTENANCE_MODE_QUICK_START.md`

### Complete Guides
- **Backend Guide**: `MAINTENANCE_MODE_GUIDE.md`
- **Frontend Guide**: `client/MAINTENANCE_MODE_INTEGRATION_GUIDE.md`

### Testing
- **Backend Tests**: `test-maintenance-mode.js`
- **Frontend Tests**: Browser console commands

### Examples
- **Implementation Examples**: `client/src/examples/MaintenanceModeExample.jsx`

---

## ✅ Final Checklist

Before going live with maintenance mode:

- [ ] Backend middleware integrated
- [ ] Frontend component created
- [ ] Redux slice added to store
- [ ] API interceptor configured
- [ ] App.js updated with maintenance check
- [ ] Tested all languages
- [ ] Tested both themes
- [ ] Tested on all screen sizes
- [ ] Tested admin bypass
- [ ] Tested with real 503 responses
- [ ] Logs working correctly
- [ ] Documentation reviewed
- [ ] Team trained on usage
- [ ] Rollback plan prepared
- [ ] Monitoring set up

---

## 🎉 You're All Set!

Your maintenance mode system is now complete and ready to use!

**Quick Commands:**

```bash
# Backend - Enable
echo "MAINTENANCE_MODE=true" >> server/.env

# Backend - Disable  
echo "MAINTENANCE_MODE=false" >> server/.env

# Frontend - Test Enable
enableTestMaintenanceMode()

# Frontend - Test Disable
disableTestMaintenanceMode()
```

For questions or issues, refer to the complete documentation files listed above.

