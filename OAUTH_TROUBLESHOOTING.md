# OAuth Troubleshooting Guide

## Current Issue
OAuth redirect is not being caught by the mobile app. The browser dismisses without returning the callback URL.

## Root Cause
`WebBrowser.openAuthSessionAsync` requires the redirect URL to match **EXACTLY**. If the server redirects to a different URL, WebBrowser will dismiss without catching it.

## Solutions

### Solution 1: Verify Server Environment Variables (MOST IMPORTANT)

**In Railway Dashboard:**
1. Go to your service → Variables tab
2. Check these environment variables:
   - `FRONTEND_URL` should be: `https://mafqoudat.com`
   - `CLIENT_URL` (if used) should also be: `https://mafqoudat.com`

**In Mobile App:**
1. Check `mobile/.env` file
2. `EXPO_PUBLIC_FRONTEND_URL` should be: `https://mafqoudat.com`

**These MUST match exactly!**

### Solution 2: Check Server Logs

When you try Google login, check your Railway server logs. You should see:
```
Redirecting mobile user to web URL (will be intercepted): https://mafqoudat.com/auth/callback?token=...&mobile=true
```

**If you see a different URL**, that's the problem! Update either:
- Server's `FRONTEND_URL` to match mobile app, OR
- Mobile app's `EXPO_PUBLIC_FRONTEND_URL` to match server

### Solution 3: Railway Build Fix

The Railway build error might be preventing the server from deploying correctly:

**Option A: Set Root Directory in Railway**
1. Railway Dashboard → Service → Settings
2. Set **Root Directory** to: `server`
3. Update `railway.json`:
```json
{
  "build": {
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

**Option B: Fix railway.json (Current)**
The current `railway.json` should work if Railway is building from the repo root. If it's not, try setting the root directory to `server` in Railway dashboard.

### Solution 4: Test OAuth Flow Manually

1. **Check server is running**: Visit `https://mafqoudat-production.up.railway.app/` in browser
2. **Test OAuth URL**: Visit `https://mafqoudat-production.up.railway.app/auth/google?mobile=true`
3. **After Google auth**, check what URL it redirects to
4. **Update mobile app** to match that exact URL

## Quick Fix Checklist

- [ ] Railway build is successful (no errors)
- [ ] Server `FRONTEND_URL` = `https://mafqoudat.com`
- [ ] Mobile `EXPO_PUBLIC_FRONTEND_URL` = `https://mafqoudat.com`
- [ ] Both URLs match exactly (including https://)
- [ ] Restart Expo after changing `.env` file
- [ ] Check server logs when testing OAuth

## Next Steps

1. Fix Railway build error first
2. Verify server environment variables
3. Test OAuth and check server logs for redirect URL
4. Update mobile app if redirect URL is different

