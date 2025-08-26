# Railway Database Connection Fix

## Issue
The Railway deployment is returning 404 errors for dependencies (countries, categories, found/lost options) even though the data exists in the MongoDB Atlas database.

## Root Cause
The Railway deployment is not connecting to the correct MongoDB database because the `MONGODB_URI` environment variable is not set correctly.

## Solution

### Step 1: Set the Correct MongoDB URI in Railway

1. Go to your Railway dashboard: https://railway.app/dashboard
2. Select your `mafqoudat-production` project
3. Go to the **Variables** tab
4. Add or update the following environment variable:

```
MONGODB_URI=mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0
```

### Step 2: Verify Other Required Environment Variables

Make sure these environment variables are also set in Railway:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
FRONTEND_URL=https://mafqoudat.com
CLOUDINARY_CLOUD_NAME=du0tmvxhu
CLOUDINARY_API_KEY=593667419254217
CLOUDINARY_API_SECRET=HyNgn7OcNYUAFIENfnDVvbqQnis
CLOUDINARY_UPLOAD_PRESET=mafqoudat
```

### Step 3: Redeploy the Application

1. After setting the environment variables, Railway will automatically redeploy
2. Or manually trigger a redeploy from the Railway dashboard

### Step 4: Test the Fix

Run the test script to verify the endpoints are working:

```bash
node test-api-with-correct-db.js
```

Expected output should show:
- ✅ Countries: Status 200 (with data)
- ✅ Categories: Status 200 (with data)  
- ✅ Found/Lost Options: Status 200 (with data)
- ✅ Health Check: Status 200

## Alternative: Update Production Environment File

If you want to update the local production environment file for future deployments:

1. Edit `server/env.production`
2. Replace the placeholder with the actual MongoDB URI:

```env
MONGODB_URI=mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0
```

## Verification

After fixing the environment variables, the frontend should be able to fetch:
- Countries for the country selector
- Categories for the category selector  
- Found/Lost options for the post type selector

The loading issue should be resolved and the site should work properly.
