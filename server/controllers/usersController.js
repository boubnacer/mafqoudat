const User = require("../models/User");
const Post = require("../models/Post");
const bcrypt = require("bcrypt");
const Country = require("../models/Country");
const { generateTokens } = require("../middleware/jwtSecurity");
const { logEvents } = require("../middleware/logger");

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = async (req, res) => {
  // OPTIMIZED: Use aggregation with $lookup to avoid N+1 queries
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
        // Exclude password field
        password: 0,
        // Add country code from lookup
        code: { 
          $ifNull: [
            { $arrayElemAt: ["$countryData.code", 0] }, 
            "Unknown"
          ]
        }
      }
    }
  ]);

  // If no users
  if (!usersWithCountry?.length) {
    return res.status(400).json({ message: "No users found" });
  }

  res.json(usersWithCountry);
};

// @desc Get single user by ID
// @route GET /users/:id
// @access Private
const getUserById = async (req, res) => {
  const { id } = req.params;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "User ID Required" });
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
      // Check if it's a Google OAuth account
      if (duplicateEmail.authProvider === 'google') {
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
    const { id, username, password, country, email, phone } = req.body;

    // Confirm data
    if (!id || !username || !country) {
      return res
        .status(400)
        .json({ message: "All fields except password are required" });
    }

    // Does the user exist to update? - optimized with selective fields
    // Include authProvider to properly handle Google OAuth users
    const user = await User.findById(id).select('_id username country password email phone authProvider role').exec();

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

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "User ID Required" });
  }

  // Does the user still have assigned posts? - optimized with selective fields
  const post = await Post.findOne({ user: id }).select('_id').lean().exec();
  if (post) {
    return res.status(400).json({ message: "User has assigned posts" });
  }

  // Does the user exist to delete? - optimized with selective fields
  const user = await User.findById(id).select('_id username').exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const result = await user.deleteOne();

  const reply = `Username ${result.username} with ID ${result._id} deleted`;

  res.json(reply);
};

module.exports = {
  getAllUsers,
  getUserById,
  createNewUser,
  updateUser,
  deleteUser,
};
