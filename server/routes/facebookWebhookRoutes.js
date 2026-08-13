const express = require('express');
const router = express.Router();
const verifyFacebookSignature = require('../middleware/facebookWebhookSecurity');
const socialStatsService = require('../services/socialStatsService');

/**
 * Facebook Page webhook receiver.
 *
 * A reaction, comment or share on a Page post fires a `feed` change event
 * naming the post that changed (`post_id`) - this is what lets the site
 * refresh that one post's numbers within moments of the real event, instead
 * of waiting for the next opportunistic poll. It is purely an accelerant on
 * top of the existing TTL-based polling (services/socialStatsService.js),
 * never a replacement for it: Meta documents webhook delivery as best-effort
 * (can be delayed or dropped), so the poll remains the guarantee that a post
 * eventually catches up even if a delivery is missed.
 *
 * Instagram has no equivalent for likes - only comments/mentions are ever
 * pushed, never a like - so IG engagement stays entirely poll-based
 * regardless of anything built here.
 *
 * One-time setup in the Meta App Dashboard: Webhooks product -> Page ->
 * callback URL = this route's public URL, verify token =
 * FACEBOOK_WEBHOOK_VERIFY_TOKEN, subscribe the Page to the `feed` field.
 * Full walkthrough: docs/facebook-webhooks.md.
 */

/**
 * Meta's one-time handshake, run whenever the callback URL is registered or
 * re-verified in the App Dashboard: echo hub.challenge back iff the verify
 * token matches what only we and Meta's dashboard config know. Pure and
 * exported so the decision can be unit tested without going through Express.
 */
const resolveVerificationChallenge = ({ mode, token, challenge }, expectedToken) => {
  if (mode === 'subscribe' && expectedToken && token === expectedToken) {
    return { status: 200, body: challenge };
  }
  return { status: 403, body: undefined };
};

router.get('/facebook', (req, res) => {
  const result = resolveVerificationChallenge({
    mode: req.query['hub.mode'],
    token: req.query['hub.verify_token'],
    challenge: req.query['hub.challenge'],
  }, process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN);

  res.status(result.status).send(result.body);
});

router.post('/facebook', verifyFacebookSignature, (req, res) => {
  // Answer Meta immediately - it retries aggressively on a slow or non-200
  // response, and the actual refresh has nothing useful to report back to it
  // anyway. Same fire-and-forget shape as every other social write in this
  // codebase (see facebookService.js/instagramService.js's own callers).
  res.sendStatus(200);

  const postIds = extractChangedFacebookPostIds(req.body);
  if (postIds.length > 0) {
    socialStatsService.scheduleRefreshByFacebookPostIds(postIds);
  }
});

/**
 * Pulls every post_id referenced by a `feed` change out of one webhook
 * delivery. Meta can (and does) batch multiple entries/changes into a single
 * POST, so this always returns a list, deduplicated, not just the first hit.
 *
 * The entry.id check is defensive rather than load-bearing: we only ever
 * subscribe our own Page, so a mismatch here would mean the App Dashboard
 * subscription itself is misconfigured, not that the request is spoofed
 * (verifyFacebookSignature already ruled that out before this runs).
 */
const extractChangedFacebookPostIds = (payload) => {
  if (payload?.object !== 'page') return [];

  const postIds = new Set();
  for (const entry of payload.entry || []) {
    if (process.env.FACEBOOK_PAGE_ID && entry.id !== process.env.FACEBOOK_PAGE_ID) continue;
    for (const change of entry.changes || []) {
      if (change.field !== 'feed') continue;
      const postId = change.value?.post_id;
      if (postId) postIds.add(postId);
    }
  }
  return Array.from(postIds);
};

module.exports = router;
module.exports.resolveVerificationChallenge = resolveVerificationChallenge;
module.exports.extractChangedFacebookPostIds = extractChangedFacebookPostIds;
