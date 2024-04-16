const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Country",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    foundLost: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "FoundLost",
    },
    region: {
      type: String,
      required: true,
    },

    contact: {
      type: String,
      required: true,
    },
    returned: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
    },
    mainDate: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.plugin(AutoIncrement, {
  inc_field: "ticket",
  id: "ticketNums",
  start_seq: 500,
});

module.exports = mongoose.model("Post", postSchema);
