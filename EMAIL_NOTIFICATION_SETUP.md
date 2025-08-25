# Email Notification Setup Guide

This guide will help you set up email notifications for the "Report Post" and "Increase Chances" features in Mafqoudat.

## 🚨 Important: Email Configuration Required

The "Report Post" and "Increase Chances" features require proper email configuration to send notifications to admin. Without this setup, these features will appear to be stuck in loading state.

## 📧 Email Setup Instructions

### 1. Gmail Setup (Recommended)

#### Step 1: Enable 2-Step Verification
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled

#### Step 2: Generate App Password
1. Go to Google Account > Security
2. Find "2-Step Verification" and click "App passwords"
3. Select "Mail" as the app and "Other" as device
4. Enter "Mafqoudat" as the name
5. Click "Generate"
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

#### Step 3: Configure Environment Variables
Add these to your `server/.env` file:

```env
# Email Configuration
ADMIN_EMAIL=your_admin_email@gmail.com
SUPPORT_EMAIL=support@mafqoudat.com
EMAIL_SERVICE=gmail
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_character_app_password
CLIENT_URL=http://localhost:3000
```

### 2. Other Email Services

#### Outlook/Hotmail
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
```

#### Yahoo
```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your_email@yahoo.com
EMAIL_PASS=your_app_password
```

## 🔧 Testing Email Configuration

### Option 1: Test Endpoint
After setting up, you can test the email configuration using the test endpoint:

```bash
curl -X POST http://localhost:3500/promotion/test-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Option 2: Check Server Logs
Look for these log messages in your server console:

```
Email notification service - checking configuration...
Admin email: Set
Email user: Set
Email pass: Set
Email notification sent successfully: <message_id>
```

## 🐛 Troubleshooting

### Issue: Features stuck in loading state
**Cause**: Email configuration is missing or incorrect
**Solution**: 
1. Check that all email environment variables are set
2. Verify Gmail app password is correct
3. Ensure 2-Step Verification is enabled for Gmail

### Issue: "Email not configured" message
**Cause**: Missing environment variables
**Solution**: Add all required email variables to your `.env` file

### Issue: "Authentication failed" error
**Cause**: Incorrect email credentials
**Solution**: 
1. Double-check email and password
2. For Gmail, use App Password instead of regular password
3. Ensure 2-Step Verification is enabled

### Issue: "Invalid login" error
**Cause**: Gmail security settings blocking the connection
**Solution**:
1. Enable "Less secure app access" (not recommended)
2. Use App Password instead (recommended)
3. Check if your Gmail account has any security restrictions

## 📋 Environment Variables Checklist

Make sure these are set in your `server/.env`:

- [ ] `ADMIN_EMAIL` - Where notifications will be sent
- [ ] `SUPPORT_EMAIL` - Support contact email
- [ ] `EMAIL_SERVICE` - Email provider (gmail, outlook, yahoo)
- [ ] `EMAIL_USER` - Your email address
- [ ] `EMAIL_PASS` - Your email password or app password
- [ ] `CLIENT_URL` - Your frontend URL

## 🔄 Features That Use Email Notifications

### 1. Report Post
- **Trigger**: User clicks "Report Post" on any post
- **Action**: Sends email to admin with post details and report reason
- **Email Subject**: "🚨 Post Report - Mafqoudat"

### 2. Increase Chances (Promotion)
- **Trigger**: User requests promotion for lost item posts
- **Action**: Sends email to admin with promotion request details
- **Email Subject**: "🔔 New Promotion Request - Mafqoudat"

## 📱 User Experience

### Without Email Configuration
- Features appear to be stuck in loading state
- No error messages shown to users
- Admin doesn't receive notifications

### With Email Configuration
- Features work smoothly
- Users see success messages
- Admin receives detailed email notifications
- Post status is updated in database

## 🚀 Production Deployment

For production deployment:

1. Use a dedicated email service (SendGrid, Mailgun, etc.)
2. Set up proper SPF/DKIM records
3. Monitor email delivery rates
4. Consider using email templates for better formatting

## 📞 Support

If you're still having issues:

1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a simple email service first
4. Contact support with specific error messages

---

**Note**: The application will continue to work without email configuration, but the "Report Post" and "Increase Chances" features will not send notifications to admin.
