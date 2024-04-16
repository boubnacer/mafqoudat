const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema({
  code: {
    type: String,
    default: "Malawi",
  },
  label: {
    type: String,
    default: "Malawi",
  },
});

module.exports = mongoose.model("Country", countrySchema);
