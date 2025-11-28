# URGENT: Railway Build Fix

## Current Error
```
/bin/bash: line 1: cd: server: No such file or directory
```

## The Problem
Railway is trying to `cd server` but the server directory doesn't exist in the build context. This happens when Railway builds from the repo root but the files are structured differently.

## IMMEDIATE FIX (Choose One)

### Option 1: Set Root Directory in Railway Dashboard (BEST SOLUTION)

1. **Go to Railway Dashboard**
2. **Your Service → Settings**
3. **Find "Root Directory"** (or "Source" settings)
4. **Set it to: `server`**
5. **Save and redeploy**

Then update `railway.json` to:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/"
  }
}
```

### Option 2: Use Railway Service Source Settings

1. **Railway Dashboard → Service → Settings → Source**
2. **Set "Root Directory" to: `server`**
3. **Or set "Watch Path" to: `server/**`**

### Option 3: Create a Railway Service for Server Only

If the above doesn't work:
1. Create a new Railway service
2. Connect it to the same GitHub repo
3. Set Root Directory to `server`
4. This service will only build the server

## Why This Happens

Railway is building from the monorepo root, but trying to run commands in the `server/` subdirectory. Setting the Root Directory tells Railway to build directly from `server/`, so all paths are relative to that directory.

## After Fixing

1. The build should succeed
2. Healthcheck should pass
3. Server should start on port (check Railway variables for PORT)
4. Then test OAuth

## Quick Test

After setting root directory, the build logs should show:
- ✅ `npm install` (not `cd server && npm install`)
- ✅ `npm start` (not `cd server && npm start`)
- ✅ Healthcheck passing

