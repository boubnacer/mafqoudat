# Deployment Checklist (Student Edition)

## 🎓 GitHub Student Pack Setup
- [ ] Apply for GitHub Student Pack with academic email
- [ ] Wait for approval (1-2 days)
- [ ] Activate MongoDB Atlas through Student Pack
- [ ] Activate Railway through Student Pack
- [ ] Verify you have M2 cluster access (not M0)

## 🗄️ Database Setup (MongoDB Atlas - Student Pack)
- [ ] Create MongoDB Atlas account with academic email
- [ ] Create new project "Mafqoudat"
- [ ] Create **M2** cluster (Student Pack benefit)
- [ ] Create database user with read/write permissions
- [ ] Configure network access (allow all IPs: 0.0.0.0/0)
- [ ] Get connection string and save it
- [ ] Test database connection

## ☁️ Image Storage Setup (Cloudinary)
- [ ] Create Cloudinary account
- [ ] Get Cloud Name, API Key, and API Secret
- [ ] Create upload preset (unsigned)
- [ ] Test image upload functionality
- [ ] Save all credentials

## 🚂 Backend Deployment (Railway - Student Pack)
- [ ] Activate Railway through GitHub Student Pack
- [ ] Create Railway account with GitHub
- [ ] Create new project
- [ ] Connect GitHub repository
- [ ] Configure service settings:
  - Root Directory: `server`
  - Build Command: `npm install`
  - Start Command: `npm start`
- [ ] Set environment variables:
  - [ ] NODE_ENV=production
  - [ ] PORT=3000
  - [ ] MONGODB_URI=your_m2_connection_string
  - [ ] JWT_SECRET=your_generated_secret
  - [ ] JWT_REFRESH_SECRET=your_generated_secret
  - [ ] FRONTEND_URL=https://mafqoudat.com
  - [ ] CLOUDINARY_CLOUD_NAME=your_cloud_name
  - [ ] CLOUDINARY_API_KEY=your_api_key
  - [ ] CLOUDINARY_API_SECRET=your_api_secret
  - [ ] CLOUDINARY_UPLOAD_PRESET=your_preset
- [ ] Deploy and get Railway URL
- [ ] Test health endpoint: `https://your-railway-url.railway.app/health`

## 🌐 Frontend Deployment (Vercel)
- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Configure project settings:
  - Framework: Create React App
  - Root Directory: `client`
  - Build Command: `npm run build`
  - Output Directory: `build`
- [ ] Set environment variables:
  - [ ] REACT_APP_API_URL=https://your-railway-url.railway.app
  - [ ] REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
  - [ ] REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_preset
  - [ ] REACT_APP_CLOUDINARY_API_KEY=your_api_key
  - [ ] REACT_APP_CLOUDINARY_API_SECRET=your_api_secret
  - [ ] REACT_APP_DOMAIN=https://mafqoudat.com
- [ ] Deploy and get Vercel URL

## 🔗 Domain Configuration (Namecheap)
- [ ] Log into Namecheap account
- [ ] Go to Domain List → Manage mafqoudat.com
- [ ] Go to Advanced DNS
- [ ] Add DNS records:
  - [ ] Type: A, Host: @, Value: 76.76.19.19
  - [ ] Type: CNAME, Host: www, Value: cname.vercel-dns.com
- [ ] In Vercel dashboard, add custom domain: mafqoudat.com
- [ ] Update environment variables with final URLs

## 🧪 Testing
- [ ] Test backend health endpoint
- [ ] Test frontend at mafqoudat.com
- [ ] Test user registration
- [ ] Test user login
- [ ] Test post creation
- [ ] Test image upload
- [ ] Test search functionality
- [ ] Test all major app features

## 📊 Monitoring Setup
- [ ] Enable Railway monitoring
- [ ] Set up Vercel analytics
- [ ] Monitor MongoDB Atlas metrics
- [ ] Set up error tracking (optional)

## 🔒 Security Verification
- [ ] Verify all URLs use HTTPS
- [ ] Check CORS settings
- [ ] Verify JWT tokens are secure
- [ ] Test authentication flow
- [ ] Verify file upload security

## 📝 Documentation
- [ ] Update README with deployment info
- [ ] Document environment variables
- [ ] Create maintenance procedures
- [ ] Set up backup procedures

## 🎉 Launch
- [ ] Announce your site is live!
- [ ] Share with friends and family
- [ ] Monitor for any issues
- [ ] Plan for future improvements

---

**Estimated Time**: 2-4 hours for complete setup
**Cost**: ~$1-2/month (domain only) - FREE with Student Pack!
**Difficulty**: Beginner to Intermediate

## 🎓 Student Benefits Checklist:
- [ ] GitHub Student Pack activated
- [ ] MongoDB M2 cluster (2GB storage)
- [ ] Railway $5/month credit
- [ ] Academic email used for all services
- [ ] Student Pack benefits verified

## 🆘 Student-Specific Help:
- Use your academic email for all services
- Keep Student Pack active by verifying enrollment yearly
- Railway credit resets monthly
- M2 cluster gives you 4x more storage than free tier
- Check GitHub Student Pack for additional benefits

## 💰 Cost Comparison:
**With Student Pack**: ~$1-2/month (domain only)
**Without Student Pack**: ~$5/month
**Savings**: ~$48/year! 