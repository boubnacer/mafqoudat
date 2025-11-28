# Railway Build Fix

## Issue
Railway build is failing with: `cd: server: No such file or directory`

## Solution

The Railway build might be running from a different context. Try one of these solutions:

### Option 1: Set Root Directory in Railway Dashboard
1. Go to your Railway project settings
2. Set the **Root Directory** to `server`
3. Update `railway.json` to remove the `cd server` commands:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
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

### Option 2: Use Nixpacks Configuration
Create a `nixpacks.toml` file in the root directory:

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "npm-8_x"]

[phases.install]
cmds = ["cd server && npm install"]

[start]
cmd = "cd server && npm start"
```

### Option 3: Check Railway Service Configuration
1. In Railway dashboard, go to your service
2. Check if the **Source** is set correctly
3. Make sure the `server` directory is included in the deployment

## OAuth Redirect URL Issue

**IMPORTANT**: For OAuth to work, your server's `FRONTEND_URL` environment variable must match your mobile app's `EXPO_PUBLIC_FRONTEND_URL`.

### Check Server Environment Variables in Railway:
1. Go to Railway dashboard → Your service → Variables
2. Make sure `FRONTEND_URL` is set to: `https://mafqoudat.com`
3. If it's different, update it to match `mobile/.env` file

### Current Configuration:
- **Mobile app expects**: `https://mafqoudat.com/auth/callback`
- **Server redirects to**: `${FRONTEND_URL}/auth/callback?token=...&mobile=true`

If these don't match, OAuth will fail!

