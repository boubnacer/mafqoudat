const mongoose = require("mongoose");
const { normalizeText } = require("../utils/textMatching");

// A document title is a name on a piece of paper, not prose: long enough for
// "Compulsory health insurance certificate (AMO)", short enough that nothing
// resembling a description can be filed as one.
const LABEL_MAX_LENGTH = 80;

/**
 * One title a DOCUMENTS listing can name ("passport", "جواز السفر").
 *
 * DOCUMENTS listings carry no photo - publishing a picture of someone's ID is
 * the one thing this site must not do - so this collection is what a reader
 * picks from instead. The seed rows live in config/documentTypes.js; rows a
 * reader adds through the form's "Other document" option carry
 * `isCustom: true` and their author in `createdBy`, and are listed to everyone
 * from the moment they are created, which is the point of saving them at all.
 */
const documentTypeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    labels: {
      ar: {
        type: String,
        required: true,
        trim: true,
        maxlength: [LABEL_MAX_LENGTH, `Label cannot exceed ${LABEL_MAX_LENGTH} characters`],
      },
      en: {
        type: String,
        required: true,
        trim: true,
        maxlength: [LABEL_MAX_LENGTH, `Label cannot exceed ${LABEL_MAX_LENGTH} characters`],
      },
      fr: {
        type: String,
        required: true,
        trim: true,
        maxlength: [LABEL_MAX_LENGTH, `Label cannot exceed ${LABEL_MAX_LENGTH} characters`],
      },
    },
    // Script-normalized forms of every label, which is what stops the same
    // title being added a second time under a different spelling: "Passeport",
    // "passeport " and "PASSEPORT" all normalize to one string, and the Arabic
    // normalizer folds hamza/taa-marbuta variants the same way. Unique per
    // entry, so a duplicate is refused by the index rather than by a lookup
    // that two simultaneous submissions could both pass.
    normalizedLabels: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // True for a title a reader added from the New Post form. Kept so the
    // seeded vocabulary stays distinguishable from user-contributed titles
    // (an admin cleaning up duplicates needs to know which is which); it does
    // not change how the title is listed or rendered.
    isCustom: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // How many listings have named this title. Read by nothing that decides
    // anything yet; it is what a later pass would order the "other" titles by,
    // and what tells an admin which contributed titles are real.
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    priority: {
      type: Number,
      default: 0,
    },
    searchTerms: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// The list is read in one shape only: active titles, most likely first.
documentTypeSchema.index({ isActive: 1, priority: -1, "labels.en": 1 });

// Multikey and unique: no two titles may share a normalized spelling in any
// language. A lookup-then-insert would let two people submitting the same
// title at the same moment both pass the lookup; this refuses the second one
// at the write, and the controller answers with the row that won.
documentTypeSchema.index({ normalizedLabels: 1 }, { unique: true });

/** Every distinct normalized spelling of a title, in all three languages. */
const buildNormalizedLabels = (labels = {}) => {
  const forms = ["ar", "en", "fr"]
    .map((lang) => normalizeText(labels[lang]))
    .filter(Boolean);
  return [...new Set(forms)];
};

documentTypeSchema.statics.buildNormalizedLabels = buildNormalizedLabels;
documentTypeSchema.statics.LABEL_MAX_LENGTH = LABEL_MAX_LENGTH;

documentTypeSchema.pre("save", function (next) {
  this.normalizedLabels = buildNormalizedLabels(this.labels);
  next();
});

module.exports = mongoose.model("DocumentType", documentTypeSchema);
