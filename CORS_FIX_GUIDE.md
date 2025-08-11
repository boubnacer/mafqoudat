# CORS Fix Guide

## 🚨 **Issue:**
Your frontend at `https://mafqoudat.vercel.app` is blocked by CORS when trying to access your backend at `https://mafqoudat-production.up.railway.app`.

## ✅ **Solution:**

### **Step 1: Update Railway Environment Variables**

Go to your Railway dashboard and update the `FRONTEND_URL` environment variable:

1. **Go to Railway Dashboard**
2. **Click on your service**
3. **Go to "Variables" tab**
4. **Find `FRONTEND_URL`**
5. **Change it to:** `https://mafqoudat.vercel.app`
6. **Save changes**
7. **Redeploy the service**

### **Step 2: Verify Allowed Origins**

The `allowedOrigins.js` file has been updated to include:
- `https://mafqoudat.vercel.app` (your Vercel domain)
- `https://mafqoudat.com` (your main domain)
- `https://www.mafqoudat.com` (www version)

### **Step 3: Test the Fix**

After redeploying, test your API:

```bash
curl -H "Origin: https://mafqoudat.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://mafqoudat-production.up.railway.app/categories
```

You should get a response with CORS headers.

### **Step 4: Alternative Quick Fix**

If the above doesn't work, you can temporarily allow all origins by updating `corsOptions.js`:

```javascript
const corsOptions = {
    origin: true, // Allow all origins temporarily
    credentials: true,
    optionsSuccessStatus: 200
}
```

**⚠️ Note:** This is less secure, so only use it for testing.

## 🔧 **Current CORS Configuration:**

Your backend now allows requests from:
- `http://localhost:3000` (local development)
- `https://mafqoudat.vercel.app` (your Vercel frontend)
- `https://mafqoudat.com` (your main domain)
- `https://www.mafqoudat.com` (www version)
- Any URL set in `FRONTEND_URL` environment variable

## 📞 **Next Steps:**
1. Update Railway environment variables
2. Redeploy the service
3. Test your frontend again
4. If still having issues, let me know and I'll help you debug further
