# Cloudinary Upload Preset Setup

## 🔧 Create Upload Preset

You need to create an upload preset in your Cloudinary dashboard for the app to work properly.

### Step 1: Go to Cloudinary Dashboard
1. Log into [Cloudinary Dashboard](https://cloudinary.com/console)
2. Go to **Settings** → **Upload**

### Step 2: Create Upload Preset
1. Scroll down to **Upload presets**
2. Click **Add upload preset**
3. Configure the preset:
   - **Preset name**: `mafqoudat`
   - **Signing Mode**: `Unsigned`
   - **Folder**: `mafqoudat`
   - **Access Mode**: `public`
   - **Resource Type**: `image`

### Step 3: Save Settings
1. Click **Save** to create the preset
2. The preset name `mafqoudat` will be used in your environment variables

## 🔑 Your Cloudinary Credentials

Based on your setup, here are your credentials:

```
CLOUDINARY_CLOUD_NAME=du0tmvxhu
CLOUDINARY_API_KEY=593667419254217
CLOUDINARY_API_SECRET=HyNgn7OcNYUAFIENfnDVvbqQnis
CLOUDINARY_UPLOAD_PRESET=mafqoudat
```

## 🚀 Railway Environment Variables

Add these to your Railway project:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_generated_jwt_secret
JWT_REFRESH_SECRET=your_generated_jwt_refresh_secret
FRONTEND_URL=https://mafqoudat.com
CLOUDINARY_CLOUD_NAME=du0tmvxhu
CLOUDINARY_API_KEY=593667419254217
CLOUDINARY_API_SECRET=HyNgn7OcNYUAFIENfnDVvbqQnis
CLOUDINARY_UPLOAD_PRESET=mafqoudat
```

## ✅ Verification

After setting up the upload preset:
1. Images will be uploaded to Cloudinary instead of local storage
2. Images will be stored in the `mafqoudat` folder
3. Images will be optimized and resized automatically
4. Images will be accessible via secure HTTPS URLs

## 🔒 Security Notes

- Keep your API secret secure
- The upload preset is set to `unsigned` for client-side uploads
- All images are stored in the `mafqoudat` folder for organization
