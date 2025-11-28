# Railway Build Fix - Server Directory Not Found

## Problem
Railway build fails with: `/bin/bash: line 1: cd: server: No such file or directory`

## Root Cause
Railway/Nixpacks is running `npm ci` at the root level, then trying to `cd server`, but the build context might be different.

## Solutions (Try in order)

### Solution 1: Set Root Directory in Railway Dashboard (RECOMMENDED)

1. Go to Railway Dashboard → Your Service → Settings
2. Find **Root Directory** setting
3. Set it to: `server`
4. Update `railway.json` to:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

This tells Railway to build directly from the `server/` directory, so no `cd server` is needed.

### Solution 2: Use nixpacks.toml (Already Created)

I've created a `nixpacks.toml` file that should handle the build. Railway will automatically use this if it exists.

If Solution 1 doesn't work, the `nixpacks.toml` file should help.

### Solution 3: Check .railwayignore

Make sure `server/` is NOT in `.railwayignore`. Currently it's not, which is correct.

### Solution 4: Manual Build Command Override

In Railway Dashboard → Service → Settings → Build:
- Set **Build Command** to: `npm install --prefix server`
- Set **Start Command** to: `npm start --prefix server`

## Security Warnings (Non-blocking)

The warnings about secrets in ARG/ENV are just security recommendations, not errors. They won't prevent the build from succeeding. However, for best practices:

- Railway automatically injects environment variables at runtime
- You don't need ARG/ENV in Dockerfile for secrets
- Railway handles secrets securely through their dashboard

## After Fixing

1. Commit and push the changes
2. Railway will automatically redeploy
3. Check the build logs to confirm it succeeds
4. Then test OAuth again

## Next: OAuth Redirect

Once the build is fixed and server is running:
1. Check Railway logs when testing OAuth
2. Look for: `Redirecting mobile user to web URL...`
3. Verify the redirect URL matches `https://mafqoudat.com/auth/callback`
4. Update mobile app's `EXPO_PUBLIC_FRONTEND_URL` if needed

