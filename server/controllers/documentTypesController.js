const DocumentType = require("../models/DocumentType");
const { normalizeText } = require("../utils/textMatching");

const LABEL_MAX_LENGTH = DocumentType.LABEL_MAX_LENGTH;

// The Latin label must be Latin and the Arabic one Arabic - otherwise the same
// title gets contributed twice, once under each field, and the list a reader
// scans in Arabic fills up with French. Checked by script, not by alphabet, so
// accents and Arabic diacritics are fine.
const HAS_ARABIC = /\p{Script=Arabic}/u;
const HAS_LATIN = /\p{Script=Latin}/u;

/**
 * A code for a contributed title: the Latin label, upper-cased and stripped to
 * word characters, with a short random suffix. Human-readable in the DB, and
 * the suffix is what keeps it unique without a lookup - the real duplicate
 * check is the unique index on `normalizedLabels`.
 */
const buildCustomCode = (latinLabel) => {
  const base = normalizeText(latinLabel)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${base ? `CUSTOM_${base}` : "CUSTOM"}_${suffix}`;
};

const toPublicShape = (doc) => ({
  _id: doc._id,
  id: doc._id,
  code: doc.code,
  labels: doc.labels,
  isCustom: !!doc.isCustom,
  priority: doc.priority ?? 0,
});

// @desc   List the document titles a DOCUMENTS listing can name
// @route  GET /document-types
// @access Public - the New Post form reads it before anything is submitted,
//         and the same list labels a listing for every visitor reading it.
const getDocumentTypes = async (req, res) => {
  try {
    const { search } = req.query;

    const filter = { isActive: true };
    if (search && String(search).trim()) {
      const normalized = normalizeText(search);
      if (normalized) {
        // Matched against the normalized forms rather than the labels, so a
        // reader typing "passeport" finds "Passeport" and one typing without
        // hamza still finds "جواز السفر".
        filter.normalizedLabels = { $regex: normalized.split(" ")[0], $options: "i" };
      }
    }

    const documentTypes = await DocumentType.find(filter)
      .select("code labels isCustom priority")
      .sort({ priority: -1, "labels.en": 1 })
      .lean()
      .exec();

    return res.status(200).json(documentTypes.map(toPublicShape));
  } catch (error) {
    console.error("Error fetching document types:", error);
    return res.status(500).json({ message: "Failed to load document types" });
  }
};

// @desc   Add a document title a reader could not find in the list
// @route  POST /document-types
// @access Private (verifyJWT) - the row is listed to everyone from the moment
//         it exists, so it is never written by an anonymous request.
const createDocumentType = async (req, res) => {
  try {
    const arabicLabel = typeof req.body?.arabicLabel === "string" ? req.body.arabicLabel.trim() : "";
    const latinLabel = typeof req.body?.latinLabel === "string" ? req.body.latinLabel.trim() : "";

    const fields = [];
    if (!arabicLabel) {
      fields.push({ field: "arabicLabel", message: "The Arabic name is required" });
    } else if (arabicLabel.length > LABEL_MAX_LENGTH) {
      fields.push({ field: "arabicLabel", message: `The Arabic name must be less than ${LABEL_MAX_LENGTH} characters` });
    } else if (!HAS_ARABIC.test(arabicLabel)) {
      fields.push({ field: "arabicLabel", message: "The Arabic name must be written in Arabic letters" });
    }

    if (!latinLabel) {
      fields.push({ field: "latinLabel", message: "The Latin name is required" });
    } else if (latinLabel.length > LABEL_MAX_LENGTH) {
      fields.push({ field: "latinLabel", message: `The Latin name must be less than ${LABEL_MAX_LENGTH} characters` });
    } else if (!HAS_LATIN.test(latinLabel)) {
      fields.push({ field: "latinLabel", message: "The Latin name must be written in Latin letters" });
    }

    if (fields.length > 0) {
      return res.status(400).json({ message: "Invalid document title", fields });
    }

    const labels = { ar: arabicLabel, en: latinLabel, fr: latinLabel };
    const normalizedLabels = DocumentType.buildNormalizedLabels(labels);

    // The list is small and read constantly, so an existing title is answered
    // with a 200 and the row itself rather than an error the form would have
    // to explain: the reader wanted that title selected, and it now is.
    const existing = await DocumentType.findOne({ normalizedLabels: { $in: normalizedLabels } })
      .select("code labels isCustom priority isActive")
      .lean()
      .exec();

    if (existing) {
      if (!existing.isActive) {
        // Deactivated by an admin. Answering with it would silently undo that
        // decision, so the reader is told it is unavailable instead.
        return res.status(409).json({ message: "This document title is not available" });
      }
      return res.status(200).json({ documentType: toPublicShape(existing), created: false });
    }

    const created = await DocumentType.create({
      code: buildCustomCode(latinLabel),
      labels,
      isCustom: true,
      createdBy: req.user || null,
      // Contributed titles sort below the curated ones, which is where a
      // reader scanning the list expects the long tail to be.
      priority: 0,
    });

    return res.status(201).json({ documentType: toPublicShape(created), created: true });
  } catch (error) {
    // The unique index on normalizedLabels is the real duplicate check - two
    // people submitting the same title at the same moment both get past the
    // lookup above, and exactly one of them lands here.
    if (error?.code === 11000) {
      const labels = {
        ar: String(req.body?.arabicLabel || "").trim(),
        en: String(req.body?.latinLabel || "").trim(),
        fr: String(req.body?.latinLabel || "").trim(),
      };
      const normalizedLabels = DocumentType.buildNormalizedLabels(labels);
      const winner = await DocumentType.findOne({ normalizedLabels: { $in: normalizedLabels } })
        .select("code labels isCustom priority")
        .lean()
        .exec();
      if (winner) {
        return res.status(200).json({ documentType: toPublicShape(winner), created: false });
      }
    }

    if (error?.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid document title" });
    }

    console.error("Error creating document type:", error);
    return res.status(500).json({ message: "Failed to save the document title" });
  }
};

module.exports = { getDocumentTypes, createDocumentType, toPublicShape };
