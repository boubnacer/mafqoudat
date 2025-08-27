const mongoose = require('mongoose');
const User = require('./server/models/User');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function fixEmptyEmails() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');
    
    // Find users with empty email
    const usersWithEmptyEmail = await User.find({ email: '' });
    console.log('Found users with empty email:', usersWithEmptyEmail.length);
    
    if (usersWithEmptyEmail.length > 0) {
      console.log('Fixing users with empty email...');
      
      // Update all users with empty email to remove the email field entirely
      const result = await User.updateMany(
        { email: '' },
        { $unset: { email: 1 } }
      );
      
      console.log('Updated users:', result.modifiedCount);
      
      // Verify the fix
      const remainingEmptyEmails = await User.find({ email: '' });
      console.log('Remaining users with empty email:', remainingEmptyEmails.length);
      
      // Check for users with null email
      const usersWithNullEmail = await User.find({ email: null });
      console.log('Users with null email:', usersWithNullEmail.length);
    } else {
      console.log('No users with empty email found.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

fixEmptyEmails();
