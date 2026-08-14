const crypto = require('crypto');

/**
 * Verifies Meta's `X-Hub-Signature-256` header against the raw request body,
 * using the app secret both sides already share. Without this, the webhook
 * URL is a public POST endpoint that triggers a database lookup and a Graph
 * API call on every request - anyone who finds it could spam it. The
 * signature is what makes "this really came from Meta" checkable instead of
 * assumed.
 *
 * Needs req.rawBody, which server.js's `express.json({ verify })` stashes
 * before parsing - HMAC has to run over the exact bytes Meta signed, and
 * re-serializing the parsed JSON is not guaranteed to reproduce them
 * byte-for-byte (key order, whitespace, unicode escaping can all differ).
 */
const verifyFacebookSignature = (req, res, next) => {
  const secret = process.env.FACEBOOK_APP_SECRET;
  if (!secret) {
    console.error('Facebook webhook rejected: FACEBOOK_APP_SECRET is not configured');
    return res.sendStatus(500);
  }

  const signatureHeader = req.get('X-Hub-Signature-256');
  if (!signatureHeader || !req.rawBody) {
    return res.sendStatus(401);
  }

  const expected = `sha256=${crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex')}`;

  const provided = Buffer.from(signatureHeader);
  const expectedBuffer = Buffer.from(expected);

  // Buffers of different lengths would throw inside timingSafeEqual rather
  // than just returning false, and the length check itself leaks nothing an
  // attacker doesn't already know (the algorithm and signature format are
  // public), so it is safe ahead of the constant-time comparison.
  const isValid = provided.length === expectedBuffer.length
    && crypto.timingSafeEqual(provided, expectedBuffer);

  if (!isValid) {
    return res.sendStatus(401);
  }

  next();
};

module.exports = verifyFacebookSignature;
