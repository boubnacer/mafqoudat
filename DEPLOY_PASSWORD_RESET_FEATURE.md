# Deploy Password Reset Feature to Production

## Files That Need to Be Deployed

### Backend (Server) Files - **CRITICAL**
```
server/
├── models/PasswordResetRequest.js          (NEW)
├── controllers/passwordResetController.js  (NEW)
├── routes/passwordResetRoutes.js           (NEW)
├── controllers/adminController.js          (MODIFIED)
├── routes/adminRoutes.js                   (MODIFIED)
└── server.js                               (MODIFIED)
```

### Frontend (Client) Files
```
client/src/
├── components/PasswordResetDialog.jsx      (NEW)
├── utils/translations.js                   (MODIFIED)
├── features/auth/Login/Login.js            (MODIFIED)
├── features/admin/AdminDashboard.jsx       (MODIFIED)
└── features/admin/adminApiSlice.js         (MODIFIED)
```

---

## Deployment Steps

### Step 1: Commit Your Changes

```bash
git add .
git commit -m "Add password reset mechanism with admin panel integration"
git push origin main
```

### Step 2: Deploy to Production

Choose the method you normally use:

#### **If using Railway/Vercel/Similar**
- Push to your repository (they auto-deploy)
- Wait for deployment to complete

#### **If using Manual Deployment**
```bash
# On your production server
cd /path/to/your/app
git pull origin main

# Install any new dependencies (if needed)
cd server
npm install

cd ../client
npm install
npm run build

# Restart the server
pm2 restart mafqoudat
# or
systemctl restart mafqoudat
```

### Step 3: Verify Deployment

After deployment, test the endpoint:

```bash
# Test the password reset endpoint
curl -X POST https://www.mafqoudat.com/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"contactInfo":"test@example.com"}'
```

You should get a success response like:
```json
{
  "success": true,
  "message": "Password reset request submitted successfully",
  "data": {
    "requestId": "...",
    "createdAt": "..."
  }
}
```

---

## Troubleshooting

### If you still get 405 error after deployment:

1. **Check server logs** to see if the route is being loaded:
   ```bash
   pm2 logs mafqoudat
   # or
   tail -f /path/to/logs/server.log
   ```

2. **Verify the server restarted** with the new code:
   ```bash
   pm2 list
   # Check the "restart" time
   ```

3. **Test the route directly** on the server:
   ```bash
   # SSH into your server
   curl -X POST http://localhost:3500/api/password-reset/request \
     -H "Content-Type: application/json" \
     -d '{"contactInfo":"test@example.com"}'
   ```

4. **Check if the file exists** on the server:
   ```bash
   ls -la server/routes/passwordResetRoutes.js
   ls -la server/controllers/passwordResetController.js
   ls -la server/models/PasswordResetRequest.js
   ```

---

## Production Checklist

- [ ] All files committed and pushed to repository
- [ ] Server restarted/redeployed
- [ ] Frontend rebuilt and deployed
- [ ] Password reset endpoint responding (test with curl)
- [ ] Login page shows "Reset Password" button
- [ ] Dialog opens and accepts input
- [ ] Success message displays after submission
- [ ] Admin panel shows new "Password Reset Requests" tab
- [ ] Admin can view and manage requests

---

## Quick Fix: Restart Server

If you've already deployed but getting 405, simply restart your server:

```bash
# Railway
railway restart

# PM2
pm2 restart all

# Systemd
sudo systemctl restart mafqoudat

# Docker
docker-compose restart
```

