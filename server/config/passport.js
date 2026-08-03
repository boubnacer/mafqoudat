const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  scope: ['profile', 'email']
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Extract profile information
    const googleId = profile.id;
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const firstName = profile.name && profile.name.givenName ? profile.name.givenName : '';
    const lastName = profile.name && profile.name.familyName ? profile.name.familyName : '';
    const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

    // Check if user already exists by email or googleId
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    }).select('-password');

    if (existingUser) {
      // User exists - update lastLogin and ensure googleId is set
      existingUser.lastLogin = new Date();
      
      // Ensure googleId is set (in case user registered with email first)
      if (!existingUser.googleId) {
        existingUser.googleId = googleId;
        existingUser.authProvider = 'google';
      }

      // Update profile picture if not set
      if (!existingUser.profile.avatar && avatar) {
        existingUser.profile.avatar = avatar;
      }

      await existingUser.save();
      
      return done(null, existingUser);
    }

    // User doesn't exist - return pending user object
    // This allows the frontend to collect additional required information (like country)
    const pendingUser = {
      isPending: true,
      googleId: googleId,
      email: email,
      profile: {
        firstName: firstName,
        lastName: lastName,
        avatar: avatar,
        // Multilingual labels - initially set to the same value
        firstNameLabels: {
          en: firstName,
          fr: firstName,
          ar: firstName
        },
        lastNameLabels: {
          en: lastName,
          fr: lastName,
          ar: lastName
        }
      },
      authProvider: 'google'
    };

    return done(null, pendingUser);
  } catch (error) {
    console.error('Google OAuth Strategy Error:', error);
    return done(error, null);
  }
}));

// Configure Facebook OAuth Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL,
  profileFields: ['id', 'emails', 'name', 'photos'],
  // passport-facebook defaults to Graph API v3.2, which Meta has long since
  // sunset — without an explicit supported version the profile fetch after
  // token exchange fails and passport surfaces it as an unhandled error.
  graphAPIVersion: 'v21.0',
  enableProof: true
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Extract profile information
    const facebookId = profile.id;
    // Facebook only returns an email if the user granted the permission and
    // has one on file — unlike Google, it can legitimately be absent.
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const firstName = profile.name && profile.name.givenName ? profile.name.givenName : '';
    const lastName = profile.name && profile.name.familyName ? profile.name.familyName : '';
    const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

    // Check if user already exists by email (when present) or facebookId
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        { facebookId }
      ]
    }).select('-password');

    if (existingUser) {
      // User exists - update lastLogin and ensure facebookId is set
      existingUser.lastLogin = new Date();

      // Ensure facebookId is set (in case user registered with email first)
      if (!existingUser.facebookId) {
        existingUser.facebookId = facebookId;
        existingUser.authProvider = 'facebook';
      }

      // Update profile picture if not set
      if (!existingUser.profile.avatar && avatar) {
        existingUser.profile.avatar = avatar;
      }

      await existingUser.save();

      return done(null, existingUser);
    }

    // User doesn't exist - return pending user object
    // This allows the frontend to collect additional required information (like country)
    const pendingUser = {
      isPending: true,
      facebookId: facebookId,
      email: email,
      profile: {
        firstName: firstName,
        lastName: lastName,
        avatar: avatar,
        // Multilingual labels - initially set to the same value
        firstNameLabels: {
          en: firstName,
          fr: firstName,
          ar: firstName
        },
        lastNameLabels: {
          en: lastName,
          fr: lastName,
          ar: lastName
        }
      },
      authProvider: 'facebook'
    };

    return done(null, pendingUser);
  } catch (error) {
    console.error('Facebook OAuth Strategy Error:', error);
    return done(error, null);
  }
}));

module.exports = passport;

