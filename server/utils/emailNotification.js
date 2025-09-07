const nodemailer = require('nodemailer');

// Email notification service
class EmailNotificationService {
  constructor() {
    this.adminEmail = process.env.ADMIN_EMAIL;
    this.supportEmail = process.env.SUPPORT_EMAIL || 'support@mafqoudat.com';
    this.emailService = process.env.EMAIL_SERVICE || 'gmail';
    this.emailUser = process.env.EMAIL_USER;
    this.emailPass = process.env.EMAIL_PASS;
  }

  async sendNotification(postData, userData) {
    try {
      console.log('Email notification service - checking configuration...');
      console.log('Admin email:', this.adminEmail ? 'Set' : 'Not set');
      console.log('Email user:', this.emailUser ? 'Set' : 'Not set');
      console.log('Email pass:', this.emailPass ? 'Set' : 'Not set');
      
      if (!this.adminEmail || !this.emailUser || !this.emailPass) {
        console.log('Email notification not configured. Skipping notification.');
        return { success: false, message: 'Email not configured' };
      }

      const transporter = this.createTransporter();
      const message = this.formatMessage(postData, userData);
      const htmlMessage = this.formatHtmlMessage(postData, userData);

      const mailOptions = {
        from: `"Mafqoudat" <${this.emailUser}>`,
        to: this.adminEmail,
        subject: '🔔 New Promotion Request - Mafqoudat',
        text: message,
        html: htmlMessage
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email notification sent successfully:', result.messageId);
      return { success: true, data: result };

    } catch (error) {
      console.error('Error sending email notification:', error.message);
      return { success: false, error: error.message };
    }
  }

  createTransporter() {
    // For Gmail, you might need to use an App Password instead of regular password
    return nodemailer.createTransport({
      service: this.emailService,
      auth: {
        user: this.emailUser,
        pass: this.emailPass
      }
    });
  }

  formatMessage(postData, userData) {
    const timestamp = new Date().toLocaleString();
    
    return `🔔 NEW PROMOTION REQUEST 🔔

📱 User Details:
• Name: ${userData.username || 'Unknown'}
• Contact: ${postData.contact || 'Not provided'}

📦 Item Details:
• Type: ${postData.foundLost === 'lost' ? 'LOST ITEM' : 'FOUND ITEM'}
• Category: ${postData.category || 'Unknown'}
• City: ${postData.city || 'Unknown'}
• Region: ${postData.region || 'Unknown'}
• Country: ${postData.country || 'Unknown'}

🔗 Post Link: ${postData.postLink || 'Link not available'}

⏰ Requested at: ${timestamp}

💬 Message: User wants to double their chances of finding their lost item by having it promoted on social media.

Please contact the user to process their request.

---
Mafqoudat Team
Support: ${this.supportEmail}`;
  }

  formatHtmlMessage(postData, userData) {
    const timestamp = new Date().toLocaleString();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Promotion Request</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(45deg, #2196F3, #21CBF3); color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .section { margin: 15px 0; }
            .label { font-weight: bold; color: #2196F3; }
            .value { margin-left: 10px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .highlight { background: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107; }
            .post-link { background: #e3f2fd; padding: 10px; border-radius: 5px; border-left: 4px solid #2196f3; }
            .post-link a { color: #2196f3; text-decoration: none; font-weight: bold; }
            .post-link a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔔 New Promotion Request</h1>
                <p>Mafqoudat - Lost & Found Platform</p>
            </div>
            
            <div class="content">
                <div class="section">
                    <div class="label">📱 User Details:</div>
                    <div class="value">• Name: ${userData.username || 'Unknown'}</div>
                    <div class="value">• Contact: ${postData.contact || 'Not provided'}</div>
                </div>
                
                <div class="section">
                    <div class="label">📦 Item Details:</div>
                    <div class="value">• Type: ${postData.foundLost === 'lost' ? 'LOST ITEM' : 'FOUND ITEM'}</div>
                    <div class="value">• Category: ${postData.category || 'Unknown'}</div>
                    <div class="value">• City: ${postData.city || 'Unknown'}</div>
                    <div class="value">• Region: ${postData.region || 'Unknown'}</div>
                    <div class="value">• Country: ${postData.country || 'Unknown'}</div>
                </div>
                
                <div class="post-link">
                    <div class="label">🔗 Post Link:</div>
                    <div class="value"><a href="${postData.postLink || '#'}" target="_blank">View Post</a></div>
                </div>
                
                <div class="section">
                    <div class="label">⏰ Requested at:</div>
                    <div class="value">${timestamp}</div>
                </div>
                
                <div class="highlight">
                    <strong>💬 Message:</strong> User wants to double their chances of finding their lost item by having it promoted on social media.
                </div>
                
                <div class="section">
                    <p><strong>Action Required:</strong> Please contact the user to process their promotion request.</p>
                </div>
            </div>
            
            <div class="footer">
                <p>---
                <br>Mafqoudat Team
                <br>Support: ${this.supportEmail}
                <br>This is an automated notification from the Mafqoudat platform.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  // Method to send a simple test email
  async sendTestEmail() {
    try {
      const transporter = this.createTransporter();
      
      const mailOptions = {
        from: `"Mafqoudat" <${this.emailUser}>`,
        to: this.adminEmail,
        subject: 'Test Email - Mafqoudat Notification System',
        text: 'This is a test email to verify the notification system is working correctly.',
        html: '<h2>Test Email</h2><p>This is a test email to verify the notification system is working correctly.</p>'
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Test email sent successfully:', result.messageId);
      return { success: true, data: result };

    } catch (error) {
      console.error('Error sending test email:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Method to send report notification to admin
  async sendReportNotification(postData, userData, reportReason) {
    try {
      console.log('Report notification service - checking configuration...');
      console.log('Admin email:', this.adminEmail ? 'Set' : 'Not set');
      console.log('Email user:', this.emailUser ? 'Set' : 'Not set');
      console.log('Email pass:', this.emailPass ? 'Set' : 'Not set');
      
      if (!this.adminEmail || !this.emailUser || !this.emailPass) {
        console.log('Email notification not configured. Skipping notification.');
        return { success: false, message: 'Email not configured' };
      }

      const transporter = this.createTransporter();
      const message = this.formatReportMessage(postData, userData, reportReason);
      const htmlMessage = this.formatReportHtmlMessage(postData, userData, reportReason);

      const mailOptions = {
        from: `"Mafqoudat" <${this.emailUser}>`,
        to: this.adminEmail,
        subject: '🚨 Post Report - Mafqoudat',
        text: message,
        html: htmlMessage
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Report notification sent successfully:', result.messageId);
      return { success: true, data: result };

    } catch (error) {
      console.error('Error sending report notification:', error.message);
      return { success: false, error: error.message };
    }
  }

  formatReportMessage(postData, userData, reportReason) {
    const timestamp = new Date().toLocaleString();
    const postUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/dash/posts/${postData._id}`;
    
    return `🚨 POST REPORT 🚨

📱 User Details:
• Name: ${userData.username || 'Unknown'}
• User ID: ${userData._id || 'Unknown'}

📦 Post Details:
• Post ID: ${postData._id || 'Unknown'}
• Type: ${postData.foundLost === 'LOST' ? 'LOST ITEM' : 'FOUND ITEM'}
• Category: ${postData.category || 'Unknown'}
• City: ${postData.city || 'Unknown'}
• Region: ${postData.region || 'Unknown'}
• Country: ${postData.country || 'Unknown'}
• Contact: ${postData.contact || 'Not provided'}

🔗 Post Link: ${postUrl}

⚠️ Report Reason: ${reportReason}

⏰ Reported at: ${timestamp}

Please review this post and take appropriate action.

---
Mafqoudat Team
Support: ${this.supportEmail}`;
  }

  formatReportHtmlMessage(postData, userData, reportReason) {
    const timestamp = new Date().toLocaleString();
    const postUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/dash/posts/${postData._id}`;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Post Report - Mafqoudat</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(45deg, #f44336, #ff5722); color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .section { margin: 15px 0; }
            .label { font-weight: bold; color: #f44336; }
            .value { margin-left: 10px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .highlight { background: #ffebee; padding: 10px; border-radius: 5px; border-left: 4px solid #f44336; }
            .post-link { background: #e3f2fd; padding: 10px; border-radius: 5px; border-left: 4px solid #2196f3; }
            .post-link a { color: #2196f3; text-decoration: none; font-weight: bold; }
            .post-link a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 Post Report</h1>
                <p>Mafqoudat - Lost & Found Platform</p>
            </div>
            
            <div class="content">
                <div class="section">
                    <div class="label">📱 User Details:</div>
                    <div class="value">• Name: ${userData.username || 'Unknown'}</div>
                    <div class="value">• User ID: ${userData._id || 'Unknown'}</div>
                </div>
                
                <div class="section">
                    <div class="label">📦 Post Details:</div>
                    <div class="value">• Post ID: ${postData._id || 'Unknown'}</div>
                    <div class="value">• Type: ${postData.foundLost === 'LOST' ? 'LOST ITEM' : 'FOUND ITEM'}</div>
                    <div class="value">• Category: ${postData.category || 'Unknown'}</div>
                    <div class="value">• City: ${postData.city || 'Unknown'}</div>
                    <div class="value">• Region: ${postData.region || 'Unknown'}</div>
                    <div class="value">• Country: ${postData.country || 'Unknown'}</div>
                    <div class="value">• Contact: ${postData.contact || 'Not provided'}</div>
                </div>
                
                <div class="post-link">
                    <div class="label">🔗 Post Link:</div>
                    <div class="value"><a href="${postUrl}" target="_blank">View Post</a></div>
                </div>
                
                <div class="highlight">
                    <div class="label">⚠️ Report Reason:</div>
                    <div class="value">${reportReason}</div>
                </div>
                
                <div class="section">
                    <div class="label">⏰ Reported at:</div>
                    <div class="value">${timestamp}</div>
                </div>
                
                <div class="section">
                    <p><strong>Action Required:</strong> Please review this post and take appropriate action.</p>
                </div>
            </div>
            
            <div class="footer">
                <p>---
                <br>Mafqoudat Team
                <br>Support: ${this.supportEmail}
                <br>This is an automated notification from the Mafqoudat platform.</p>
            </div>
        </div>
    </body>
    </html>`;
  }
}

module.exports = new EmailNotificationService();
