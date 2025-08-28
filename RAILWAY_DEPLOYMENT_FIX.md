# Railway Deployment Fix Guide

## 🚨 Issue Fixed
The Railway deployment was failing with SIGTERM errors due to:
1. Incorrect server startup configuration
2. Missing error handling
3. Improper graceful shutdown

## ✅ Changes Made

### 1. Fixed `server/server.js`
- Moved error handlers outside MongoDB connection callback
- Added proper graceful shutdown handling
- Fixed server startup sequence
- Added SIGTERM and SIGINT handlers

### 2. Fixed `server/package.json`
- Changed start script from `node server` to `node server.js`
- Fixed dev script from `nodemon server` to `nodemon server.js`

### 3. Updated `railway.json`
- Increased healthcheck timeout to 300 seconds
- Added explicit startCommand: `npm start`

## 🚀 How to Deploy

### Option 1: Using Railway CLI
```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up
```

### Option 2: Using Railway Dashboard
1. Go to your Railway project dashboard
2. Connect your GitHub repository
3. Railway will automatically detect the configuration
4. Deploy will use the updated `railway.json`

### Option 3: Using the deployment script
```bash
# Make the script executable (Linux/Mac)
chmod +x deploy-railway-fix.sh

# Run the deployment script
./deploy-railway-fix.sh
```

## 🔍 Verification

After deployment, test the health endpoint:
```bash
curl https://your-app-name.up.railway.app/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-08-28T18:54:22.890Z",
  "uptime": 123.456,
  "environment": "production",
  "version": "1.0.0"
}
```

## 🐛 Troubleshooting

### If deployment still fails:
1. Check Railway logs for specific error messages
2. Verify environment variables are set correctly
3. Ensure MongoDB connection string is valid
4. Check if the port is correctly configured

### Common issues:
- **SIGTERM errors**: Usually fixed by the graceful shutdown handlers
- **Memory issues**: Railway provides limited memory, optimize your app
- **Timeout issues**: Increased healthcheck timeout should help

## 📝 Notes

- The server now properly handles graceful shutdown
- Error handling is improved
- MongoDB connection is properly managed
- Health check endpoint is available at `/health`

## 🎉 Success Indicators

✅ Server starts without errors  
✅ Health endpoint responds correctly  
✅ MongoDB connection established  
✅ No SIGTERM errors in logs  
✅ API endpoints accessible
