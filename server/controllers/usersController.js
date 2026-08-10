const mongoose = require("mongoose");
const User = require("../models/User");
const Post = require("../models/Post");
const bcrypt = require("bcrypt");
const Country = require("../models/Country");
const Notification = require("../models/Notification");
const PostMatch = require("../models/PostMatch");
const Report = require("../models/Report");
const Contact = require("../models/Contact");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const { deleteFromCloudinary } = require("../config/cloudinary");
const { cacheService } = require("../config/cache");
const { generateTokens } = require("../middleware/jwtSecurity");
const { logEvents } = require("../middleware/logger");

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = async (req, res) => {
  try {
    // OPTIMIZED: Use aggregation with $lookup to avoid N+1 queries
    // Handle null/invalid country references gracefully
    const usersWithCountry = await User.aggregate([
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "countryData"
        }
      },
      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          role: 1,
          isActive: 1,
          country: 1,
          createdAt: 1,
          updatedAt: 1,
          lastLogin: 1,
          // Note: password field is automatically excluded by not including it
          // Add country code from lookup - handle null/empty arrays gracefully
          code: { 
            $ifNull: [
              { $arrayElemAt: ["$countryData.code", 0] }, 
              "Unknown"
            ]
          }
        }
      }
    ]);

    // If no users, return empty array instead of error (more RESTful)
    if (!usersWithCountry || usersWithCountry.length === 0) {
      return res.json([]);
    }

    res.json(usersWithCountry);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    logEvents(
      `Error fetching users: ${error.message}\t${req.method}\t${req.url}\t${req.ip}`,
      'errLog.log'
    );
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

