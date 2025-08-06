# 🗄️ MongoDB Atlas Setup Guide

## **Step 1: Create MongoDB Atlas Account**

1. **Go to MongoDB Atlas**
   - Visit: https://www.mongodb.com/atlas
   - Click "Try Free"

2. **Create Account**
   - Sign up with email or Google account
   - Choose "Free" plan (M0 Sandbox)

3. **Create Cluster**
   - Choose "M0 Sandbox" (FREE)
   - Select cloud provider (AWS/Google Cloud/Azure)
   - Choose region closest to you
   - Click "Create"

## **Step 2: Configure Database Access**

1. **Create Database User**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Username: `mafkoudat_user`
   - Password: Create a strong password
   - Role: "Read and write to any database"
   - Click "Add User"

## **Step 3: Configure Network Access**

1. **Allow All IPs (for development)**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

## **Step 4: Get Connection String**

1. **Get Connection String**
   - Go to "Database" in left sidebar
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string

2. **Format Connection String**
   ```
   mongodb+srv://mafkoudat_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/mafkoudat?retryWrites=true&w=majority
   ```

## **Step 5: Update Environment Variables**

1. **Create .env file in server directory**
   ```bash
   # Copy env.example to .env
   copy env.example .env
   ```

2. **Update DATABASE_URI in .env**
   ```
   DATABASE_URI=mongodb+srv://mafkoudat_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/mafkoudat?retryWrites=true&w=majority
   ```

## **Step 6: Test Connection**

1. **Start the server**
   ```bash
   npm run dev
   ```

2. **Seed the database**
   ```bash
   npm run seed
   ```

3. **Test API endpoints**
   ```bash
   curl http://localhost:3500/countries?language=en&active=true
   ```

## **🔧 Alternative: Install MongoDB Locally**

If you prefer local MongoDB:

### **Windows:**
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. Start MongoDB service:
   ```bash
   net start MongoDB
   ```

### **macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

### **Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install mongodb
sudo systemctl start mongod
sudo systemctl enable mongod
```

## **🎯 Recommended Approach**

**Use MongoDB Atlas** because:
- ✅ No local installation needed
- ✅ Same setup for development and production
- ✅ Automatic backups
- ✅ Free tier available
- ✅ Easy scaling
- ✅ Built-in security

## **🔒 Security Notes**

- Never commit .env files to Git
- Use strong passwords for database users
- In production, restrict IP access to your hosting providers
- Enable MongoDB Atlas security features (encryption, audit logs) 