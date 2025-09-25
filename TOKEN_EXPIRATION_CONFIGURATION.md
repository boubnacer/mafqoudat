# JWT Token Expiration Configuration

## Overview
This document explains the JWT token expiration configuration for the Mafqoudat application, including the recent improvements made to provide better user experience while maintaining security.

## Current Configuration

### Access Token
- **Default Expiry**: 4 hours (`4h`)
- **Purpose**: Used for API authentication
- **Refresh Strategy**: Automatically refreshed when 20% of lifetime remains (48 minutes before expiry)
- **User Experience**: Users stay logged in for 4 hours of activity before automatic refresh

### Refresh Token
- **Default Expiry**: 7 days (`7d`)
- **Purpose**: Used to generate new access tokens
- **Storage**: HttpOnly cookie (secure)
- **User Experience**: Users stay logged in for up to 7 days if they're active

## Environment Variables

### Production Configuration
```bash
# Access token: 4 hours (good balance of security and user experience)
JWT_ACCESS_EXPIRES_IN=4h

# Refresh token: 7 days (users stay logged in for 1 week)
JWT_REFRESH_EXPIRES_IN=7d
```

### Development Configuration
```bash
# For development, you might want longer tokens
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d
```

## Supported Time Formats

### Access Token Options
- `15m` - 15 minutes (very secure, frequent refreshes)
- `30m` - 30 minutes (secure, moderate refreshes)
- `1h` - 1 hour (recommended - good balance)
- `2h` - 2 hours (less secure, fewer refreshes)
- `4h` - 4 hours (development/testing)
- `8h` - 8 hours (development only)
- `12h` - 12 hours (development only)
- `24h` or `1d` - 1 day (development only)

### Refresh Token Options
- `1d` - 1 day (very secure)
- `3d` - 3 days (secure)
- `7d` - 7 days (recommended - standard practice)
- `14d` - 14 days (less secure)
- `30d` - 30 days (development/testing)

## Security Considerations

### Why 4 Hours for Access Tokens?
1. **Security**: Still secure while providing better user experience
2. **User Experience**: 4 hours covers most user sessions without frequent refreshes
3. **Automatic Refresh**: Tokens are refreshed automatically before expiry
4. **Balance**: Good compromise between security and convenience

### Why 7 Days for Refresh Tokens?
1. **Convenience**: Users don't need to log in every day
2. **Security**: 7 days is a reasonable balance for refresh tokens
3. **Industry Standard**: Most applications use 7-30 days for refresh tokens
4. **HttpOnly Cookies**: Refresh tokens are stored securely in HttpOnly cookies

## Automatic Token Refresh

### How It Works
1. **Proactive Refresh**: Tokens are refreshed when 20% of lifetime remains
2. **Background Refresh**: Happens automatically without user interaction
3. **Fallback**: If refresh fails, user is logged out gracefully
4. **Retry Logic**: Up to 3 attempts with exponential backoff

### Timing Examples
- **4-hour token**: Refreshed at 3 hours 12 minutes (48 minutes before expiry)
- **2-hour token**: Refreshed at 1 hour 36 minutes (24 minutes before expiry)
- **1-hour token**: Refreshed at 48 minutes (12 minutes before expiry)
- **30-minute token**: Refreshed at 24 minutes (6 minutes before expiry)

## Migration from Previous Configuration

### What Changed
- **Before**: Access tokens expired in 15 minutes
- **After**: Access tokens expire in 4 hours
- **Benefit**: Much better user experience, fewer interruptions, longer sessions

### Backward Compatibility
- The old `JWT_EXPIRES_IN` environment variable is still supported
- If you have existing deployments, they will continue to work
- New deployments will use the improved 1-hour default

## Troubleshooting

### Common Issues

#### Users Getting Logged Out Too Frequently
- **Cause**: Access token expiry too short
- **Solution**: Increase `JWT_ACCESS_EXPIRES_IN` to `2h` or `4h`

#### Security Concerns
- **Cause**: Access token expiry too long
- **Solution**: Decrease `JWT_ACCESS_EXPIRES_IN` to `30m` or `15m`

#### Refresh Token Issues
- **Cause**: Refresh token expired
- **Solution**: User needs to log in again (this is expected behavior)

### Monitoring
- Check server logs for JWT-related errors
- Monitor token refresh success rates
- Track user session durations

## Best Practices

### For Production
1. Use `JWT_ACCESS_EXPIRES_IN=1h` (recommended)
2. Use `JWT_REFRESH_EXPIRES_IN=7d` (recommended)
3. Monitor token refresh success rates
4. Implement proper logout functionality

### For Development
1. Use longer tokens for convenience: `JWT_ACCESS_EXPIRES_IN=2h`
2. Keep refresh tokens at 7 days
3. Test token refresh functionality regularly

### For High-Security Applications
1. Use shorter access tokens: `JWT_ACCESS_EXPIRES_IN=15m`
2. Use shorter refresh tokens: `JWT_REFRESH_EXPIRES_IN=1d`
3. Implement additional security measures

## Configuration Examples

### Standard Web Application
```bash
JWT_ACCESS_EXPIRES_IN=4h
JWT_REFRESH_EXPIRES_IN=7d
```

### High-Security Application
```bash
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=1d
```

### Development Environment
```bash
JWT_ACCESS_EXPIRES_IN=4h
JWT_REFRESH_EXPIRES_IN=7d
```

### Mobile Application
```bash
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=30d
```

## Testing

### Manual Testing
1. Log in to the application
2. Wait for token to expire (or use browser dev tools to check token expiry)
3. Verify automatic refresh works
4. Verify logout when refresh fails

### Automated Testing
- Test token generation with different expiry times
- Test token validation with expired tokens
- Test refresh token functionality
- Test logout functionality

## Conclusion

The new token configuration provides:
- ✅ Better user experience (4 hours vs 15 minutes)
- ✅ Maintained security (automatic refresh, secure storage)
- ✅ Configurable settings (environment variables)
- ✅ Backward compatibility (legacy support)
- ✅ Industry best practices (4h access, 7d refresh)

This configuration strikes the right balance between security and user experience for most web applications.
