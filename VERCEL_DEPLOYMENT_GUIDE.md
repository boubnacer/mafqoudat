# Vercel Deployment Guide for Mafqoudat Frontend

## 🚀 **Deploy Your React App to Vercel**

### **Step 1: Prepare Your Repository**
Make sure your code is pushed to GitHub and ready for deployment.

### **Step 2: Connect to Vercel**
1. Go to [Vercel](https://vercel.com)
2. Sign up/Login with your GitHub account
3. Click **"New Project"**
4. Import your GitHub repository
5. Select the repository: `mafqoudat`

### **Step 3: Configure Build Settings**
- **Framework Preset:** `Create React App`
- **Root Directory:** `client` (since your React app is in the client folder)
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`

### **Step 4: Set Environment Variables**
Click **"Environment Variables"** and add these:

| Variable Name | Value |
|---------------|-------|
| `REACT_APP_API_URL` | `https://mafqoudat-production.up.railway.app` |
| `REACT_APP_DOMAIN` | `https://mafqoudat.com` |
| `REACT_APP_CLOUDINARY_CLOUD_NAME` | `du0tmvxhu` |
| `REACT_APP_CLOUDINARY_UPLOAD_PRESET` | `mafqoudat` |
| `REACT_APP_CLOUDINARY_API_KEY` | `593667419254217` |

### **Step 5: Deploy**
1. Click **"Deploy"**
2. Wait for the build to complete
3. Your app will be available at a Vercel URL

### **Step 6: Custom Domain (Optional)**
1. Go to your project settings
2. Click **"Domains"**
3. Add your custom domain: `mafqoudat.com`

## 🔧 **Important Notes:**

### **Environment Variables Explained:**
- **`REACT_APP_API_URL`**: Points to your Railway backend
- **`REACT_APP_DOMAIN`**: Your main domain for CORS
- **`REACT_APP_CLOUDINARY_*`**: For frontend image uploads (no secret needed)

### **Security:**
- ✅ **Safe to include in frontend**: Cloudinary cloud name, upload preset, API key
- ❌ **Never include in frontend**: Cloudinary API secret (handled by backend)

### **CORS Configuration:**
Your Railway backend is already configured to accept requests from:
- `https://mafqoudat.com`
- `http://localhost:3000` (for development)

## 🐛 **Troubleshooting:**

### **Build Errors:**
- Make sure you're setting the root directory to `client`
- Check that all dependencies are in `client/package.json`

### **API Connection Issues:**
- Verify `REACT_APP_API_URL` points to your Railway backend
- Check that your Railway backend is running
- Test the API URL directly: `https://mafqoudat-production.up.railway.app/health`

### **Image Upload Issues:**
- Verify Cloudinary upload preset exists
- Check that the preset is set to "unsigned" mode
- Ensure the preset allows the file types you're uploading

## 📱 **Testing Your Deployment:**

1. **Test API Connection:**
   - Visit your Vercel app
   - Try to log in (this will test API connectivity)

2. **Test Image Upload:**
   - Create a new post with an image
   - Verify the image uploads successfully

3. **Test All Features:**
   - User registration/login
   - Post creation/editing
   - Image uploads
   - Search functionality

## 🔄 **Automatic Deployments:**
Vercel will automatically redeploy when you push changes to your main branch.

## 📞 **Need Help?**
- Check Vercel build logs for specific errors
- Verify all environment variables are set correctly
- Test your Railway backend is working independently
