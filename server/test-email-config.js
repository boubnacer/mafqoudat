const emailNotification = require('./utils/emailNotification');

async function testEmailConfiguration() {
  console.log('🔧 Testing Email Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? '✅ Set' : '❌ Missing');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');
  console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'gmail');
  console.log('CLIENT_URL:', process.env.CLIENT_URL || 'http://localhost:3000');
  
  if (!process.env.ADMIN_EMAIL || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n❌ Missing required environment variables!');
    console.log('Please set ADMIN_EMAIL, EMAIL_USER, and EMAIL_PASS in your .env file');
    return;
  }
  
  console.log('\n📧 Testing Email Service...');
  
  try {
    // Test with sample data
    const testData = {
      postId: 'test-post-id',
      contact: 'test@example.com',
      category: 'Test Category',
      region: 'Test Region',
      city: 'Test City',
      country: 'Test Country',
      foundLost: 'LOST',
      itemDescription: 'This is a test email notification',
      postLink: 'http://localhost:3000/dash/posts/test-post-id'
    };
    
    const testUser = {
      username: 'Test User',
      email: 'test@example.com'
    };
    
    const result = await emailNotification.sendNotification(testData, testUser);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.data.messageId);
      console.log('\n📬 Check your admin email inbox for the test message');
    } else {
      console.log('❌ Email failed to send');
      console.log('Error:', result.error || result.message);
    }
    
  } catch (error) {
    console.log('❌ Email test failed with error:');
    console.log(error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Tip: For Gmail, make sure to:');
      console.log('1. Enable 2-Step Verification');
      console.log('2. Generate an App Password');
      console.log('3. Use the App Password instead of your regular password');
    }
    
    if (error.message.includes('Username and Password not accepted')) {
      console.log('\n💡 Tip: This usually means you need to use an App Password for Gmail');
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  testEmailConfiguration();
}

module.exports = { testEmailConfiguration };