// @desc Get single user by ID
// @route GET /users/:id
// @access Private - self or admin
const getUserById = async (req, res) => {
  const { id } = req.params;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "User ID Required" });
  }

  // The payload below is the full account record (email, phone, linked social
  // ids, IP), so it is only ever the caller's own - or an admin's to read.
  // Every real caller already asks for itself: the mobile Profile/PostForm
  // screens and the web UserProfile page all pass the signed-in user's id.
  if (id !== req.user && req.role !== 'admin') {
    return res.status(403).json({ message: "Not authorized to view this user" });
  }

  // Get user by ID - exclude password
  const user = await User.findById(id)
    .select("-password")
    .populate('country', 'code names labels')
    .lean()
    .exec();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
};

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = async (req, res) => {
  const { username, email, phone, password, country } = req.body;

  // Confirm data
  if (!username || !password || !country) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Determine if username is email or phone (accept any non-empty input)
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmail = EMAIL_REGEX.test(username);
  const isPhone = !isEmail; // If it's not an email, treat it as phone

  // Check for duplicate email only if input is an email - optimized with selective fields
  if (isEmail) {
    const duplicateEmail = await User.findOne({ email: username.toLowerCase() })
      .select('_id authProvider')
      .lean()
      .exec();

    console.log('Checking for duplicate email:', username.toLowerCase(), 'Found:', !!duplicateEmail);

    if (duplicateEmail) {
      // Check if it's a Google or Facebook OAuth account
      if (duplicateEmail.authProvider === 'google' || duplicateEmail.authProvider === 'facebook') {
        return res.status(409).json({ 
          message: "OAUTH_EMAIL_EXISTS",
          code: 'OAUTH_USER'
        });
      }
      return res.status(409).json({ message: "Email already exists" });
    }
  }

  // Check for duplicate phone only if input is a phone - optimized with selective fields
  if (isPhone) {
    const duplicatePhone = await User.findOne({ phone: username })
      .select('_id')
      .lean()
      .exec();

    console.log('Checking for duplicate phone:', username, 'Found:', !!duplicatePhone);

    if (duplicatePhone) {
      return res.status(409).json({ message: "Phone number already exists" });
    }
  }

  // Check for duplicate username - optimized with selective fields
  const duplicateUsername = await User.findOne({ username })
    .select('_id')
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  console.log('Checking for duplicate username:', username, 'Found:', !!duplicateUsername);

  if (duplicateUsername) {
    return res.status(409).json({ message: "Email or phone number already exists" });
  }

  // Hash password
  const hashedPwd = await bcrypt.hash(password, 10); // salt rounds

  const userObject = { 
    username, 
    password: hashedPwd, 
    country 
  };

  // Only set email if it's actually an email
  if (isEmail) {
    userObject.email = username.toLowerCase();
  }

  // Only set phone if it's actually a phone
  if (isPhone) {
    userObject.phone = username;
  }

  // Capture user's IP address
  const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                    req.headers['x-real-ip'] || 
                    req.connection?.remoteAddress || 
                    req.socket?.remoteAddress || 
                    req.ip || 
                    'unknown';
  
  userObject.ipAddress = ipAddress;

  console.log('Creating user with object:', {
    username: userObject.username,
    email: userObject.email,
    phone: userObject.phone,
    country: userObject.country,
    ipAddress: userObject.ipAddress,
    isEmail,
    isPhone
  });

  try {
    // Create and store new user
    const user = await User.create(userObject);
    console.log('User created successfully:', user._id);

  // Generate access token (long-lived, no refresh token needed)
  const { accessToken } = generateTokens({
    username: user.username,
    id: user.id,
    country: user.country,
    role: user.role
  });

  // Log successful registration
  logEvents(
    `Successful user registration: ${user.username}\t${req.method}\t${req.url}\t${req.ip}`,
    "reqLog.log"
  );

  res.json({ accessToken });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: "Error creating user" });
  }
};

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = async (req, res) => {
  try {
    const { id, username, password, country, email, phone, firstName, lastName } = req.body;

    // Confirm data
    if (!id || !username || !country) {
      return res
        .status(400)
        .json({ message: "All fields except password are required" });
    }

    if (id !== req.user) {
      return res.status(403).json({ message: "Not authorized to update this user" });
    }

    // Does the user exist to update? - optimized with selective fields
    // Include authProvider to properly handle Google OAuth users
    const user = await User.findById(id).select('_id username country password email phone authProvider role profile').exec();

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check for duplicate username - optimized with selective fields
    const duplicate = await User.findOne({ username })
      .select('_id')
      .collation({ locale: "en", strength: 2 })
      .lean()
      .exec();

    // Allow updates to the original user
    if (duplicate && duplicate?._id.toString() !== id) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // Check for duplicate email if email is being updated
    if (email && email !== user.email) {
      const duplicateEmail = await User.findOne({ email: email.toLowerCase() })
        .select('_id')
        .lean()
        .exec();
      
      if (duplicateEmail && duplicateEmail._id.toString() !== id) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    // Check for duplicate phone if phone is being updated
    if (phone && phone !== user.phone) {
      const duplicatePhone = await User.findOne({ phone })
        .select('_id')
        .lean()
        .exec();
      
      if (duplicatePhone && duplicatePhone._id.toString() !== id) {
        return res.status(409).json({ message: "Phone number already exists" });
      }
    }

    // Check if username or country is changing (before updating)
    const usernameChanged = user.username !== username;
    const countryChanged = user.country.toString() !== country.toString();

    user.username = username;
    user.country = country;

    // Update email if provided
    if (email !== undefined) {
      user.email = email.toLowerCase() || null;
    }

    // Update phone if provided
    if (phone !== undefined) {
      user.phone = phone || null;
    }

    // Update profile name fields if provided
    if (firstName !== undefined || lastName !== undefined) {
      user.profile = user.profile || {};
      if (firstName !== undefined) user.profile.firstName = firstName;
      if (lastName !== undefined) user.profile.lastName = lastName;
    }

    // Only update password if provided AND user is not a Google OAuth user
    // Google OAuth users don't have passwords, so we should only set password for local auth users
    if (password) {
      // For Google OAuth users, allow setting a password (linking local auth)
      // For local auth users, update the password
      user.password = await bcrypt.hash(password, 10); // salt rounds
    }

    const updatedUser = await user.save();
    
    let response = { message: `${updatedUser.username} updated` };
    
    if (usernameChanged || countryChanged) {
      const { accessToken } = generateTokens({
        username: updatedUser.username,
        id: updatedUser.id,
        country: updatedUser.country,
        role: updatedUser.role
      });
      
      response.accessToken = accessToken;
      console.log('New access token generated due to username or country change');
    }

    res.json(response);
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation error",
        errors: errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ 
        message: `${field} already exists`
      });
    }
    
    // Generic error response
    logEvents(
      `Error updating user: ${error.message}\t${req.method}\t${req.url}\t${req.ip}`,
      'errLog.log'
    );
    
    return res.status(500).json({ message: "Failed to update profile. Please try again." });
  }
};

