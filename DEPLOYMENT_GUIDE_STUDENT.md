# Mafqoudat Deployment Guide (Student Edition)

## 🎓 GitHub Student Pack Setup

### Step 1: Get GitHub Student Pack
1. Go to [GitHub Student Pack](https://education.github.com/pack)
2. Sign in with your GitHub account
3. Click "Get student benefits"
4. Select your school and graduation year
5. Upload proof of enrollment (student ID, transcript, etc.)
6. Wait for approval (usually 1-2 days)

### Step 2: Activate MongoDB Atlas (Student Pack)
1. Once approved, go to [GitHub Student Pack](https://education.github.com/pack)
2. Find "MongoDB Atlas" and click "Get access"
3. Create MongoDB Atlas account with your academic email
4. You'll get **M2 cluster (2GB storage)** instead of M0 (512MB)!

## 🗄️ MongoDB Atlas Setup (Student Pack)

### 2.1 Create Database Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign in with your academic email
3. Create a new project called "Mafqoudat"
4. Click "Build a Database"
5. Choose **"M2"** (Student Pack gives you this for free!)
6. Select your preferred cloud provider and region
7. Click "Create"

### 2.2 Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a username and password (save these!)
4. Select "Read and write to any database"
5. Click "Add User"

### 2.3 Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 2.4 Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `mafqoudat`

**Save this connection string for Step 4!**

## ☁️ Image Storage Setup (Cloudinary)

### 3.1 Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Verify your email

### 3.2 Get Cloudinary Credentials
1. Go to your Dashboard
2. Note down:
   - Cloud Name
   - API Key
   - API Secret

### 3.3 Create Upload Preset
1. Go to "Settings" → "Upload"
2. Scroll to "Upload presets"
3. Click "Add upload preset"
4. Set "Signing Mode" to "Unsigned"
5. Set "Folder" to "mafqoudat"
6. Save the preset name

**Save these credentials for Step 4!**

## 🚂 Backend Deployment (Railway)

### 4.1 Activate Railway (Student Pack)
1. Go to [GitHub Student Pack](https://education.github.com/pack)
2. Find "Railway" and click "Get access"
3. You'll get $5/month credit (enough for your app!)

### 4.2 Deploy to Railway
1. Go to [Railway](https://railway.app/)
2. Sign up with your GitHub account
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your mafqoudat repository
6. Railway will automatically detect it's a Node.js app

### 4.3 Configure Railway Settings
1. In Railway dashboard, go to your project
2. Click on the service that was created
3. Go to "Settings" tab
4. Set the following:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 4.4 Set Environment Variables
In Railway dashboard, go to "Variables" and add:
```
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_connection_string_from_step_2
JWT_SECRET=your_secure_jwt_secret_key
JWT_REFRESH_SECRET=your_secure_jwt_refresh_secret_key
FRONTEND_URL=https://mafqoudat.com
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name
```

### 4.5 Deploy
1. Railway will automatically deploy when you push to GitHub
2. Wait for deployment to complete
3. Copy the generated URL (e.g., `https://mafqoudat-backend.railway.app`)

## 🌐 Frontend Deployment (Vercel)

### 5.1 Deploy to Vercel
1. Go to [Vercel](https://vercel.com/)
2. Sign up with your GitHub account
3. Click "New Project"
4. Import your GitHub repository
5. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 5.2 Set Environment Variables
In Vercel dashboard, go to "Settings" → "Environment Variables" and add:
```
REACT_APP_API_URL=https://your-railway-backend-url.railway.app
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
REACT_APP_CLOUDINARY_API_KEY=your_cloudinary_api_key
REACT_APP_CLOUDINARY_API_SECRET=your_cloudinary_api_secret
REACT_APP_DOMAIN=https://mafqoudat.com
```

### 5.3 Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Copy the generated URL (e.g., `https://mafqoudat.vercel.app`)

## 🔗 Domain Configuration (Namecheap)

### 6.1 Configure Vercel Domain
1. In Vercel dashboard, go to "Settings" → "Domains"
2. Add your domain: `mafqoudat.com`
3. Follow the DNS configuration instructions

### 6.2 Configure Namecheap DNS
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

### 6.3 Update Environment Variables
1. Update `REACT_APP_API_URL` in Vercel to use your Railway backend URL
2. Update `FRONTEND_URL` in Railway to use `https://mafqoudat.com`

## 🧪 Testing and Verification

### 7.1 Test Backend
1. Visit your Railway backend URL + `/health`
2. Should return a JSON response with status "OK"

### 7.2 Test Frontend
1. Visit `https://mafqoudat.com`
2. Test all major functionality:
   - User registration/login
   - Post creation
   - Image uploads
   - Search functionality

### 7.3 Test Image Uploads
1. Try uploading an image through your app
2. Verify it appears in your Cloudinary dashboard
3. Check that images load correctly on your site

## 💰 Cost Breakdown (Student Edition)

### **With GitHub Student Pack:**
- **Domain**: ~$10-15/year
- **Railway**: $5/month credit (FREE with Student Pack)
- **Vercel**: Free (with limitations)
- **MongoDB Atlas**: M2 cluster (FREE with Student Pack)
- **Cloudinary**: Free (25GB storage, 25GB bandwidth)

**Total**: ~$1-2/month for domain only!

### **Without Student Pack:**
- **Railway**: $5/month
- **MongoDB Atlas**: Free M0 (512MB)
- **Total**: ~$5/month

## 🎯 Why This Stack is Perfect for Students:

1. **GitHub Student Pack**: Free access to premium services
2. **Railway**: Better developer experience than Render
3. **MongoDB M2**: 4x more storage than free tier
4. **Vercel**: Best-in-class frontend hosting
5. **Cost-effective**: Almost free with Student Pack

## 🚀 Quick Start Commands

```bash
# 1. Run the setup script
chmod +x deploy.sh && ./deploy.sh

# 2. Push to GitHub (Railway will auto-deploy)
git add .
git commit -m "Ready for deployment"
git push origin main

# 3. Follow the checklist in DEPLOYMENT_CHECKLIST_STUDENT.md
```

## 🆘 Student-Specific Tips:

1. **Use your academic email** for all services
2. **Keep Student Pack active** by verifying enrollment yearly
3. **Railway credit** resets monthly, so you won't run out
4. **MongoDB M2** gives you 2GB storage (plenty for your app)
5. **GitHub Student Pack** includes many other useful services

## 📚 Additional Student Benefits:

- **DigitalOcean**: $50 credit
- **Cloudflare**: Free Pro plan
- **Heroku**: Free dynos
- **AWS**: $100 credit
- **And many more!**

This setup will give you a professional-grade deployment at student-friendly prices! 