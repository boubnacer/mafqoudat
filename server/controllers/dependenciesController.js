const Post = require("../models/Post");
const User = require("../models/User");
const Country = require("../models/Country");
const FoundLost = require("../models/FoundLost");
const mongoose = require("mongoose");
// const getCountryIso3 = require("country-iso-2-to-3");
const getCountryIso3 = require("country-iso-2-to-3");
const Category = require("../models/Category");

// Get Dashboard
const getDashboard = async (req, res) => {
  try {
    let match = {};
    const currentDate = new Date();

    const currentCountry = req.query.currentCountry;

    // Lookup FoundLost IDs by code
    const foundOption = await FoundLost.findOne({ code: "Found" });
    const lostOption = await FoundLost.findOne({ code: "Lost" });
    if (!foundOption || !lostOption) {
      return res.status(500).json({ message: "Found/Lost options not set in DB" });
    }

    const trendingPost = await Post.aggregate([
      { $match: { country: new mongoose.Types.ObjectId(currentCountry) } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },
      { $unwind: "$Category" },
      {
        $lookup: {
          from: "foundlosts",
          localField: "foundLost",
          foreignField: "_id",
          as: "Floptions",
        },
      },
      { $unwind: "$Floptions" },
      {
        $project: {
          region: 1,
          user: 1,
          country: 1,
          returned: 1,
          createdAt: 1,
          categoryName: "$Category.code",
          floptionName: "$Floptions.code",
          contact: 1,
          image: 1,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: 1,
      },
    ]);
    // .limit(1)
    // .sort({ createdAt: -1 });

    // const transformedCountry = new mongoose.Types.ObjectId(currentCountry);

    // get Trended item
    // const trendingPost = await Post.findOne({ country: currentCountry })
    //   .limit(1)
    //   .sort({ createdAt: -1 });

    //get recent founds:

    const recentFounds = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry),
          foundLost: foundOption._id,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },
      { $unwind: "$Category" },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "User",
        },
      },
      { $unwind: "$User" },
      {
        $project: {
          user: 1,
          country: 1,
          region: 1,
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: "$User.username",
          categoryname: "$Category.code",
          // countryname: "$Country.code",
          contact: 1,
          image: 1,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: 4,
      },
    ]);
    // .limit(4)
    // .sort({ createdAt: -1 });

    //get recent losts
    const recentLosts = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry),
          foundLost: lostOption._id,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },
      { $unwind: "$Category" },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "User",
        },
      },
      { $unwind: "$User" },
      {
        $project: {
          user: 1,
          country: 1,
          region: 1,
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: "$User.username",
          categoryname: "$Category.code",
          // countryname: "$Country.code",
          contact: 1,
          image: 1,
        },
      },
      {
        $limit: 4,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);
    // .limit(4)
    // .sort({ createdAt: -1 });

    // total Founds
    const totalFounds = await Post.find({
      country: currentCountry,
      foundLost: foundOption._id,
    }).countDocuments();

    // total Losts
    const totalLosts = await Post.find({
      country: currentCountry,
      foundLost: lostOption._id,
    }).countDocuments();

    // total posts
    const totalPosts = await Post.find({
      country: currentCountry,
    }).countDocuments();

    // get geography
    const posts = await Post.find();

    const postsWithCountryname = await Promise.all(
      posts.map(async (post) => {
        const postcountry = await Country.findById(post.country);
        const postCategory = await Category.findById(post.category);
        return {
          ...post._doc,
          code: postcountry.code,
          categoryname: postCategory.code,
        };
      })
    );

    const mappedLocations = postsWithCountryname.reduce((acc, { code }) => {
      const countryISO3 = getCountryIso3(code);
      if (!acc[countryISO3]) {
        acc[countryISO3] = 0;
      }
      acc[countryISO3]++;
      return acc;
    }, {});

    const formattedLocations = Object.entries(mappedLocations).map(
      ([country, count]) => {
        return { id: country, value: count };
      }
    );

    // today's total founds
    const todaysFoundPosts = await Post.find({
      country: currentCountry,
      createdAt: {
        $gte: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        ),
        $lt: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() + 1
        ),
      },
      foundLost: foundOption._id,
    }).countDocuments();

    // today's total losts
    const todaysLostPosts = await Post.find({
      country: currentCountry,
      createdAt: {
        $gte: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        ),
        $lt: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() + 1
        ),
      },
      foundLost: lostOption._id,
    }).countDocuments();

    const createdToday = { todaysFoundPosts, todaysLostPosts };

    res.status(200).json({
      trendingPost,
      recentFounds,
      recentLosts,
      totalFounds,
      totalLosts,
      totalPosts,
      formattedLocations,
      createdToday,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// found or lost options
const getflOptions = async (req, res) => {
  const flOptions = await FoundLost.find({}).lean().exec();

  if (!flOptions.length) {
    return res.status(400).json({ message: "No found or lost choices !" });
  }

  res.status(200).json(flOptions);
};

const getCountries = async (req, res) => {
  const countries = await Country.find({}).lean().exec();

  if (!countries.length)
    return res.status(400).json({ message: "No countries found" });

  res.json(countries);
};

const getCategories = async (req, res) => {
  const categories = await Category.find({}).lean().exec();

  if (!categories.length)
    return res.status(400).json({ message: "No categories found" });

  res.json(categories);
};

// Create category dynamically
const createCategory = async (req, res) => {
  const { code, flag } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Category code is required" });
  }
  const newCategory = { code, flag };
  const addedCategory = await Category.create(newCategory);
  if (addedCategory) {
    res.status(201).json({ message: `new category ${addedCategory.code} added` });
  } else {
    res.status(400).json({ message: "Invalid category data received!" });
  }
};
// Create foundLost dynamically
const createFoundLost = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: "FoundLost code is required" });
  }
  const newFoundLost = { code };
  const addedFoundLost = await FoundLost.create(newFoundLost);
  if (addedFoundLost) {
    res.status(201).json({ message: `new foundLost ${addedFoundLost.code} added` });
  } else {
    res.status(400).json({ message: "Invalid foundLost data received!" });
  }
};

const postsPerDay = async () => {
  const currentDate = new Date();

  // Lookup FoundLost IDs by code
  const foundOption = await FoundLost.findOne({ code: "Found" });
  const lostOption = await FoundLost.findOne({ code: "Lost" });
  if (!foundOption || !lostOption) {
    console.error("Found/Lost options not set in DB");
    return;
  }

  // today's founds
  const todaysFoundPosts = await Post.find({
    createdAt: {
      $gte: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      ),
      $lt: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 1
      ),
    },
    foundLost: foundOption._id,
  }).countDocuments();

  // today's losts
  const todaysLostPosts = await Post.find({
    createdAt: {
      $gte: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      ),
      $lt: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 1
      ),
    },
    foundLost: lostOption._id,
  }).countDocuments();

  const createdToday = { todaysFoundPosts, todaysLostPosts };

  console.log("Posts inserted today:", createdToday);
};

module.exports = {
  getDashboard,
  getflOptions,
  getCategories,
  getCountries,
  createCategory,
  createFoundLost,
  // createCategory,
};
