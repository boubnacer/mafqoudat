const express = require("express");
const { getDashboard } = require("../controllers/dependenciesController");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT);

router.route("/").get(getDashboard);

module.exports = router;
