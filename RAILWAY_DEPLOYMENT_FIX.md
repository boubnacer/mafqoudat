# Railway Deployment Fix Guide

## 🚨 **Current Issue**
Your Railway deployment is failing with SIGTERM error, which means the server is crashing on startup. This is causing the 404 errors on your frontend.

## 🔍 **Root Cause**
The server is likely failing to connect to the database because:
1. **Environment variables not set correctly** in Railway
2. **Database connection string pointing to wrong database**
3. **Missing required environment variables**

## ✅ **Step-by-Step Fix**

### **Step 1: Check Railway Environment Variables**

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/dashboard
   - Select your project
   - Click on your backend service

2. **Go to Variables Tab**
   - Click on "Variables" in the left sidebar
   - Check if these variables are set correctly

### **Step 2: Set Required Environment Variables**

Add/update these environment variables in Railway:

| Variable Name | Value |
|---------------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | `mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0` |
| `JWT_SECRET` | `41D29F2F44B69B279D1FCD12CF7027BBAAB34AF8DC570476CE5803DD03FE4DC2` |
| `JWT_REFRESH_SECRET` | `9BB3EC1735B9DC24710B1E8CBAC75067F6A0D25736D126C0AF95B31520F82532` |
| `FRONTEND_URL` | `https://mafqoudat.com` |
| `CLOUDINARY_CLOUD_NAME` | `du0tmvxhu` |
| `CLOUDINARY_API_KEY` | `593667419254217` |
| `CLOUDINARY_API_SECRET` | `HyNgn7OcNYUAFIENfnDVvbqQnis` |

### **Step 3: Important Notes**

**For MONGODB_URI:**
- Make sure it ends with `/mafqoudat?` (not `/test?`)
- The `@` in your password is already URL encoded as `%40`
- This should point to your main database

**JWT Secrets:**
- These are secure random strings
- Keep them secret and don't share them

### **Step 4: Deploy After Setting Variables**

1. **Save all variables** in Railway
2. **Click "Deploy Now"** to trigger a new deployment
3. **Check the logs** to see if the server starts successfully

### **Step 5: Verify Deployment**

After deployment, test these endpoints:

1. **Health Check:**
   ```
   https://mafqoudat-production.up.railway.app/health
   ```

2. **Countries API:**
   ```
   https://mafqoudat-production.up.railway.app/countries?language=ar&active=true
   ```

3. **Categories API:**
   ```
   https://mafqoudat-production.up.railway.app/categories?language=ar&active=true
   ```

## 🔧 **Alternative: Use Railway CLI**

If you prefer, you can set variables using Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Set variables
railway variables set NODE_ENV=production
railway variables set PORT=10000
railway variables set MONGODB_URI="mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0"
railway variables set JWT_SECRET="41D29F2F44B69B279D1FCD12CF7027BBAAB34AF8DC570476CE5803DD03FE4DC2"
railway variables set JWT_REFRESH_SECRET="9BB3EC1735B9DC24710B1E8CBAC75067F6A0D25736D126C0AF95B31520F82532"
railway variables set FRONTEND_URL="https://mafqoudat.com"
railway variables set CLOUDINARY_CLOUD_NAME="du0tmvxhu"
railway variables set CLOUDINARY_API_KEY="593667419254217"
railway variables set CLOUDINARY_API_SECRET="HyNgn7OcNYUAFIENfnDVvbqQnis"

# Deploy
railway up
```

## 🎯 **Expected Results**

After fixing the environment variables:

1. **Server should start successfully** without SIGTERM errors
2. **Health endpoint should return 200** with server status
3. **API endpoints should return data** instead of 404
4. **Frontend should work** without infinite loading

## 🚨 **If Still Failing**

If the server still crashes after setting variables:

1. **Check Railway logs** for specific error messages
2. **Verify database connection** by testing locally
3. **Check if all required files** are in the server directory
4. **Ensure package.json** has correct start script

## 📞 **Next Steps**

1. **Set the environment variables** in Railway dashboard
2. **Deploy the changes**
3. **Test the health endpoint**
4. **Check if your frontend works**

Your database is ready and working - the issue is just the Railway deployment configuration! 🎯
