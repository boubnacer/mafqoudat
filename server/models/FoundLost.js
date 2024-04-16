const mongoose = require("mongoose");

const foundlostSchema = new mongoose.Schema({
  code: {
    type: String,
  },
});

module.exports = mongoose.model("FoundLost", foundlostSchema);
