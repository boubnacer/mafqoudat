const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function debugLogin() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_URI_PROD);
    console.log('Connected to database');

    // Get all users to see what's in the database
    const users = await User.find({}).select('username email phone role').lean();
    console.log('\n=== ALL USERS IN DATABASE ===');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Username: "${user.username}"`);
      console.log(`   Email: "${user.email || 'N/A'}"`);
      console.log(`   Phone: "${user.phone || 'N/A'}"`);
      console.log(`   Role: ${user.role}`);
      console.log('---');
    });

    // Test login query for a specific user (replace with actual credentials)
    const testEmailOrPhone = 'test@example.com'; // Replace with actual email/phone/username
    console.log(`\n=== TESTING LOGIN QUERY FOR: "${testEmailOrPhone}" ===`);
    
    const foundUser = await User.findOne({
      $or: [
        { email: testEmailOrPhone.toLowerCase() },
        { phone: testEmailOrPhone },
        { username: testEmailOrPhone }
      ]
    }).collation({ locale: "en", strength: 2 })
      .select('_id username password country role email phone').exec();

    if (foundUser) {
      console.log('✅ User found!');
      console.log('   Username:', foundUser.username);
      console.log('   Email:', foundUser.email);
      console.log('   Phone:', foundUser.phone);
      console.log('   Role:', foundUser.role);
      console.log('   Has password:', !!foundUser.password);
    } else {
      console.log('❌ User not found');
    }

    // Test different variations
    console.log(`\n=== TESTING DIFFERENT VARIATIONS ===`);
    
    // Test with lowercase
    const foundUserLower = await User.findOne({
      $or: [
        { email: testEmailOrPhone.toLowerCase() },
        { phone: testEmailOrPhone.toLowerCase() },
        { username: testEmailOrPhone.toLowerCase() }
      ]
    }).collation({ locale: "en", strength: 2 })
      .select('_id username password country role email phone').exec();

    console.log('Lowercase search result:', foundUserLower ? 'Found' : 'Not found');

    // Test with original case
    const foundUserOriginal = await User.findOne({
      $or: [
        { email: testEmailOrPhone },
        { phone: testEmailOrPhone },
        { username: testEmailOrPhone }
      ]
    }).collation({ locale: "en", strength: 2 })
      .select('_id username password country role email phone').exec();

    console.log('Original case search result:', foundUserOriginal ? 'Found' : 'Not found');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  }
}

// Run the debug function
debugLogin();
