const Country = require("../models/Country");

const getCountries = async (req, res) => {
  const countries = await Country.find({}).lean().exec();

  if (!countries.length)
    return res.status(400).json({ message: "No countries found" });

  res.json(countries);
};

const createCountry = async (req, res) => {
  const newcountry = { code: "Morocco" };

  const addedCountry = await Country.create(newcountry);

  if (addedCountry) {
    res.status(201).json({ message: `new country ${addedCountry.code} added` });
  } else {
    res.status(400).json({ message: "Invalid country data recieved!" });
  }
};

module.exports = { getCountries, createCountry };
