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
          foundLost: new mongoose.Types.ObjectId("66e60c25420ca2a42499b924"),
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
          foundLost: new mongoose.Types.ObjectId("66fe6a34579aa2d3a7fd81c2"),
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
      foundLost: "66e60c25420ca2a42499b924",
    }).countDocuments();

    // total Losts
    const totalLosts = await Post.find({
      country: currentCountry,
      foundLost: "63cc3484bc901245d3a1cb5a",
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
      foundLost: new mongoose.Types.ObjectId("66e60c25420ca2a42499b924"),
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
      foundLost: new mongoose.Types.ObjectId("63cc3484bc901245d3a1cb5a"),
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

// const createCategory = async (req, res) => {
//   const newcategory = { code: "Vehicle" };

//   const addedCategory = await Category.create(newcategory);

//   if (addedCategory) {
//     res
//       .status(201)
//       .json({ message: `new category ${addedCategory.code} added` });
//   } else {
//     res.status(400).json({ message: "Invalid caCategory data recieved!" });
//   }
// };

const postsPerDay = async () => {
  const currentDate = new Date();

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
    foundLost: new mongoose.Types.ObjectId("66e60c25420ca2a42499b924"),
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
    foundLost: new mongoose.Types.ObjectId("63cc3484bc901245d3a1cb5a"),
  }).countDocuments();

  const createdToday = { todaysFoundPosts, todaysLostPosts };

  console.log("Posts inserted today:", createdToday);
};

module.exports = {
  getDashboard,
  getflOptions,
  getCategories,
  getCountries,
  // createCategory,
};
