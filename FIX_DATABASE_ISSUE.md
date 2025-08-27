# Fix Database Issue - Complete Solution

## 🚨 **Current Situation**

You have:
1. **`mafqoudat` database** - Contains all your data ✅
2. **`test` database** - Empty, keeps getting recreated ❌
3. **Railway deployment** - Should use `mafqoudat` database

## 🔍 **Why Test Database Keeps Getting Recreated**

The `test` database is being created because:

1. **MongoDB Atlas automatically creates a `test` database** when you connect without specifying a database name
2. **Some scripts or connections** might be using a connection string without the database name
3. **MongoDB driver behavior** - when no database is specified, it defaults to `test`

## 🎯 **Solution: Ensure Railway Uses Mafqoudat Database**

### **Step 1: Verify Railway Environment Variables**

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your `mafqoudat-production` project
3. Go to **Variables** tab
4. Check that `MONGODB_URI` is set to:
   ```
   mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0
   ```
   **NOT:**
   ```
   mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

### **Step 2: Update Local Environment Files**

**Update `server/env.production`:**
```env
# Production Environment Variables
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
FRONTEND_URL=https://mafqoudat.com
CLOUDINARY_CLOUD_NAME=du0tmvxhu
CLOUDINARY_API_KEY=593667419254217
CLOUDINARY_API_SECRET=HyNgn7OcNYUAFIENfnDVvbqQnis
CLOUDINARY_UPLOAD_PRESET=mafqoudat
```

### **Step 3: Check All Connection Strings**

Search your codebase for any connection strings that don't specify the database name:

```bash
# Look for connection strings without database name
grep -r "mongodb+srv.*@cluster0.*net/?" .
grep -r "mongodb+srv.*@cluster0.*net$" .
```

### **Step 4: Update Any Scripts**

If you find any scripts using connection strings without database names, update them to include `/mafqoudat`.

### **Step 5: Deploy to Railway**

1. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Fix database connection to use mafqoudat database"
   git push origin main
   ```

2. Railway will automatically deploy with the updated configuration

### **Step 6: Verify the Fix**

1. Check Railway logs to confirm it's connecting to `mafqoudat` database
2. Test your website - post creation should work
3. The `test` database should stop being recreated

## 🔧 **Alternative: Drop Test Database**

If the `test` database keeps getting recreated and you want to remove it:

1. Go to MongoDB Atlas
2. Navigate to your cluster
3. Click "Browse Collections"
4. Select the `test` database
5. Click the trash icon to drop it
6. Confirm the deletion

**Note:** It might get recreated again if any connection doesn't specify a database name.

## 🎯 **Expected Results**

After fixing the connection strings:

- ✅ Railway will connect to `mafqoudat` database
- ✅ All your data will be available
- ✅ Post creation will work
- ✅ `test` database won't be recreated (or will stay empty)
- ✅ No more "Invalid references" errors

## 📞 **Need Help?**

If you're still having issues:

1. Check Railway logs for connection errors
2. Verify all environment variables are set correctly
3. Make sure no scripts are using connection strings without database names
4. Test the connection locally to confirm it works

The key is ensuring **every connection string includes `/mafqoudat`** at the end!
