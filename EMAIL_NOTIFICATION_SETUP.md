# Email Notification Setup Guide

This guide explains how to set up the email notification feature for the Mafqoudat application.

## Overview

When users create a "lost item" post, they now have the option to request promotion on social media to increase their chances of finding their item. If they choose "yes", you'll receive a beautiful email notification with all the details.

## Features

- ✅ Automatic promotion dialog for lost item posts
- ✅ Beautiful HTML email notifications
- ✅ Free email service (Gmail, Outlook, etc.)
- ✅ Multilingual support (English, French, Arabic)
- ✅ User-friendly interface with loading states
- ✅ Secure API endpoints with authentication
- ✅ Professional email templates

## Setup Instructions

### 1. Environment Variables

Add these variables to your `.env` file:

```env
# Email Notification Configuration
ADMIN_EMAIL=your_admin_email@gmail.com
SUPPORT_EMAIL=support@mafqoudat.com

# Email Service Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password_or_app_password
```

### 2. Email Service Setup

#### Option A: Gmail (Recommended - Free)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASS`

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

#### Option B: Outlook/Hotmail

```env
EMAIL_SERVICE=outlook
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
```

#### Option C: Custom SMTP Server

```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_USER=your_email@yourdomain.com
EMAIL_PASS=your_password
```

### 3. Install Dependencies

```bash
cd server
npm install nodemailer
```

### 4. Test Email Configuration

You can test your email setup by adding this route to your server:

```javascript
// Add this to server/routes/promotionRoutes.js for testing
router.post("/test-email", protect, async (req, res) => {
  try {
    const result = await emailNotification.sendTestEmail();
    if (result.success) {
      res.json({ message: "Test email sent successfully!" });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## How It Works

### 1. User Creates Lost Item Post
- User fills out the post form
- Selects "Lost" as the item type
- Submits the form

### 2. Promotion Dialog Appears
- After successful post creation, a dialog appears
- Asks if user wants to boost their chances
- Explains the promotion service

### 3. User Requests Promotion
- If user clicks "Yes, Promote It"
- API call to `/api/promotion/request`
- Email notification sent to admin

### 4. Admin Receives Email
- Beautiful HTML email with user and item details
- Contact information for follow-up
- Timestamp of the request
- Professional styling and branding

## Email Template Features

The email notification includes:

- **Professional HTML design** with Mafqoudat branding
- **User details** (name, contact information)
- **Item details** (type, category, region, country)
- **Timestamp** of the request
- **Clear call-to-action** for follow-up
- **Responsive design** that works on all devices

## API Endpoints

### POST /api/promotion/request
Request promotion for a lost item post.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "postId": "post_id_here",
  "userContact": "optional_contact_info",
  "itemDescription": "optional_description"
}
```

**Response:**
```json
{
  "message": "Promotion request submitted successfully",
  "notificationSent": true,
  "message": "We'll contact you soon to process your promotion request"
}
```

## Customization

### Modify Email Template
Edit the `formatHtmlMessage` function in `server/utils/emailNotification.js`:

```javascript
formatHtmlMessage(postData, userData) {
  // Customize the HTML email template here
  return `
  <!DOCTYPE html>
  <html>
  <head>
      <title>New Promotion Request</title>
      <style>
          /* Add your custom CSS here */
      </style>
  </head>
  <body>
      <!-- Customize the email content -->
  </body>
  </html>`;
}
```

### Change Email Subject
Modify the subject line in the `sendNotification` method:

```javascript
const mailOptions = {
  from: `"Mafqoudat" <${this.emailUser}>`,
  to: this.adminEmail,
  subject: 'Your Custom Subject Here', // Change this
  text: message,
  html: htmlMessage
};
```

## Troubleshooting

### Email Not Sending
1. **Check Gmail App Password**: Make sure you're using an app password, not your regular password
2. **Enable Less Secure Apps**: If not using app password, enable "Less secure app access" in Gmail
3. **Check Environment Variables**: Verify all email variables are set correctly
4. **Check Server Logs**: Look for error messages in the console

### Gmail App Password Issues
1. **2FA Required**: You must have 2-factor authentication enabled
2. **Generate New Password**: Go to Google Account → Security → App passwords
3. **Use Correct Password**: Copy the 16-character app password exactly

### Common Error Messages
- **"Invalid login"**: Wrong email or password
- **"Username and Password not accepted"**: Need to use app password for Gmail
- **"Connection timeout"**: Check your internet connection and email service settings

## Security Considerations

- **App Passwords**: Use app passwords instead of regular passwords for Gmail
- **Environment Variables**: Keep email credentials secure in environment variables
- **Rate Limiting**: Consider implementing rate limiting for promotion requests
- **Logging**: Log all promotion requests for audit purposes

## Free Email Services

### Gmail (Recommended)
- **Free tier**: 500 emails/day
- **Setup**: Easy with app passwords
- **Reliability**: High

### Outlook/Hotmail
- **Free tier**: 300 emails/day
- **Setup**: Straightforward
- **Reliability**: Good

### SendGrid (Free Tier)
- **Free tier**: 100 emails/day
- **Setup**: Requires API key
- **Reliability**: Excellent

### Mailgun (Free Tier)
- **Free tier**: 5,000 emails/month
- **Setup**: Requires API key
- **Reliability**: Excellent

## Future Enhancements

- [ ] Add email templates for different languages
- [ ] Implement email tracking and analytics
- [ ] Add bulk email notifications
- [ ] Create email preference settings
- [ ] Add email scheduling for promotions
- [ ] Implement email templates for different promotion types

## Support

For issues or questions:
- Check the server logs for error messages
- Verify all environment variables are set
- Test email configuration with the test endpoint
- Contact the development team

---

**Note**: Email notifications are completely free and don't require any paid services. Gmail's free tier allows 500 emails per day, which is more than sufficient for most use cases.
