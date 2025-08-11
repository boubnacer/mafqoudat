# Railway Environment Variables Setup

## Current Issue
Your Railway app is crashing because the shared environment variables are not properly configured.

## Solution: Set Environment Variables Directly

Instead of using shared variables, set these environment variables directly in your Railway project:

### 1. Go to Railway Dashboard
- Open your Railway project
- Go to "Variables" tab
- Remove all the shared variable references

### 2. Add These Environment Variables Directly:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://mafqoudat:your_actual_password@cluster0.mongodb.net/mafqoudat?retryWrites=true&w=majority
JWT_SECRET=your_actual_jwt_secret_here
JWT_REFRESH_SECRET=your_actual_jwt_refresh_secret_here
FRONTEND_URL=https://mafqoudat.com
CLOUDINARY_CLOUD_NAME=du0tmvxhu
CLOUDINARY_API_KEY=593667419254217
CLOUDINARY_API_SECRET=HyNgn7OcNYUAFIENfnDVvbqQnis
CLOUDINARY_UPLOAD_PRESET=mafqoudat
```

### 3. Important Notes:
- Replace `your_actual_password` with your real MongoDB password
- Replace `your_actual_jwt_secret_here` with a real JWT secret (you can generate one)
- Replace `your_actual_jwt_refresh_secret_here` with a real JWT refresh secret
- If your MongoDB password contains special characters like `@`, encode them as `%40`

### 4. Generate JWT Secrets:
You can generate secure JWT secrets using this command:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. After Setting Variables:
- Click "Deploy Now" to trigger a new deployment
- Check the logs to see if the app starts successfully

## Alternative: Use Railway CLI
If you prefer, you can also set these using Railway CLI:
```bash
railway variables set NODE_ENV=production
railway variables set PORT=10000
# ... etc for each variable
```

