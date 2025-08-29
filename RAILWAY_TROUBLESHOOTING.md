# Railway Deployment Troubleshooting Guide

## Issue: "Deploy Failed" Status Despite "Active" State

This is a common issue with Railway deployments. Here's how to troubleshoot and fix it:

## 🔍 **Step 1: Check Railway Dashboard**

1. **Go to Railway Dashboard**
   - Visit https://railway.app/dashboard
   - Select your project

2. **Check Deployment Status**
   - Look at the "Deployments" tab
   - Check the latest deployment logs
   - Look for any error messages

3. **Check Service Status**
   - Verify if the service shows as "Active"
   - Check if the health check is passing

## 🔧 **Step 2: Verify Configuration Files**

### Check `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "sourceDirectory": "server"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "startCommand": "npm start"
  }
}
```

### Check `server/package.json`
- Ensure `start` script exists: `"start": "node server.js"`
- Verify Node.js version in `engines` field
- Check all dependencies are listed

## 🌐 **Step 3: Test Your Deployment**

### Run the Debug Script
```bash
# Set your Railway URLs as environment variables
export RAILWAY_API_URL="https://your-api-url.railway.app"
export RAILWAY_CLIENT_URL="https://your-client-url.railway.app"

# Run the debug script
node railway-debug.js
```

### Manual Testing
```bash
# Test health endpoint
curl https://your-api-url.railway.app/health

# Test main endpoint
curl https://your-api-url.railway.app/

# Check response headers
curl -I https://your-api-url.railway.app/health
```

## 🔑 **Step 4: Check Environment Variables**

### Required Environment Variables
Make sure these are set in Railway dashboard:

**API Server:**
- `NODE_ENV=production`
- `PORT=3000` (or let Railway set it)
- `MONGODB_URI=your_mongodb_connection_string`
- `JWT_SECRET=your_jwt_secret`
- `EMAIL_USER=your_email`
- `EMAIL_PASS=your_email_password`
- `CLOUDINARY_CLOUD_NAME=your_cloudinary_name`
- `CLOUDINARY_API_KEY=your_cloudinary_key`
- `CLOUDINARY_API_SECRET=your_cloudinary_secret`

**Client:**
- `REACT_APP_API_URL=https://your-api-url.railway.app`

## 🚨 **Step 5: Common Issues and Solutions**

### Issue 1: Health Check Failing
**Symptoms:** Service shows as failed despite being active
**Solution:**
- Verify `/health` endpoint returns 200 status
- Check if MongoDB connection is working
- Ensure server starts without errors

### Issue 2: Build Failures
**Symptoms:** Deployment never completes
**Solution:**
- Check build logs in Railway dashboard
- Verify all dependencies are in `package.json`
- Ensure Node.js version is compatible

### Issue 3: Environment Variables Missing
**Symptoms:** App starts but doesn't work properly
**Solution:**
- Double-check all required env vars are set
- Verify MongoDB connection string format
- Check JWT secret is properly set

### Issue 4: Port Configuration
**Symptoms:** Service starts but not accessible
**Solution:**
- Let Railway set the PORT automatically
- Remove hardcoded port in server.js
- Use `process.env.PORT || 3000`

## 🔄 **Step 6: Redeployment Steps**

### Force Redeploy
1. **In Railway Dashboard:**
   - Go to your service
   - Click "Deploy" → "Deploy Now"
   - Or trigger via Git push

2. **Via Git:**
   ```bash
   git add .
   git commit -m "Fix deployment issues"
   git push origin main
   ```

### Clear Cache and Redeploy
1. **Delete and recreate service** (if needed)
2. **Check for any cached builds**
3. **Verify source directory is correct**

## 📊 **Step 7: Monitoring and Logs**

### Check Logs
```bash
# If you have Railway CLI installed
railway logs

# Or check in Railway dashboard
# Go to your service → Logs tab
```

### Monitor Health
- Set up monitoring for your health endpoint
- Check response times
- Monitor error rates

## 🎯 **Step 8: Verification Checklist**

- [ ] Health endpoint returns 200 OK
- [ ] MongoDB connection successful
- [ ] All environment variables set
- [ ] Build completes without errors
- [ ] Service shows as "Active"
- [ ] No error messages in logs
- [ ] API endpoints responding correctly
- [ ] Client can connect to API

## 🆘 **Step 9: Getting Help**

### Railway Support
- Check Railway documentation: https://docs.railway.app/
- Contact Railway support if issues persist
- Check Railway status page for any outages

### Debug Information
When asking for help, provide:
1. Railway deployment logs
2. Environment variable list (without sensitive values)
3. Error messages from the debug script
4. Screenshots of Railway dashboard

## 🔧 **Quick Fixes**

### If Service Shows "Failed" but is Actually Working:
1. **Redeploy the service**
2. **Check health check configuration**
3. **Verify the health endpoint is accessible**

### If Build Fails:
1. **Check package.json for missing dependencies**
2. **Verify Node.js version compatibility**
3. **Check for syntax errors in code**

### If Environment Variables are Wrong:
1. **Update variables in Railway dashboard**
2. **Redeploy after changes**
3. **Verify variables are being read correctly**

---

**Note:** The "Deploy Failed" status sometimes appears due to Railway's health check timing out or failing, even when the service is actually running correctly. This is a known issue with Railway's status reporting.
