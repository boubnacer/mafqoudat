const User = require("../models/User");
const Post = require("../models/Post");
const bcrypt = require("bcrypt");
const Country = require("../models/Country");
const jwt = require("jsonwebtoken");

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
      const country = await Country.findById(user.country).lean().exec();
      return { ...user, code: country.code };
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

  // Determine if username is email or phone
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^[+]?[1-9][\d]{0,15}$/;
  
  const isEmail = EMAIL_REGEX.test(username);
  const isPhone = PHONE_REGEX.test(username);
  
  if (!isEmail && !isPhone) {
    return res.status(400).json({ message: "Please provide a valid email or phone number" });
  }

  // Check for duplicate username (email or phone)
  const duplicateUsername = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicateUsername) {
    return res.status(409).json({ message: "Email or phone number already exists" });
  }

  // Check for duplicate email if it's an email
  if (isEmail) {
    const duplicateEmail = await User.findOne({ email: username.toLowerCase() })
      .lean()
      .exec();

    if (duplicateEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }
  }

  // Check for duplicate phone if it's a phone
  if (isPhone) {
    const duplicatePhone = await User.findOne({ phone: username })
      .lean()
      .exec();

    if (duplicatePhone) {
      return res.status(409).json({ message: "Phone number already exists" });
    }
  }

  // Hash password
  const hashedPwd = await bcrypt.hash(password, 10); // salt rounds

  const userObject = { 
    username, 
    email: isEmail ? username.toLowerCase() : "", 
    phone: isPhone ? username : "", 
    password: hashedPwd, 
    country 
  };

  // Create and store new user
  const user = await User.create(userObject);

  const accessToken = jwt.sign(
    {
      UserInfo: {
        username: user.username,
        usernameId: user.id,
        country: user.country,
      },
    },
            process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { username: user.username },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  // Create secure cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
  });

  console.log(accessToken);

  res.json({ accessToken });
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

  // Does the user exist to update?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  // Check for duplicate
  const duplicate = await User.findOne({ username })
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

  // Does the user still have assigned posts?
  const post = await Post.findOne({ user: id }).lean().exec();
  if (post) {
    return res.status(400).json({ message: "User has assigned posts" });
  }

  // Does the user exist to delete?
  const user = await User.findById(id).exec();

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