// @desc List the users the caller has blocked
// @route GET /users/me/blocks
// @access Private (self only)
const getBlockedUsers = async (req, res) => {
  try {
    const viewer = await User.findById(req.user)
      .select('blockedUsers')
      .populate('blockedUsers', 'username profile.firstName profile.lastName')
      .lean()
      .exec();

    if (!viewer) {
      return res.status(404).json({ message: "User not found" });
    }

    // populate drops ids whose user has since been deleted, so this is already
    // free of dangling entries.
    const blocked = (viewer.blockedUsers || []).map((user) => ({
      id: user._id,
      username: user.username,
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
    }));

    return res.json({ blocked, count: blocked.length });
  } catch (error) {
    console.error('Error listing blocked users:', error);
    return res.status(500).json({ message: "Failed to load blocked users" });
  }
};

// @desc Block another user, hiding their posts and match alerts from the caller
// @route POST /users/me/blocks
// @access Private (self only)
const blockUser = async (req, res) => {
  try {
    const { userId } = req.body || {};

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID required" });
    }

    if (userId === req.user) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const target = await User.findById(userId).select('_id').lean().exec();
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    // $addToSet keeps a repeated block idempotent rather than growing the array.
    await User.updateOne({ _id: req.user }, { $addToSet: { blockedUsers: userId } });

    return res.json({ success: true, message: "User blocked", blockedUserId: userId });
  } catch (error) {
    console.error('Error blocking user:', error);
    return res.status(500).json({ message: "Failed to block user" });
  }
};

// @desc Unblock a previously blocked user
// @route DELETE /users/me/blocks/:userId
// @access Private (self only)
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID required" });
    }

    // No existence check on the target: a block whose user has since deleted
    // their account still has to be removable.
    await User.updateOne({ _id: req.user }, { $pull: { blockedUsers: userId } });

    return res.json({ success: true, message: "User unblocked", unblockedUserId: userId });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return res.status(500).json({ message: "Failed to unblock user" });
  }
};

/**
 * Erases a user and everything of theirs that carries personal data.
 *
 * Google Play's User Data policy requires that deleting an account also deletes
 * the data collected under it, so this cascades rather than leaving the posts,
 * alerts and support messages behind. It runs the same way for the self-service
 * route and the admin route, so the two can never diverge.
 *
 * Two deliberate exceptions to "delete everything":
 *   - Abuse reports are anonymised (`reportedBy` back to null, which the schema
 *     already uses for anonymous reports) instead of removed. Deleting an
 *     account must not erase the moderation trail that other people's reports
 *     created, and the report itself is no longer linked to a person.
 *   - Matches owned jointly with someone else only lose this user's traces
 *     (`owners`, `dismissedBy`, `confirmedBy`); the counterpart's own posts and
 *     alerts are not this user's data to delete.
 *
 * Returns a summary of what was removed, for the audit log.
 */
