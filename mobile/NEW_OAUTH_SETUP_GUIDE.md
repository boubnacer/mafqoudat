# New Google OAuth Implementation Setup Guide

## Overview
This guide explains the new Google OAuth implementation for the Mafqoudat mobile app, which fixes the redirect issue and provides a more robust authentication flow.

## What Was Fixed
- **Redirect Issue**: The original implementation used deep linking which caused redirect problems
- **Token Exchange**: Implemented proper server-side token exchange for better security
- **Error Handling**: Added comprehensive error handling and user feedback
- **State Management**: Created a new auth context with proper state management

## Architecture

### New Flow
1. **Mobile App** → Opens Google OAuth via `expo-auth-session`
2. **Google** → Returns authorization code to mobile app
3. **Mobile App** → Sends authorization code to server
4. **Server** → Exchanges code for tokens with Google
5. **Server** → Creates/updates user and returns JWT + user data
6. **Mobile App** → Stores JWT and user data locally

### Files Created/Modified

#### Server Side
- `server/routes/mobileAuthRoutes.js` - New mobile-specific auth routes
- `server/server.js` - Added mobile auth routes

#### Mobile Side
- `mobile/src/utils/googleAuthNew.js` - New Google Auth utility
- `mobile/src/context/AuthContextNew.js` - New auth context
- `mobile/src/screens/LoginScreenNew.js` - New login screen
- `mobile/AppNew.js` - New app entry point

## Setup Instructions

### 1. Server Configuration

#### Environment Variables
Make sure your server has these environment variables:
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret
MONGODB_URI=your-mongodb-uri
```

#### Google Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Find your OAuth 2.0 Client ID
5. Make sure it's configured for "Web application" (not Android)
6. Add authorized redirect URIs for development:
   - `http://localhost:19006/auth` (Expo Go)
   - `exp://127.0.0.1:19000/auth` (Expo Go alternative)

### 2. Mobile Configuration

#### Install Dependencies
```bash
cd mobile
npm install expo-auth-session expo-crypto
```

#### Environment Configuration
Update `mobile/src/config/constants.js`:
```javascript
export const GOOGLE_WEB_CLIENT_ID = 'your-google-web-client-id';
export const API_BASE_URL = 'http://localhost:3500'; // Your server URL
```

#### App Configuration
Update `mobile/app.json` to include the new scheme:
```json
{
  "expo": {
    "scheme": "mafqoudat",
    "web": {
      "bundler": "metro"
    }
  }
}
```

### 3. Testing the Implementation

#### Step 1: Test Server
```bash
cd server
npm start
```
Test the health endpoint:
```bash
curl http://localhost:3500/health
```

#### Step 2: Test Mobile App
```bash
cd mobile
npm start
```

#### Step 3: Test OAuth Flow
1. Open the app in Expo Go
2. Click "Continue with Google"
3. Select your Google account
4. Should redirect back to app automatically
5. Should see home screen if successful

## Debugging

### Common Issues and Solutions

#### 1. Redirect URI Mismatch
**Error**: `redirect_uri_mismatch`
**Solution**: 
- Check the redirect URI in the error message
- Add it to your Google Console authorized redirect URIs
- Make sure `API_BASE_URL` is correct in constants

#### 2. Network Issues
**Error**: Network timeout or connection refused
**Solution**:
- Ensure server is running on correct port
- Check firewall settings
- Verify API_BASE_URL in mobile constants

#### 3. CORS Issues
**Error**: CORS policy error
**Solution**:
- Check server CORS configuration
- Ensure mobile origin is allowed

#### 4. Token Exchange Failure
**Error**: Invalid grant or token exchange failed
**Solution**:
- Check Google Client ID and Secret
- Verify authorization code is not expired
- Check server logs for detailed errors

### Debug Mode
The new implementation includes debug information in development mode:
- Console logs with detailed flow information
- Debug panel on login screen showing state
- Error messages with specific details

## Migration Guide

### From Old Implementation
1. **Backup**: Keep your old files as backup
2. **Update App Entry**: Change `App.js` to import `AppNew` instead
3. **Update Navigation**: Use new auth context throughout the app
4. **Test**: Thoroughly test the new flow

### Example Usage
```javascript
// In any component
import { useAuthNew } from '../context/AuthContextNew';

const MyComponent = () => {
  const { user, signOut } = useAuthNew();
  
  const handleSignOut = () => {
    signOut();
  };
  
  return (
    <View>
      <Text>Welcome, {user?.name}</Text>
      <Button onPress={handleSignOut} title="Sign Out" />
    </View>
  );
};
```

## Security Considerations

1. **Client Secret**: Never expose client secret in mobile app
2. **Token Storage**: Using AsyncStorage for JWT tokens
3. **HTTPS**: Use HTTPS in production
4. **Token Refresh**: Consider implementing token refresh mechanism

## Production Deployment

### Google Console Production Setup
1. Add production redirect URIs to Google Console
2. Update `API_BASE_URL` to production server URL
3. Ensure HTTPS is enabled on server

### Expo Build Configuration
Update `app.json` for production:
```json
{
  "expo": {
    "name": "Mafqoudat",
    "slug": "mafqoudat",
    "scheme": "mafqoudat",
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

## Support

If you encounter issues:
1. Check console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Google Console configuration matches your setup
4. Test server endpoints independently

## Next Steps

1. **Testing**: Thoroughly test the new implementation
2. **Migration**: Gradually migrate other screens to use new auth context
3. **Enhancements**: Add features like token refresh, biometric auth
4. **Monitoring**: Add analytics and error tracking
