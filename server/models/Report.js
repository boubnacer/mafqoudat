const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  postLink: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Post",
  },
  message: {
    type: String,
    default: "",
  },
  contact: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("Report", reportSchema);
