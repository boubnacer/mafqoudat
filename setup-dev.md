# 🚀 Quick Development Setup

## **Immediate Fix for Your Current Issue**

The 404 errors you're seeing are because **MongoDB is not running locally**. Here's how to fix it:

### **Option 1: Quick Fix with MongoDB Atlas (Recommended)**

1. **Follow the MongoDB Atlas setup** in `MONGODB_SETUP.md`
2. **Update your .env file** with the Atlas connection string
3. **Restart your server**

### **Option 2: Install MongoDB Locally**

1. **Download MongoDB Community Server**
   - Go to: https://www.mongodb.com/try/download/community
   - Download for Windows
   - Install with default settings

2. **Start MongoDB Service**
   ```bash
   net start MongoDB
   ```

3. **Test if MongoDB is running**
   ```bash
   mongo --version
   ```

## **Step-by-Step Fix**

### **1. Set up MongoDB Atlas (5 minutes)**

1. Go to https://www.mongodb.com/atlas
2. Create free account
3. Create M0 Sandbox cluster
4. Create database user
5. Allow all IPs (0.0.0.0/0)
6. Get connection string

### **2. Update Environment Variables**

Create/update `server/.env`:
```
DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/mafkoudat?retryWrites=true&w=majority
ACCESS_TOKEN_SECRET=your_secret_here
REFRECH_TOKEN_SECRET=your_secret_here
PORT=3500
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### **3. Test the Setup**

```bash
# Start server
npm run dev

# In another terminal, seed the database
npm run seed

# Test API
curl http://localhost:3500/countries?language=en&active=true
```

## **Expected Results**

After setup, you should see:
- ✅ Server starts without errors
- ✅ Database connection successful
- ✅ API endpoints return data instead of 404
- ✅ Frontend loads properly

## **Common Issues & Solutions**

### **Issue: "MongoDB connection failed"**
**Solution:** Check your connection string and network access

### **Issue: "Authentication failed"**
**Solution:** Verify username/password in connection string

### **Issue: "Network access denied"**
**Solution:** Add your IP to MongoDB Atlas whitelist

## **Next Steps After Fix**

1. **Test all API endpoints**
2. **Run the frontend** (`cd client && npm start`)
3. **Test the full application**
4. **Follow deployment guide** in `DEPLOYMENT_GUIDE.md`

## **Need Help?**

- Check MongoDB Atlas documentation
- Verify your connection string format
- Ensure all environment variables are set
- Check server logs for specific error messages 