const purgeUserData = async (user) => {
  const userId = user._id;

  // Posts first: their Cloudinary assets and every match/notification that
  // points at them have to go before the rows themselves do.
  const posts = await Post.find({ user: userId })
    .select('_id cloudinaryPublicId')
    .lean()
    .exec();
  const postIds = posts.map((post) => post._id);

  // Best-effort by design - deleteFromCloudinary swallows its own errors, so a
  // storage hiccup can never strand a user who asked to be deleted.
  for (const post of posts) {
    if (post.cloudinaryPublicId) {
      await deleteFromCloudinary(post.cloudinaryPublicId);
    }
  }

  if (postIds.length > 0) {
    await PostMatch.deleteMany({
      $or: [{ postA: { $in: postIds } }, { postB: { $in: postIds } }],
    });
  }

  // Both the alerts addressed to this user and the alerts other users hold
  // about this user's posts - the latter would otherwise point at nothing.
  await Notification.deleteMany({
    $or: [
      { user: userId },
      ...(postIds.length > 0
        ? [{ post: { $in: postIds } }, { matchedPost: { $in: postIds } }]
        : []),
    ],
  });

  const { deletedCount: deletedPosts = 0 } = await Post.deleteMany({ user: userId });

  // Matches that survived (both posts belonged to other people) keep their
  // rows but lose every reference to this user.
  await PostMatch.updateMany(
    { $or: [{ owners: userId }, { dismissedBy: userId }] },
    { $pull: { owners: userId, dismissedBy: userId } }
  );
  await PostMatch.updateMany(
    { confirmedBy: userId },
    { $set: { confirmedBy: null } }
  );

  // Anonymise rather than delete - see the note above.
  await Report.updateMany({ reportedBy: userId }, { $set: { reportedBy: null } });
  await Report.updateMany({ reviewedBy: userId }, { $set: { reviewedBy: null } });
  await Report.updateMany(
    { 'postData.userId': userId },
    { $unset: { 'postData.userId': "" } }
  );

  // Support messages and password-reset requests are keyed by the contact
  // string the user typed, not by an id, so match on every identifier we hold.
  const contactIdentifiers = [user.email, user.phone, user.username].filter(Boolean);
  if (contactIdentifiers.length > 0) {
    await PasswordResetRequest.deleteMany({ contactInfo: { $in: contactIdentifiers } });
  }
  if (user.email) {
    await Contact.deleteMany({ email: user.email });
  }

  // Anyone who blocked this user is left holding an id that resolves to
  // nothing. Harmless to read past, but it would keep showing up in their
  // blocked-users list forever with no way to act on it.
  await User.updateMany({ blockedUsers: userId }, { $pull: { blockedUsers: userId } });

  await User.deleteOne({ _id: userId });

  // Listing and dashboard counts both change when a user's posts disappear.
  await cacheService.invalidatePattern('posts:*');
  await cacheService.invalidatePattern('dashboard:*');

  return { deletedPosts };
};

// @desc Delete the signed-in user's own account and all of its data
// @route DELETE /users/me
// @access Private (self only - the target is always req.user, never a body id)
const deleteMyAccount = async (req, res) => {
  try {
    // Deletion is irreversible, so it takes more than a stray DELETE reaching
    // the route: the caller has to echo back their own username. This works
    // for OAuth accounts too, which have no password to re-authenticate with.
    const { confirmUsername } = req.body || {};

    const user = await User.findById(req.user)
      .select('_id username email phone')
      .exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      typeof confirmUsername !== 'string' ||
      confirmUsername.trim().toLowerCase() !== user.username.toLowerCase()
    ) {
      return res.status(400).json({ message: "Username confirmation does not match" });
    }

    const username = user.username;
    const { deletedPosts } = await purgeUserData(user);

    logEvents(
      `Account self-deleted: ${username} (${deletedPosts} posts removed)\t${req.method}\t${req.url}\t${req.ip}`,
      "reqLog.log"
    );

    return res.json({
      success: true,
      message: "Your account and all associated data have been permanently deleted",
      deletedPosts,
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    logEvents(
      `Error deleting account: ${error.message}\t${req.method}\t${req.url}\t${req.ip}`,
      'errLog.log'
    );
    return res.status(500).json({ message: "Failed to delete account. Please try again." });
  }
};

// @desc Delete any user (moderation / support tool)
// @route DELETE /users
// @access Private - admin only (see routes/userRoutes.js)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User ID Required" });
    }

    const user = await User.findById(id).select('_id username email phone').exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const username = user.username;
    const { deletedPosts } = await purgeUserData(user);

    logEvents(
      `Account deleted by admin ${req.username}: ${username} (${deletedPosts} posts removed)\t${req.method}\t${req.url}\t${req.ip}`,
      "reqLog.log"
    );

    return res.json({
      success: true,
      message: `Username ${username} with ID ${id} deleted`,
      deletedPosts,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: "Failed to delete user" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createNewUser,
  updateUser,
  deleteUser,
  deleteMyAccount,
  getBlockedUsers,
  blockUser,
  unblockUser,
  // Shared with adminController's deleteUserAdmin so every route that erases an
  // account erases exactly the same set of data.
  purgeUserData,
};
