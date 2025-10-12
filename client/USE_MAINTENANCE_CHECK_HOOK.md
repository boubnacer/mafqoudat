# useMaintenanceCheck Hook - Quick Reference

## 🚀 Quick Start

### 1. Import the Hook
```javascript
import useMaintenanceCheck from './hooks/useMaintenanceCheck';
```

### 2. Use in App.js
```javascript
function App() {
  const { isMaintenanceMode, isLoading } = useMaintenanceCheck();
  
  if (isLoading) return <LoadingScreen />;
  if (isMaintenanceMode) return <MaintenanceMode />;
  
  return <YourApp />;
}
```

That's it! The hook handles everything automatically.

---

## 📋 Return Values

```javascript
const {
  isMaintenanceMode,  // boolean - Is maintenance active?
  isLoading,          // boolean - Initial check in progress?
  checkMaintenance,   // function - Manually check status
  error,              // string|null - Error if check failed
  isAdmin             // boolean - Is current user admin?
} = useMaintenanceCheck();
```

---

## 🎯 Common Patterns

### Basic (Recommended)
```javascript
const { isMaintenanceMode, isLoading } = useMaintenanceCheck();

if (isLoading) return <LoadingScreen />;
if (isMaintenanceMode) return <MaintenanceMode />;
return <App />;
```

### With Error Handling
```javascript
const { isMaintenanceMode, isLoading, error, checkMaintenance } = useMaintenanceCheck();

if (isLoading) return <LoadingScreen />;
if (error) return <ErrorScreen onRetry={checkMaintenance} />;
if (isMaintenanceMode) return <MaintenanceMode />;
return <App />;
```

### With Admin Banner
```javascript
const { isMaintenanceMode, isAdmin } = useMaintenanceCheck();

return (
  <>
    {isMaintenanceMode && isAdmin && (
      <Alert>🔧 Maintenance active - you're viewing as admin</Alert>
    )}
    {isMaintenanceMode && !isAdmin ? <MaintenanceMode /> : <App />}
  </>
);
```

### With Manual Refresh
```javascript
const { isMaintenanceMode, checkMaintenance, isLoading } = useMaintenanceCheck();

if (isMaintenanceMode) {
  return (
    <>
      <MaintenanceMode />
      <Button onClick={checkMaintenance} disabled={isLoading}>
        Check Status
      </Button>
    </>
  );
}
return <App />;
```

---

## ⚡ What It Does Automatically

✅ **On Mount**: Checks `/health` endpoint  
✅ **Admin Detection**: Bypasses maintenance for admin users  
✅ **Smart Polling**: Checks every 60s when in maintenance  
✅ **Auto-Stop**: Stops polling when maintenance ends  
✅ **Redux Update**: Updates global maintenance state  
✅ **Auth Detection**: Re-checks when user logs in/out  
✅ **Cleanup**: Clears intervals on unmount  

---

## 🧪 Testing

### Browser Console
```javascript
// Hook provides detailed logs:
// 🚀 Initialization
// 🔍 Checking status
// ✅ Operational
// 🔧 Maintenance active
// 👤 Admin bypass
```

### Manual Check
```javascript
const { checkMaintenance } = useMaintenanceCheck();

// Make available globally
window.testMaintenance = checkMaintenance;

// Then in console:
await window.testMaintenance();
```

### With Backend
```bash
# Enable maintenance
echo "MAINTENANCE_MODE=true" >> server/.env
cd server && npm start

# Start frontend
cd client && npm start

# Should see maintenance screen
```

---

## 🎛️ Configuration

### Change Poll Interval
Default: 60 seconds

Edit `useMaintenanceCheck.js` line 121:
```javascript
setInterval(() => {
  checkMaintenance();
}, 30000); // 30 seconds instead of 60
```

### Change Request Timeout
Default: 10 seconds

Edit `useMaintenanceCheck.js` line 63:
```javascript
await axios.get(`${API_URL}/health`, {
  timeout: 5000, // 5 seconds instead of 10
  // ...
});
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Always shows maintenance | Check backend `MAINTENANCE_MODE` env var |
| Admin sees maintenance | Verify user role is exactly `'admin'` |
| Polling doesn't stop | Check component properly unmounts |
| Too many API calls | Use hook only once in App.js |
| Error on check | Check backend is running and `/health` exists |

---

## ✨ Features

### 1. Admin Bypass
```javascript
// Admins never see maintenance screen
if (role === 'admin') {
  // Maintenance check is skipped
  // isMaintenanceMode always returns false
}
```

### 2. Smart Polling
```javascript
// Only polls when in maintenance mode
if (isMaintenanceMode) {
  // Check every 60 seconds
  // Stop when maintenance ends
}
```

### 3. Auth-Aware
```javascript
// Automatically re-checks when:
// - User logs in
// - User logs out
// - User role changes
```

### 4. Error Handling
```javascript
// On network error:
// - Assumes system is operational
// - Shows app instead of blocking access
// - Returns error message for display
```

---

## 📊 API Requirements

Backend `/health` endpoint must:

**When Operational (200)**
```json
{
  "status": "OK",
  "timestamp": "2025-01-12T14:30:00.000Z"
}
```

**When Maintenance (503)**
```json
{
  "maintenanceMode": true,
  "message": "We're currently performing scheduled maintenance.",
  "estimatedReturn": "soon"
}
```

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `useMaintenanceCheck.js` | Hook implementation |
| `useMaintenanceCheck.md` | Full documentation |
| `MaintenanceMode.jsx` | Display component |
| `maintenanceSlice.js` | Redux state |
| `MaintenanceCheckExample.jsx` | Usage examples |

---

## 💡 Best Practices

1. **Use Once**: Only call the hook once in your App.js root component
2. **Handle Loading**: Always show a loading state during initial check
3. **Show Errors**: Display errors to users with retry option
4. **Admin Banner**: Show admins when maintenance is active
5. **Manual Refresh**: Provide a way for users to check status manually
6. **Test Both States**: Test with maintenance both on and off
7. **Test Admin Flow**: Verify admin bypass works correctly

---

## 📚 Full Documentation

For complete details, see:
- `useMaintenanceCheck.md` - Full documentation
- `MaintenanceCheckExample.jsx` - 7 complete examples
- `MAINTENANCE_MODE_INTEGRATION_GUIDE.md` - Complete setup guide

---

## ⚙️ Integration Checklist

- [ ] Hook imported in App.js
- [ ] MaintenanceMode component exists
- [ ] Redux maintenance slice added to store
- [ ] Tested with maintenance on
- [ ] Tested with maintenance off
- [ ] Tested admin bypass
- [ ] Tested loading state
- [ ] Tested error handling
- [ ] Backend `/health` endpoint working
- [ ] Backend returns correct 503 format

---

## 🎉 You're Ready!

The hook is designed to work out of the box with minimal configuration.

**Quick Implementation:**

```javascript
// App.js
import useMaintenanceCheck from './hooks/useMaintenanceCheck';
import MaintenanceMode from './components/MaintenanceMode';

function App() {
  const { isMaintenanceMode, isLoading } = useMaintenanceCheck();
  
  if (isLoading) return <div>Loading...</div>;
  if (isMaintenanceMode) return <MaintenanceMode />;
  
  return (
    <div className="App">
      {/* Your app content */}
    </div>
  );
}
```

**That's all you need!** The hook handles everything else automatically. 🚀

