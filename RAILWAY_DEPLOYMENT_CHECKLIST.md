# Railway Deployment Checklist

## ✅ Pre-Deployment Setup
- [ ] Run `npm install` in server directory to install new dependencies
- [ ] Push all code changes to GitHub
- [ ] Ensure Cloudinary upload preset is created

## 🚂 Railway Deployment Steps

### 1. Create Railway Project
- [ ] Go to [Railway](https://railway.app/)
- [ ] Sign in with GitHub account
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose your mafqoudat repository

### 2. Configure Railway Settings
- [ ] In Railway dashboard, go to your project
- [ ] Click on the service that was created
- [ ] Go to "Settings" tab
- [ ] Set the following:
  - **Root Directory**: `server`
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`

### 3. Set Environment Variables
Add these variables in Railway dashboard → Variables:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_generated_jwt_secret
JWT_REFRESH_SECRET=your_generated_jwt_refresh_secret
FRONTEND_URL=https://mafqoudat.com
CLOUDINARY_CLOUD_NAME=du0tmvxhu
CLOUDINARY_API_KEY=593667419254217
CLOUDINARY_API_SECRET=HyNgn7OcNYUAFIENfnDVvbqQnis
CLOUDINARY_UPLOAD_PRESET=mafqoudat
```

### 4. Generate JWT Secrets
Run these commands to generate secure JWT secrets:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Deploy
- [ ] Railway will automatically deploy when you push to GitHub
- [ ] Wait for deployment to complete
- [ ] Copy the generated URL (e.g., `https://mafqoudat-backend.railway.app`)

## 🧪 Testing

### 6. Test Backend
- [ ] Visit your Railway URL + `/health`
- [ ] Should return JSON with status "OK"
- [ ] Test image upload functionality
- [ ] Verify images are stored in Cloudinary

### 7. Test API Endpoints
- [ ] Test user registration: `POST /auth/register`
- [ ] Test user login: `POST /auth`
- [ ] Test post creation with image: `POST /posts`
- [ ] Test post retrieval: `GET /posts`

## 🔧 Troubleshooting

### Common Issues:
1. **Build Failures**: Check if all dependencies are installed
2. **Environment Variables**: Ensure all variables are set correctly
3. **Cloudinary Errors**: Verify upload preset is created
4. **Database Connection**: Check MongoDB connection string

### Debug Commands:
```bash
# Check Railway logs
railway logs

# Check environment variables
railway variables

# Restart deployment
railway up
```

## 📊 Monitoring

### 8. Set Up Monitoring
- [ ] Enable Railway monitoring
- [ ] Set up error tracking
- [ ] Monitor resource usage
- [ ] Set up alerts for downtime

## 🔗 Next Steps

### 9. Frontend Deployment
- [ ] Deploy frontend to Vercel
- [ ] Update `REACT_APP_API_URL` to your Railway URL
- [ ] Configure domain settings

### 10. Domain Configuration
- [ ] Update `FRONTEND_URL` in Railway to your domain
- [ ] Configure DNS settings
- [ ] Test full application flow

## ✅ Verification Checklist

- [ ] Backend is running on Railway
- [ ] Health endpoint returns OK
- [ ] Database connection is working
- [ ] Image uploads work with Cloudinary
- [ ] JWT authentication is working
- [ ] All API endpoints are accessible
- [ ] Environment variables are set correctly
- [ ] No build errors in Railway logs

## 🆘 Support

If you encounter issues:
1. Check Railway logs for error messages
2. Verify all environment variables are set
3. Ensure Cloudinary upload preset is created
4. Test locally before deploying
5. Check Railway documentation for platform-specific issues
