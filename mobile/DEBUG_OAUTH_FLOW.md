# Debugging Google OAuth Flow - Step by Step Guide

## Current Issue
You see "Authentication Success" page but the token is not getting rendered. Let's debug this step by step.

## Step 1: Test the Mobile Callback Directly

### Manual Browser Test
1. Open this URL in your browser:
   ```
   https://mafqoudat-production.up.railway.app/auth/mobile-callback?token=test123
   ```

2. Open browser developer tools (F12)
3. Check the **Console** tab - you should see:
   ```
   🔍 Mobile callback received: {token: "EXISTS", pendingToken: "MISSING", error: "MISSING", fullUrl: "..."}
   🔑 Server injected token: test123
   🔍 Starting token extraction...
   📍 Current URL: https://mafqoudat-production.up.railway.app/auth/mobile-callback?token=test123
   🔍 Search params: ?token=test123
   📋 Extracted from URL: {token: "EXISTS", pendingToken: "MISSING", error: "MISSING"}
   ```

4. Check the **Elements** tab - the textarea should contain "test123"

### Expected Result
- Status should change to "✅ Token loaded! Opening app..."
- Token should appear in the textarea
- Deep link should be attempted

## Step 2: Test the Full OAuth Flow

### 1. Start the Mobile App
```bash
cd mafqoudat/mobile
npx expo start --clear
```

### 2. Enable Debug Logging
Watch the Expo Go app logs carefully. You should see:

```
LOG  Initial URL found: exp://172.16.45.42:8081 
LOG  Deep link received: exp://172.16.45.42:8081
LOG  Initiating Google login with simple redirect approach...
LOG  Initiating Google OAuth with simple redirect approach...
LOG  Redirect URL: mafqoudat://auth/callback
LOG  Auth URL: https://mafqoudat-production.up.railway.app/auth/google?mobile=true&redirect_uri=mafqoudat%3A%2F%2Fauth%2Fcallback
LOG  Browser result: {"type": "opened"}
LOG  Google login result: {"message": "OAuth initiated, waiting for callback...", "type": "pending"}
LOG  OAuth initiated, waiting for deep link callback...
```

### 3. Check Server Logs
The server should log:

```
🔍 Google OAuth callback analysis:
   Query params: {state: "...", code: "...", ...}
   User-Agent: Mozilla/5.0... (or Expo Go user agent)
   State: eyJtb2JpbGUiOnRydWUsInJlZGlyZWN0VXJpIjoibWFmcW91ZGF0Oi8vYXV0aC9jYWxsYmFjayJ9
   Parsed state: { isMobile: true, redirectUri: 'mafqoudat://auth/callback' }
   Final mobile detection result: true
```

### 4. Check Mobile Callback Logs
The server should log:

```
🔍 Mobile callback received: {
  token: "EXISTS",
  pendingToken: "MISSING", 
  error: "MISSING",
  fullUrl: "/auth/mobile-callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
📤 Sending mobile callback HTML with injection
```

### 5. Check Browser Console
In the browser that opened for OAuth, open developer tools and check console:

```
🔑 Server injected token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
🔍 Starting token extraction...
📍 Current URL: https://mafqoudat-production.up.railway.app/auth/mobile-callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
🔍 Search params: ?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
📋 Extracted from URL: {token: "EXISTS", pendingToken: "MISSING", error: "MISSING"}
```

## Step 3: Common Issues & Solutions

### Issue 1: Token Not in URL
**Symptom**: Browser shows "Authentication Success" but no token in URL
**Cause**: Server not redirecting properly to mobile-callback
**Solution**: Check server logs for mobile detection

### Issue 2: Token Not Extracted
**Symptom**: Token in URL but not appearing in textarea
**Cause**: JavaScript error in token extraction
**Solution**: Check browser console for JavaScript errors

### Issue 3: Deep Link Not Working
**Symptom**: Token appears but app doesn't open
**Cause**: Deep linking not working in Expo Go
**Solution**: Use manual token input fallback

### Issue 4: Mobile Detection Fails
**Symptom**: Server treats mobile request as web request
**Cause**: State not properly passed through OAuth flow
**Solution**: Check state encoding/decoding

## Step 4: Debug Commands

### Test Mobile Callback Directly
```bash
# Test with sample token
curl "https://mafqoudat-production.up.railway.app/auth/mobile-callback?token=test123"

# Test with pending token  
curl "https://mafqoudat-production.up.railway.app/auth/mobile-callback?pendingToken=test123"
```

### Check Server Response
```javascript
// In browser console
fetch('https://mafqoudat-production.up.railway.app/auth/mobile-callback?token=test123')
  .then(r => r.text())
  .then(html => console.log(html.substring(0, 500)))
```

## Step 5: What to Report Back

Please provide the following information:

### 1. Mobile Callback Test Results
- What happens when you open: `https://mafqoudat-production.up.railway.app/auth/mobile-callback?token=test123`
- Browser console logs
- What appears in the textarea

### 2. Full OAuth Flow Logs
- Mobile app logs (from Expo Go)
- Server logs (if you have access)
- Browser console logs (from OAuth browser)

### 3. Current Behavior
- Exactly what you see on the "Authentication Success" page
- Whether the token appears in the textarea
- Whether the status changes from "Loading token..."

### 4. Expected vs Actual
- What should happen vs what actually happens
- Any error messages you see

## Step 6: Quick Fixes to Try

### Fix 1: Manual Token Test
1. Go to the mobile callback URL with a test token
2. Copy the token from the textarea
3. Paste it in the mobile app's token input
4. See if authentication completes

### Fix 2: Check State Encoding
The mobile state should be:
```
{"mobile":true,"redirectUri":"mafqoudat://auth/callback"}
```
Encoded as base64:
```
eyJtb2JpbGUiOnRydWUsInJlZGlyZWN0VXJpIjoibWFmcW91ZGF0Oi8vYXV0aC9jYWxsYmFjayJ9
```

### Fix 3: Verify Redirect URL
The mobile app should be calling:
```
https://mafqoudat-production.up.railway.app/auth/google?mobile=true&redirect_uri=mafqoudat%3A%2F%2Fauth%2Fcallback
```

## Next Steps

Once you provide the debug information, I can identify the exact issue and provide a targeted fix. The most likely issues are:

1. **State not properly encoded/decoded** - Mobile flag lost during OAuth
2. **Token not in redirect URL** - Server not redirecting correctly  
3. **JavaScript error in browser** - Token extraction failing
4. **Deep linking timing issue** - App not ready to receive deep link

Please run through these debugging steps and report back what you find!
