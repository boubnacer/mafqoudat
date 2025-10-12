# useMaintenanceCheck Hook - Documentation

## Overview

`useMaintenanceCheck` is a custom React hook that automatically checks and monitors the maintenance mode status of your backend API.

## Features

✅ **Automatic Initial Check** - Checks maintenance status on mount  
✅ **Smart Polling** - Polls every 60 seconds when in maintenance mode  
✅ **Admin Bypass** - Automatically bypasses maintenance for admin users  
✅ **Redux Integration** - Updates global maintenance state  
✅ **Error Handling** - Gracefully handles network errors  
✅ **Auth-Aware** - Re-checks when user authentication changes  
✅ **Auto-Cleanup** - Properly cleans up intervals on unmount

## Import

```javascript
import useMaintenanceCheck from './hooks/useMaintenanceCheck';
```

## Return Values

```javascript
const {
  isMaintenanceMode,  // boolean - true if maintenance mode is active
  isLoading,          // boolean - true while initial check is running
  checkMaintenance,   // function - manually trigger a maintenance check
  error,              // string|null - error message if check failed
  isAdmin             // boolean - true if current user is admin
} = useMaintenanceCheck();
```

### Return Object Properties

| Property | Type | Description |
|----------|------|-------------|
| `isMaintenanceMode` | `boolean` | `true` if maintenance mode is active (and user is not admin) |
| `isLoading` | `boolean` | `true` during the initial check, `false` afterwards |
| `checkMaintenance` | `function` | Function to manually trigger a maintenance check |
| `error` | `string\|null` | Error message if the check failed, `null` otherwise |
| `isAdmin` | `boolean` | `true` if the current user is authenticated as admin |

## Basic Usage

### Example 1: Simple Integration in App.js

```javascript
import React from 'react';
import { ThemeProvider } from '@mui/material';
import useMaintenanceCheck from './hooks/useMaintenanceCheck';
import MaintenanceMode from './components/MaintenanceMode';

function App() {
  const { isMaintenanceMode, isLoading } = useMaintenanceCheck();
  
  // Show loading state during initial check
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // Show maintenance mode screen
  if (isMaintenanceMode) {
    return <MaintenanceMode />;
  }
  
  // Normal app content
  return (
    <ThemeProvider theme={theme}>
      {/* Your app content */}
    </ThemeProvider>
  );
}

export default App;
```

### Example 2: With Error Handling

```javascript
import React from 'react';
import useMaintenanceCheck from './hooks/useMaintenanceCheck';
import MaintenanceMode from './components/MaintenanceMode';
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';

function App() {
  const { 
    isMaintenanceMode, 
    isLoading, 
    error,
    checkMaintenance 
  } = useMaintenanceCheck();
  
  if (isLoading) {
    return <LoadingScreen message="Checking system status..." />;
  }
  
  if (error) {
    return (
      <ErrorScreen 
        message="Failed to check system status" 
        error={error}
        onRetry={checkMaintenance}
      />
    );
  }
  
  if (isMaintenanceMode) {
    return <MaintenanceMode />;
  }
  
  return (
    <div className="App">
      {/* Your app content */}
    </div>
  );
}
```

### Example 3: With Manual Refresh Button

```javascript
import React from 'react';
import { Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import useMaintenanceCheck from './hooks/useMaintenanceCheck';
import MaintenanceMode from './components/MaintenanceMode';

function App() {
  const { 
    isMaintenanceMode, 
    isLoading, 
    checkMaintenance,
    isAdmin 
  } = useMaintenanceCheck();
  
  if (isMaintenanceMode) {
    return (
      <div>
        <MaintenanceMode />
        <Button 
          onClick={checkMaintenance}
          disabled={isLoading}
          startIcon={<Refresh />}
          sx={{ position: 'fixed', bottom: 20, right: 20 }}
        >
          Check Status
        </Button>
      </div>
    );
  }
  
  return (
    <div className="App">
      {isAdmin && (
        <div style={{ background: 'yellow', padding: '10px' }}>
          ⚠️ You're logged in as admin. You may bypass maintenance mode.
        </div>
      )}
      {/* Your app content */}
    </div>
  );
}
```

