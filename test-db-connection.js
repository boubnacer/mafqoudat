const mongoose = require('mongoose');
const User = require('./server/models/User');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');
    
    // Find users with empty email
    const usersWithEmptyEmail = await User.find({ email: '' });
    console.log('Users with empty email:', usersWithEmptyEmail.length);
    
    if (usersWithEmptyEmail.length > 0) {
      console.log('First user with empty email:', {
        _id: usersWithEmptyEmail[0]._id,
        username: usersWithEmptyEmail[0].username,
        email: usersWithEmptyEmail[0].email,
        phone: usersWithEmptyEmail[0].phone
      });
    }
    
    // Find users with null email
    const usersWithNullEmail = await User.find({ email: null });
    console.log('Users with null email:', usersWithNullEmail.length);
    
    // Find all users to see the pattern
    const allUsers = await User.find({}).select('username email phone').limit(5);
    console.log('Sample users:', allUsers.map(u => ({
      username: u.username,
      email: u.email,
      phone: u.phone
    })));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

checkDatabase();
