# Google OAuth Troubleshooting Guide

## Issue: Browser Returns "dismiss" Type

### Problem
When using Google OAuth in Expo Go, the WebBrowser returns `{"type": "dismiss"}` instead of `{"type": "success"}`. This is a common issue with deep linking in Expo Go.

### Root Cause
Expo Go has limitations with deep linking that can cause the OAuth callback to not be properly intercepted by the app.

### Solutions Implemented

#### 1. **Enhanced Error Handling**
The app now handles the `dismiss` case by:
- Automatically showing manual token input
- Providing clear error messages
- Fallback to copy-paste token method

#### 2. **Deep Link Fallback**
When `dismiss` occurs, the app:
- Waits 1 second for deep link processing
- Checks for pending deep links
- Attempts to parse any available callback URL

#### 3. **Manual Token Fallback**
Users can always:
- Copy token from browser
- Paste in the app
- Complete authentication manually

## Testing Steps

### 1. **Test Automatic Flow**
```bash
cd mafqoudat/mobile
npx expo start --clear
```

1. Open app in Expo Go
2. Click "Continue with Google"
3. Select Google account
4. **Expected**: Automatic redirect back to app
5. **If fails**: Manual token input appears

### 2. **Test Manual Fallback**
1. Click "Continue with Google"
2. Select Google account
3. When browser shows token page:
   - Click "Copy Token" button
   - Return to app
   - Token input should be visible
   - Paste token and click "Use Token"

### 3. **Debug Logs**
Watch console for these key logs:
```
LOG  Redirect URL: mafqoudat://auth/callback
LOG  Auth URL: https://your-server/auth/google?mobile=true&redirect_uri=mafqoudat%3A%2F%2Fauth%2Fcallback
LOG  Auth result: {"type": "dismiss"}  // This is the issue
LOG  Browser dismissed, checking for deep link fallback...
LOG  Current URL after dismiss: exp://172.16.45.42:8081  // No deep link found
```

## Common Scenarios

### ✅ **Working Flow**
```
LOG  Auth result: {"type": "success", "url": "mafqoudat://auth/callback?token=..."}
LOG  OAuth successful, storing token...
```

### ⚠️ **Dismiss with Fallback**
```
LOG  Auth result: {"type": "dismiss"}
LOG  Browser dismissed, checking for deep link fallback...
LOG  Browser dismissed, showing manual token input
```

### ❌ **Complete Failure**
```
LOG  Auth result: {"type": "error"}
ERROR  OAuth error: Authentication failed
```

## Solutions for Different Environments

### **Expo Go (Development)**
- Manual token fallback is expected
- Deep linking limitations are normal
- Use copy-paste method when needed

### **Development Build (Better)**
```bash
npx expo run:android
# or
npx expo run:ios
```
- Deep linking works better
- Automatic redirects more reliable
- Closer to production behavior

### **Production Build**
- Deep linking should work reliably
- Manual fallback rarely needed
- Best user experience

## Server-Side Considerations

### **Mobile Detection**
The server should detect mobile requests:
```javascript
const isMobile = req.query.mobile === 'true' || 
                 req.headers['user-agent']?.includes('Mobile');
```

### **Redirect URI**
Ensure the server uses the correct redirect URI:
```
mafqoudat://auth/callback
```

### **Mobile Callback Page**
The server should serve a mobile-friendly callback page that:
- Shows the token clearly
- Has a "Copy Token" button
- Provides instructions for users

## User Experience Improvements

### **Clear Instructions**
When manual fallback is triggered:
1. Show clear error message
2. Automatically display token input
3. Provide step-by-step instructions

### **Token Handling**
- Auto-focus token input field
- Clear error when user starts typing
- Validate token format before submission

### **Error Recovery**
- Allow retry without app restart
- Clear error states automatically
- Provide multiple fallback options

## Testing Checklist

- [ ] Test in Expo Go (expect manual fallback)
- [ ] Test in development build (better deep linking)
- [ ] Test with existing Google account
- [ ] Test with new Google account
- [ ] Verify manual token copy-paste works
- [ ] Check error messages are helpful
- [ ] Confirm backend receives mobile requests

## Next Steps

1. **Monitor Success Rates**
   - Track automatic vs manual authentication
   - Identify patterns in failures

2. **Improve Deep Linking**
   - Consider development builds for testing
   - Test on physical devices

3. **User Education**
   - Add in-app instructions
   - Provide visual guides for manual fallback

4. **Backend Optimization**
   - Ensure mobile callback pages are user-friendly
   - Add better error handling for mobile requests

## Support

If issues persist:
1. Check console logs for detailed error information
2. Verify server is accessible from mobile device
3. Test with different Google accounts
4. Ensure app.json has correct scheme configuration
5. Consider using development builds for more reliable testing