### Example 4: With Status Banner

```javascript
import React from 'react';
import { Alert, Box } from '@mui/material';
import useMaintenanceCheck from './hooks/useMaintenanceCheck';
import MaintenanceMode from './components/MaintenanceMode';

function App() {
  const { isMaintenanceMode, isAdmin, error } = useMaintenanceCheck();
  
  if (isMaintenanceMode && !isAdmin) {
    return <MaintenanceMode />;
  }
  
  return (
    <Box>
      {/* Show status banner for admins during maintenance */}
      {isMaintenanceMode && isAdmin && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          🔧 Maintenance mode is active. You can access the system as an admin,
          but regular users are seeing the maintenance screen.
        </Alert>
      )}
      
      {/* Show error banner if check failed */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to check maintenance status: {error}
        </Alert>
      )}
      
      {/* Your app content */}
      <div className="App">
        {/* ... */}
      </div>
    </Box>
  );
}
```

## How It Works

### 1. Initial Check (On Mount)

```
Component mounts
      ↓
Hook calls checkMaintenance()
      ↓
GET /health endpoint
      ↓
Check response status
      ↓
Update local state + Redux
```

### 2. Maintenance Mode Detection

```
Response status === 503
  AND
response.data.maintenanceMode === true
      ↓
Set isMaintenanceMode = true
      ↓
Dispatch setMaintenanceMode to Redux
      ↓
Start 60-second polling
```

### 3. Admin Bypass

```
User is authenticated
  AND
User role === 'admin'
      ↓
Skip maintenance check
      ↓
Return isMaintenanceMode = false
```

### 4. Polling (When in Maintenance)

```
Every 60 seconds:
      ↓
Call checkMaintenance()
      ↓
If maintenance is off:
  - Update state
  - Stop polling
  - User sees normal app
```

### 5. Auth Change Detection

```
User logs in/out
      ↓
useEffect detects auth change
      ↓
Re-check maintenance status
      ↓
If user is now admin:
  - Clear maintenance mode
  - Show normal app
```

## Configuration

### Polling Interval

Default: 60 seconds (60000ms)

To change, edit line 121 in `useMaintenanceCheck.js`:

```javascript
intervalIdRef.current = setInterval(() => {
  checkMaintenance();
}, 30000); // Change to 30 seconds
```

### Request Timeout

Default: 10 seconds

To change, edit line 63:

```javascript
const response = await axios.get(`${API_URL}/health`, {
  timeout: 5000, // Change to 5 seconds
  // ...
});
```

## Advanced Usage

### Using with Redux Directly

The hook automatically updates Redux state, so you can also use Redux selectors:

```javascript
import React from 'react';
import { useSelector } from 'react-redux';
import { selectIsMaintenanceActive } from './app/state/maintenanceSlice';
import useMaintenanceCheck from './hooks/useMaintenanceCheck';
import MaintenanceMode from './components/MaintenanceMode';

function App() {
  // Hook handles the checking and updating
  useMaintenanceCheck();
  
  // Read from Redux directly
  const isMaintenanceMode = useSelector(selectIsMaintenanceActive);
  
  if (isMaintenanceMode) {
    return <MaintenanceMode />;
  }
  
  return <div>Your app</div>;
}
```

### Custom Hook Wrapper

Create a custom wrapper with additional logic:

```javascript
import { useEffect } from 'react';
import useMaintenanceCheck from './useMaintenanceCheck';

export const useMaintenanceCheckWithNotification = () => {
  const result = useMaintenanceCheck();
  
  // Show notification when maintenance mode changes
  useEffect(() => {
    if (result.isMaintenanceMode) {
      // Show notification
      console.log('Maintenance mode activated!');
    } else {
      console.log('System is operational');
    }
  }, [result.isMaintenanceMode]);
  
  return result;
};
```

## Debugging

### Console Logs

The hook provides detailed console logs:

