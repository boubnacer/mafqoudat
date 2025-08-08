# Mafqoudat Deployment Guide

## Overview
This guide will help you deploy your MERN stack application using:
- **Domain**: Namecheap (mafqoudat.com)
- **Backend**: Render (free tier)
- **Frontend**: Vercel (free tier)
- **Database**: MongoDB Atlas (free tier)
- **Image Storage**: Cloudinary (free tier)

## Step 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new project called "Mafqoudat"

### 1.2 Create Database Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select your preferred cloud provider and region
4. Click "Create"

### 1.3 Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a username and password (save these!)
4. Select "Read and write to any database"
5. Click "Add User"

### 1.4 Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `mafqoudat`

**Save this connection string for Step 3!**

## Step 2: Cloudinary Setup

### 2.1 Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Verify your email

### 2.2 Get Cloudinary Credentials
1. Go to your Dashboard
2. Note down:
   - Cloud Name
   - API Key
   - API Secret

### 2.3 Create Upload Preset
1. Go to "Settings" → "Upload"
2. Scroll to "Upload presets"
3. Click "Add upload preset"
4. Set "Signing Mode" to "Unsigned"
5. Set "Folder" to "mafqoudat"
6. Save the preset name

**Save these credentials for Step 3!**

## Step 3: Backend Deployment (Render)

### 3.1 Prepare Your Repository
1. Make sure your code is pushed to GitHub
2. Ensure your repository structure is:
   ```
   mafqoudat/
   ├── client/
   ├── server/
   ├── render.yaml
   └── README.md
   ```

### 3.2 Deploy to Render
1. Go to [Render](https://render.com/)
2. Sign up with your GitHub account
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: mafqoudat-backend
   - **Environment**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free

### 3.3 Set Environment Variables
In Render dashboard, go to "Environment" and add:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string_from_step_1
JWT_SECRET=your_secure_jwt_secret_key
JWT_REFRESH_SECRET=your_secure_jwt_refresh_secret_key
FRONTEND_URL=https://mafqoudat.com
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name
```

### 3.4 Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Copy the generated URL (e.g., `https://mafqoudat-backend.onrender.com`)

## Step 4: Frontend Deployment (Vercel)

### 4.1 Deploy to Vercel
1. Go to [Vercel](https://vercel.com/)
2. Sign up with your GitHub account
3. Click "New Project"
4. Import your GitHub repository
5. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 4.2 Set Environment Variables
In Vercel dashboard, go to "Settings" → "Environment Variables" and add:
```
REACT_APP_API_URL=https://your-render-backend-url.onrender.com
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
REACT_APP_CLOUDINARY_API_KEY=your_cloudinary_api_key
REACT_APP_CLOUDINARY_API_SECRET=your_cloudinary_api_secret
REACT_APP_DOMAIN=https://mafqoudat.com
```

### 4.3 Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Copy the generated URL (e.g., `https://mafqoudat.vercel.app`)

## Step 5: Domain Configuration

### 5.1 Configure Vercel Domain
1. In Vercel dashboard, go to "Settings" → "Domains"
2. Add your domain: `mafqoudat.com`
3. Follow the DNS configuration instructions

### 5.2 Configure Namecheap DNS
1. Log into your Namecheap account
2. Go to "Domain List" → "Manage" for mafqoudat.com
3. Go to "Advanced DNS"
4. Add these records:
   ```
   Type: A
   Host: @
   Value: 76.76.19.19
   TTL: Automatic
   
   Type: CNAME
   Host: www
   Value: cname.vercel-dns.com
   TTL: Automatic
   ```

### 5.3 Update Environment Variables
1. Update `REACT_APP_API_URL` in Vercel to use your Render backend URL
2. Update `FRONTEND_URL` in Render to use `https://mafqoudat.com`

## Step 6: Testing and Verification

### 6.1 Test Backend
1. Visit your Render backend URL + `/health`
2. Should return a JSON response with status "OK"

### 6.2 Test Frontend
1. Visit `https://mafqoudat.com`
2. Test all major functionality:
   - User registration/login
   - Post creation
   - Image uploads
   - Search functionality

### 6.3 Test Image Uploads
1. Try uploading an image through your app
2. Verify it appears in your Cloudinary dashboard
3. Check that images load correctly on your site

## Step 7: Monitoring and Maintenance

### 7.1 Set Up Monitoring
1. Enable Render's built-in monitoring
2. Set up Vercel analytics
3. Monitor MongoDB Atlas metrics

### 7.2 Regular Maintenance
1. Keep dependencies updated
2. Monitor free tier limits
3. Backup your database regularly

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Ensure `FRONTEND_URL` is set correctly in Render
2. **Database Connection**: Verify MongoDB connection string and network access
3. **Image Upload Failures**: Check Cloudinary credentials and upload preset
4. **Build Failures**: Check Node.js version compatibility

### Support Resources:
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

## Cost Breakdown (Monthly)
- **Domain**: ~$10-15/year
- **Render**: Free (with limitations)
- **Vercel**: Free (with limitations)
- **MongoDB Atlas**: Free (512MB storage)
- **Cloudinary**: Free (25GB storage, 25GB bandwidth)

**Total**: ~$1-2/month for domain only!

## Next Steps
1. Set up SSL certificates (automatic with Vercel)
2. Configure custom error pages
3. Set up automated backups
4. Implement monitoring and alerting
5. Consider upgrading to paid tiers as your app grows 