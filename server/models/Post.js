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
    // Add missing fields that are referenced in controllers
    reported: {
      type: Boolean,
      default: false,
    },
    reportedTxt: {
      type: String,
      default: "",
    },
    // Updated to support multilingual content
    title: {
      type: String,
      default: "",
    },
    // New multilingual title field
    titleLabels: {
      en: {
        type: String,
        default: "",
        trim: true
      },
      fr: {
        type: String,
        default: "",
        trim: true
      },
      ar: {
        type: String,
        default: "",
        trim: true
      }
    },
    description: {
      type: String,
      default: "",
    },
    // New multilingual description field
    descriptionLabels: {
      en: {
        type: String,
        default: "",
        trim: true
      },
      fr: {
        type: String,
        default: "",
        trim: true
      },
      ar: {
        type: String,
        default: "",
        trim: true
      }
    }
  },
  {
    timestamps: true,
  }
);

// Index for efficient multilingual search
postSchema.index({ 
  "titleLabels.en": "text", 
  "titleLabels.fr": "text", 
  "titleLabels.ar": "text",
  "descriptionLabels.en": "text", 
  "descriptionLabels.fr": "text", 
  "descriptionLabels.ar": "text",
  "region": "text"
});

// Virtual for backward compatibility
postSchema.virtual('titleText').get(function() {
  return this.title || this.titleLabels?.en || '';
});

postSchema.virtual('descriptionText').get(function() {
  return this.description || this.descriptionLabels?.en || '';
});

// Method to get title by language
postSchema.methods.getTitle = function(language = 'en') {
  return this.titleLabels?.[language] || this.titleLabels?.en || this.title || '';
};

// Method to get description by language
postSchema.methods.getDescription = function(language = 'en') {
  return this.descriptionLabels?.[language] || this.descriptionLabels?.en || this.description || '';
};

postSchema.plugin(AutoIncrement, {
  inc_field: "ticket",
  id: "ticketNums",
  start_seq: 500,
});

module.exports = mongoose.model("Post", postSchema);
