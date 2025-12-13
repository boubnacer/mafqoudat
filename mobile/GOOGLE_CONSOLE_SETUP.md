# Google OAuth Console Setup for Mobile App

This guide will help you properly configure Google OAuth Console for your mobile app to fix the 400 redirect error.

## 🚨 Current Issue
The mobile app is getting a 400 error when selecting a Google account because the redirect URI `mafqoudat://auth` is not properly configured in the Google OAuth Console.

## 📋 Required Steps

### 1. Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services** → **Credentials**

### 2. Configure OAuth 2.0 Client ID
1. Find your existing OAuth 2.0 Client ID for Web application
2. Click on it to edit
3. In **Authorized redirect URIs**, add:
   ```
   mafqoudat://auth
   ```

### 3. Alternative: Create Mobile App Client ID
If you prefer to create a separate client ID for mobile:

1. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
2. Select **Android** or **iOS** as application type
3. For Android:
   - Package name: `com.yourcompany.mafqoudat` (check your app.json for exact package name)
   - SHA-1 certificate fingerprint: Get this from your signing certificate
4. For iOS:
   - Bundle ID: `com.yourcompany.mafqoudat` (check your app.json for exact bundle ID)

### 4. Update Mobile App Configuration

#### Option A: Use Web Client ID (Recommended)
Update `mobile/src/config/api.js`:
```javascript
export const GOOGLE_WEB_CLIENT_ID = "your-web-client-id-here";
```

#### Option B: Use Mobile Client ID
If you created a mobile client ID, update the configuration accordingly.

### 5. Verify Configuration

#### Check Current Configuration
Run this test to verify your setup:
```bash
cd mafqoudat/mobile
node test_new_auth.js
```

#### Test the OAuth Flow
1. Start the server: `cd ../server && npm start`
2. Start the mobile app: `npm start`
3. Try Google Sign In and check console logs

## 🔍 Debugging Steps

### 1. Check Console Logs
Look for these log messages:
```
🔧 Initializing AuthRequest with config: {
  clientId: "1234567890...",
  redirectUri: "mafqoudat://auth",
  responseType: "code"
}
```

### 2. Verify Redirect URI
The redirect URI in the logs must exactly match what's configured in Google Console:
- Mobile app uses: `mafqoudat://auth`
- Google Console must have: `mafqoudat://auth`

### 3. Common Issues

#### Issue: "redirect_uri_mismatch"
**Cause**: Redirect URI in Google Console doesn't match what the app is using
**Fix**: Add `mafqoudat://auth` to authorized redirect URIs in Google Console

#### Issue: "invalid_client"
**Cause**: Client ID is incorrect or not properly configured
**Fix**: Verify the GOOGLE_WEB_CLIENT_ID in your config matches the Google Console

#### Issue: "access_denied"
**Cause**: User denied access or OAuth consent screen not configured
**Fix**: Configure OAuth consent screen in Google Console

## 📱 Testing Checklist

- [ ] Google Console has `mafqoudat://auth` in authorized redirect URIs
- [ ] Client ID in mobile config matches Google Console
- [ ] Server is running and accessible
- [ ] Mobile app can reach the server
- [ ] No firewall blocking the requests

## 🛠️ Advanced Configuration

### Custom Scheme
If you want to use a different scheme than `mafqoudat`:

1. Update `mobile/app.json`:
```json
{
  "expo": {
    "scheme": "your-custom-scheme"
  }
}
```

2. Update `mobile/src/utils/googleAuthNew.js`:
```javascript
this.redirectUri = 'your-custom-scheme://auth';
```

3. Update Google Console with the new redirect URI

### Environment Variables
For better security, use environment variables:

1. Create `.env` file in mobile directory:
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-actual-client-id
EXPO_PUBLIC_API_URL=https://your-server-url.com
```

2. Update `mobile/src/config/api.js`:
```javascript
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
```

## 🆘 Still Having Issues?

1. **Check the exact error message** in the mobile app console
2. **Verify the redirect URI** in Google Console matches exactly
3. **Ensure the client ID** is correct and not mixed up with client secret
4. **Check server logs** for any errors during token exchange
5. **Test with a simple web OAuth flow** to isolate the issue

## 📞 Support

If you're still stuck, please provide:
1. The exact error message from the mobile app
2. Console logs from both mobile app and server
3. Screenshot of your Google Console configuration
4. The redirect URI you're using vs what's configured in Google Console
