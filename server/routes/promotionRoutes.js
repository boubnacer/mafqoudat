const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const { requestPromotion } = require("../controllers/promotionController");
const emailNotification = require("../utils/emailNotification");

// @route POST /api/promotion/request
// @desc Request promotion for a lost item
// @access Private
router.post("/request", verifyJWT, requestPromotion);

// @route POST /api/promotion/test-email
// @desc Test email notification
// @access Private
router.post("/test-email", verifyJWT, async (req, res) => {
  try {
    const result = await emailNotification.sendTestEmail();
    if (result.success) {
      res.json({ message: "Test email sent successfully!" });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
