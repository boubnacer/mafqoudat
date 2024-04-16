const mongoose = require("mongoose");

const categoriesSchema = new mongoose.Schema({
  code: {
    type: String,
  },
  flag: {
    type: String,
  },
});

module.exports = mongoose.model("Category", categoriesSchema);
