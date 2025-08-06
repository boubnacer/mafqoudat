# 🚀 Mafkoudat Deployment Guide

## 📋 **Prerequisites**
- Node.js 16+ installed
- Git repository set up
- Domain name purchased (optional)

## 🎯 **Recommended Deployment Strategy**

### **Option 1: Vercel + Railway (Most Cost-Effective)**
- **Frontend**: Vercel (Free tier)
- **Backend**: Railway ($5/month)
- **Database**: MongoDB Atlas (Free tier)

### **Option 2: Render (All-in-One)**
- **Frontend**: Static Site (Free)
- **Backend**: Web Service ($7/month)
- **Database**: MongoDB Atlas (Free tier)

## 🔧 **Step 1: Database Setup (MongoDB Atlas)**

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for free account
   - Create a new cluster (M0 Free tier)

2. **Configure Database**
   - Create database user with password
   - Get connection string
   - Add your IP to whitelist (or 0.0.0.0/0 for all IPs)

3. **Connection String Format**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/mafkoudat?retryWrites=true&w=majority
   ```

## 🚀 **Step 2: Backend Deployment (Railway)**

1. **Prepare Backend**
   ```bash
   cd server
   npm install
   ```

2. **Deploy to Railway**
   - Go to [Railway](https://railway.app)
   - Connect your GitHub repository
   - Select the `server` folder
   - Set environment variables:
     ```
     NODE_ENV=production
     DATABASE_URI=your_mongodb_atlas_connection_string
     ACCESS_TOKEN_SECRET=your_secure_random_string
     REFRECH_TOKEN_SECRET=your_secure_random_string
     FRONTEND_URL=https://your-frontend-domain.com
     ```

3. **Get Backend URL**
   - Railway will provide a URL like: `https://your-app.railway.app`

## 🌐 **Step 3: Frontend Deployment (Vercel)**

1. **Prepare Frontend**
   ```bash
   cd client
   npm install
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Connect your GitHub repository
   - Set root directory to `client`
   - Add environment variable:
     ```
     REACT_APP_API_URL=https://your-backend-url.railway.app
     ```

3. **Get Frontend URL**
   - Vercel will provide a URL like: `https://your-app.vercel.app`

## 🔗 **Step 4: Domain Configuration**

### **If using Namecheap:**

1. **DNS Configuration**
   - Log into Namecheap
   - Go to Domain List → Manage
   - Go to Advanced DNS
   - Add records:

   **For Frontend (Vercel):**
   ```
   Type: CNAME
   Host: www
   Value: your-app.vercel.app
   TTL: Automatic
   ```

   **For Backend (Railway):**
   ```
   Type: CNAME
   Host: api
   Value: your-app.railway.app
   TTL: Automatic
   ```

2. **Update Environment Variables**
   - Update `FRONTEND_URL` in Railway to your domain
   - Update `REACT_APP_API_URL` in Vercel to your API subdomain

## 🔒 **Step 5: Security Configuration**

1. **Generate Secure Secrets**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Update Environment Variables**
   - Use generated secrets for JWT tokens
   - Set strong passwords for database

3. **SSL/HTTPS**
   - Vercel and Railway provide automatic SSL
   - Ensure all URLs use HTTPS

## 📁 **File Storage (Optional)**

For production file uploads, consider:
- **AWS S3** (most popular)
- **Cloudinary** (image-focused)
- **Firebase Storage** (Google ecosystem)

## 🔍 **Step 6: Testing**

1. **Health Check**
   - Visit: `https://your-backend-url.com/health`

2. **Frontend Test**
   - Visit your frontend URL
   - Test login/registration
   - Test file uploads

3. **API Test**
   - Test all API endpoints
   - Verify CORS is working

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **CORS Errors**
   - Check `allowedOrigins.js` includes your domain
   - Verify environment variables are set correctly

2. **Database Connection**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string format

3. **Build Errors**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

## 💰 **Cost Breakdown**

### **Vercel + Railway:**
- Vercel: Free (up to 100GB bandwidth)
- Railway: $5/month
- MongoDB Atlas: Free (512MB storage)
- **Total: ~$5/month**

### **Render:**
- Frontend: Free
- Backend: $7/month
- MongoDB Atlas: Free
- **Total: ~$7/month**

## 📞 **Support**

- **Vercel**: Excellent documentation and support
- **Railway**: Good Discord community
- **MongoDB Atlas**: Comprehensive guides

## 🔄 **Continuous Deployment**

Both Vercel and Railway support automatic deployments:
- Push to main branch → automatic deployment
- Preview deployments for pull requests
- Easy rollback options 