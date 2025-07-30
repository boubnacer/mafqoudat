const Country = require("../models/Country");

const getCountries = async (req, res) => {
  const countries = await Country.find({}).lean().exec();

  if (!countries.length)
    return res.status(400).json({ message: "No countries found" });

  res.json(countries);
};

const createCountry = async (req, res) => {
  const { code, label } = req.body;
  if (!code || !label) {
    return res.status(400).json({ message: "Country code and label are required" });
  }
  const newcountry = { code, label };
  const addedCountry = await Country.create(newcountry);
  if (addedCountry) {
    res.status(201).json({ message: `new country ${addedCountry.code} added` });
  } else {
    res.status(400).json({ message: "Invalid country data received!" });
  }
};

module.exports = { getCountries, createCountry };
