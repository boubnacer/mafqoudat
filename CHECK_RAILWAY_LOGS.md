# CRITICAL: Check Railway Server Logs

## The Problem
WebBrowser is dismissing without catching the OAuth redirect. This means either:
1. Server is redirecting to a different URL than expected
2. Server isn't detecting mobile correctly
3. URL mismatch between server and mobile app

## IMMEDIATE ACTION REQUIRED

### Step 1: Check Railway Server Logs

1. Go to **Railway Dashboard** → Your Service → **Logs** tab
2. Try Google login in the mobile app
3. Look for these log messages in Railway:

```
🔵 Google OAuth initiation:
🔵 isMobile: true/false
🔵 query.mobile: true
🔵 FRONTEND_URL env: ???
```

And then:

```
🔵 MOBILE REDIRECT: https://???/auth/callback?token=...
🔵 Frontend URL used: ???
```

### Step 2: Compare URLs

**Mobile app expects:**
- `https://mafqoudat.com/auth/callback`

**Server should redirect to:**
- `https://mafqoudat.com/auth/callback?token=...&mobile=true`

**If server redirects to a DIFFERENT URL**, that's the problem!

### Step 3: Fix the Mismatch

**If server FRONTEND_URL is different:**
1. Railway Dashboard → Service → Variables
2. Set `FRONTEND_URL` = `https://mafqoudat.com`
3. Redeploy

**OR update mobile app:**
1. Check what URL server redirects to (from logs)
2. Update `mobile/.env`:
   ```
   EXPO_PUBLIC_FRONTEND_URL=<url-from-server-logs>
   ```
3. Restart Expo

## What to Share

Please share from Railway logs:
1. The `🔵 MOBILE REDIRECT:` line (shows actual redirect URL)
2. The `🔵 Frontend URL used:` line (shows server's FRONTEND_URL)
3. The `🔵 isMobile:` value (should be `true`)

This will tell us exactly what's wrong!

