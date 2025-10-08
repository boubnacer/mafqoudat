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
  // Get all users from MongoDB
  const users = await User.find().select("-password").lean();

  // If no users
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }

  const usersWithCountry = await Promise.all(
    users.map(async (user) => {
      const country = await Country.findById(user.country).select('code').lean().exec();
      return { ...user, code: country?.code || 'Unknown' };
    })
  );

  res.json(usersWithCountry);
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
      .select('_id')
      .lean()
      .exec();

    console.log('Checking for duplicate email:', username.toLowerCase(), 'Found:', !!duplicateEmail);

    if (duplicateEmail) {
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

  console.log('Creating user with object:', {
    username: userObject.username,
    email: userObject.email,
    phone: userObject.phone,
    country: userObject.country,
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
  const { id, username, password, country } = req.body;

  // Confirm data
  if (!id || !username || !country) {
    return res
      .status(400)
      .json({ message: "All fields except password are required" });
  }

  // Does the user exist to update? - optimized with selective fields
  const user = await User.findById(id).select('_id username country password').exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  // Check for duplicate - optimized with selective fields
  const duplicate = await User.findOne({ username })
    .select('_id')
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Already user please singin" });
  }

  user.username = username;
  user.country = country;

  if (password) {
    // Hash password
    user.password = await bcrypt.hash(password, 10); // salt rounds
  }

  const updatedUser = await user.save();

  res.json({ message: `${updatedUser.username} updated` });
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
  createNewUser,
  updateUser,
  deleteUser,
};