- `🚀 [MAINTENANCE-CHECK]` - Initialization
- `🔍 [MAINTENANCE-CHECK]` - Checking status
- `✅ [MAINTENANCE-CHECK]` - System operational
- `🔧 [MAINTENANCE-CHECK]` - Maintenance active
- `👤 [MAINTENANCE-CHECK]` - Admin bypass
- `⏱️ [MAINTENANCE-CHECK]` - Polling setup
- `🔄 [MAINTENANCE-CHECK]` - Polling check
- `🛑 [MAINTENANCE-CHECK]` - Polling stopped
- `🔐 [MAINTENANCE-CHECK]` - Auth state changed
- `❌ [MAINTENANCE-CHECK]` - Error occurred

### Manual Check

Trigger a manual check from console:

```javascript
// In your component
const { checkMaintenance } = useMaintenanceCheck();

// Make available globally for debugging
window.checkMaintenanceStatus = checkMaintenance;
```

Then in browser console:
```javascript
await window.checkMaintenanceStatus();
```

## Troubleshooting

### Issue: Hook always returns isMaintenanceMode = false

**Solution:**
1. Check that backend is actually in maintenance mode
2. Verify `/health` endpoint returns 503 status
3. Check Redux state: `getMaintenanceState()` in console
4. Look for error messages in console logs

### Issue: Polling doesn't stop

**Solution:**
1. Check that the component unmounts properly
2. Verify interval cleanup in useEffect
3. Check console for `🛑 [MAINTENANCE-CHECK]` message

### Issue: Admin still sees maintenance screen

**Solution:**
1. Verify user role is exactly `'admin'` (lowercase)
2. Check `isAuthenticated` is true
3. Use `isAdmin` return value to debug
4. Check Redux auth state

### Issue: Excessive API calls

**Solution:**
1. Verify polling only happens when in maintenance mode
2. Check for multiple instances of the hook
3. Ensure interval is cleared on unmount

## Best Practices

1. **Use Once in App Root** - Call the hook once at the top level of your app (App.js)

2. **Don't Call Multiple Times** - Avoid using the hook in multiple components as it may cause excessive API calls

3. **Handle Loading State** - Always show a loading indicator during initial check

4. **Provide Manual Refresh** - Give users a way to manually check status if needed

5. **Log Admin Access** - Consider logging when admins bypass maintenance mode

6. **Monitor Errors** - Track and report errors from the maintenance check

7. **Test Both Modes** - Test with maintenance both on and off

8. **Test Admin Flow** - Verify admin bypass works correctly

## Testing

### Test Maintenance Mode Active

```javascript
// 1. Enable maintenance on backend
// server/.env: MAINTENANCE_MODE=true

// 2. Start app
// 3. Check hook returns:
expect(isMaintenanceMode).toBe(true);
expect(isLoading).toBe(false);
```

### Test Admin Bypass

```javascript
// 1. Login as admin user
// 2. Enable maintenance on backend
// 3. Check hook returns:
expect(isMaintenanceMode).toBe(false);
expect(isAdmin).toBe(true);
```

### Test Polling

```javascript
// 1. Enable maintenance mode
// 2. Wait for hook to initialize
// 3. Disable maintenance on backend
// 4. Wait 60+ seconds
// 5. Hook should detect and update:
expect(isMaintenanceMode).toBe(false);
```

## Performance

- **Network Requests**: 1 on mount, then 1 every 60 seconds if in maintenance
- **Re-renders**: Minimal - only updates when state actually changes
- **Memory**: Properly cleans up intervals on unmount
- **Redux Updates**: Only dispatches when status changes

## API Requirements

The `/health` endpoint must:

1. Return 200 status when system is operational
2. Return 503 status when in maintenance mode
3. Include maintenance data in 503 response:

```json
{
  "maintenanceMode": true,
  "message": "We're currently performing scheduled maintenance.",
  "estimatedReturn": "soon"
}
```

## See Also

- `MaintenanceMode.jsx` - The maintenance screen component
- `maintenanceSlice.js` - Redux state management
- `MAINTENANCE_MODE_INTEGRATION_GUIDE.md` - Complete setup guide

