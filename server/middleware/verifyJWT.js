const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  // look at the decode values !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    req.user = decoded.UserInfo.usernameId;
    req.username = decoded.UserInfo.username;
    req.country = decoded.UserInfo.country;
    // generateTokens has always put the role in the payload, but this middleware
    // never read it back out - so ownership checks written as
    // `req.user !== owner && req.role !== 'admin'` were silently evaluating an
    // undefined role. Tokens issued before the field existed simply come back
    // undefined here, which reads as "not an admin".
    req.role = decoded.UserInfo.role;
    next();
  });
};


module.exports = verifyJWT;
