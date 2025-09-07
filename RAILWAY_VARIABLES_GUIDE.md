# Railway Environment Variables Setup Guide

## 🚨 **Why Your App is Crashing**

Your app goes from "completed/active" to "crushed" because Railway can't find the environment variables it needs. The `${{shared.VARIABLE_NAME}}` syntax doesn't work - you need to set actual values.

## 📋 **Step-by-Step Railway Setup**

### 1. **Go to Railway Dashboard**
- Open your Railway project
- Click on your service (backend)
- Go to the **"Variables"** tab

### 2. **Remove All Shared Variables**
- Delete all variables that use `${{shared.}}` syntax
- You need to set actual values, not references

### 3. **Add These Environment Variables**

Click **"New Variable"** and add each one:

| Variable Name | Value |
|---------------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | `mongodb+srv://mafqoudat:your_password@cluster0.mongodb.net/mafqoudat?retryWrites=true&w=majority` |
| `JWT_SECRET` | `a40b939e025ac7bdaf69b6a2696aa6da25e6df2d82d7802673d9c553d211b9a150d681a9a627bdc0c170eb1db95ce1ea778d66c7918c4a175da486ed237682d6` |
| `JWT_REFRESH_SECRET` | `2164313d8e5397a33ac2a05c096700b312cd69058eed46558af4a7d156aba8ef150c88b72d2418ee23ec2aef996a739d645eb754b18470d45159ae0cab52c324` |
| `FRONTEND_URL` | `https://mafqoudat.com` |
| `CLOUDINARY_CLOUD_NAME` | `du0tmvxhu` |
| `CLOUDINARY_API_KEY` | `593667419254217` |
| `CLOUDINARY_API_SECRET` | `HyNgn7OcNYUAFIENfnDVvbqQnis` |
| `CLOUDINARY_UPLOAD_PRESET` | `mafqoudat` |
| `ADMIN_EMAIL` | `boubkraoui.nacer@gmail.com` |
| `SUPPORT_EMAIL` | `boubkraoui.nacer@gmail.com` |
| `EMAIL_SERVICE` | `gmail` |
| `EMAIL_USER` | `boubkraoui.nacer@gmail.com` |
| `EMAIL_PASS` | `jzrodckhboljxcud` |
| `CLIENT_URL` | `https://mafqoudat.com` |

### 4. **Important Notes**

**For MONGODB_URI:**
- Replace `your_password` with your actual MongoDB password
- If your password contains `@`, encode it as `%40`
- Example: If password is `pass@word`, use `pass%40word`

**JWT Secrets:**
- The secrets above are secure and randomly generated
- Keep them secret and don't share them

### 5. **After Setting Variables**

1. **Save all variables**
2. **Click "Deploy Now"** to trigger a new deployment
3. **Check the logs** to see if the app starts successfully

## 🔧 **Alternative: Use Railway CLI**

If you prefer command line:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Set variables
railway variables set NODE_ENV=production
railway variables set PORT=10000
railway variables set MONGODB_URI="mongodb+srv://mafqoudat:your_password@cluster0.mongodb.net/mafqoudat?retryWrites=true&w=majority"
railway variables set JWT_SECRET="a40b939e025ac7bdaf69b6a2696aa6da25e6df2d82d7802673d9c553d211b9a150d681a9a627bdc0c170eb1db95ce1ea778d66c7918c4a175da486ed237682d6"
railway variables set JWT_REFRESH_SECRET="2164313d8e5397a33ac2a05c096700b312cd69058eed46558af4a7d156aba8ef150c88b72d2418ee23ec2aef996a739d645eb754b18470d45159ae0cab52c324"
railway variables set FRONTEND_URL=https://mafqoudat.com
railway variables set CLOUDINARY_CLOUD_NAME=du0tmvxhu
railway variables set CLOUDINARY_API_KEY=593667419254217
railway variables set CLOUDINARY_API_SECRET=HyNgn7OcNYUAFIENfnDVvbqQnis
railway variables set CLOUDINARY_UPLOAD_PRESET=mafqoudat
```

## 🐛 **Troubleshooting**

**If app still crashes:**
1. Check Railway logs for specific error messages
2. Verify all variables are set correctly
3. Make sure MongoDB password is URL-encoded
4. Ensure Cloudinary upload preset exists

**Common Issues:**
- `MONGODB_URI undefined` → Check if variable is set correctly
- `JWT_SECRET undefined` → Verify JWT variables are set
- `Cloudinary upload failed` → Check Cloudinary credentials
