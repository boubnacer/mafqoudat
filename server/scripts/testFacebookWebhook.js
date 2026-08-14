/**
 * Offline check of the Facebook Page webhook receiver.
 *
 *   node scripts/testFacebookWebhook.js
 *
 * Needs no database, no network, and no running server - exercises the
 * signature verification middleware and the payload-parsing logic directly
 * with mock req/res objects, the same way the rest of this codebase's
 * offline checks stub their one or two points of contact with the outside
 * world rather than standing up a real HTTP server.
 *
 * What actually matters here: a forged POST must never pass (this endpoint
 * triggers a database lookup and a Graph API call on every accepted
 * request), a genuine one must always pass, and a batched delivery covering
 * several posts at once must be parsed completely, not just its first entry.
 *
 * Exits non-zero if any assertion failed.
 */

const crypto = require('crypto');
const verifyFacebookSignature = require('../middleware/facebookWebhookSecurity');
const { resolveVerificationChallenge, extractChangedFacebookPostIds } = require('../routes/facebookWebhookRoutes');

let failures = 0;
let checks = 0;

const check = (label, actual, expected) => {
  checks += 1;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures += 1;
    console.error(`FAIL  ${label}\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`);
  } else {
    console.log(`ok    ${label}`);
  }
};

const checkThat = (label, condition, detail = '') => {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`FAIL  ${label}${detail ? `\n        ${detail}` : ''}`);
  } else {
    console.log(`ok    ${label}${detail ? `  (${detail})` : ''}`);
  }
};

const APP_SECRET = 'test-app-secret';
process.env.FACEBOOK_APP_SECRET = APP_SECRET;

const sign = (rawBody, secret = APP_SECRET) =>
  `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;

/** A mock req/res pair for the signature middleware, and what it recorded. */
const runSignatureCheck = (body, headers = {}) => {
  const rawBody = Buffer.from(JSON.stringify(body));
  const req = {
    rawBody,
    get: (name) => headers[name],
  };
  let statusSent = null;
  let nextCalled = false;
  const res = { sendStatus: (code) => { statusSent = code; } };
  verifyFacebookSignature(req, res, () => { nextCalled = true; });
  return { statusSent, nextCalled };
};

const pageChange = (postId, field = 'feed') => ({
  field,
  value: { item: 'reaction', verb: 'add', post_id: postId, reaction_type: 'like' },
});

const PAGE_ID = '1234567890';

const run = () => {
  console.log('\n--- signature verification ---');

  const body = { object: 'page', entry: [] };
  const rawBody = Buffer.from(JSON.stringify(body));

  checkThat('a correctly signed request passes',
    runSignatureCheck(body, { 'X-Hub-Signature-256': sign(rawBody) }).nextCalled);

  const wrongSecret = runSignatureCheck(body, { 'X-Hub-Signature-256': sign(rawBody, 'not-the-real-secret') });
  checkThat('a request signed with the wrong secret is rejected', !wrongSecret.nextCalled);
  check('with 401', wrongSecret.statusSent, 401);

  const tampered = (() => {
    const req = {
      rawBody: Buffer.from(JSON.stringify({ object: 'page', entry: [{ id: 'injected' }] })),
      get: () => sign(rawBody), // signature computed over the ORIGINAL body
    };
    let statusSent = null;
    let nextCalled = false;
    verifyFacebookSignature(req, { sendStatus: (code) => { statusSent = code; } }, () => { nextCalled = true; });
    return { statusSent, nextCalled };
  })();
  checkThat('a body modified after signing is rejected even with a real signature', !tampered.nextCalled);
  check('with 401', tampered.statusSent, 401);

  const noHeader = runSignatureCheck(body, {});
  checkThat('a request with no signature header at all is rejected', !noHeader.nextCalled);
  check('with 401, not 500 - this is the expected shape for an unsigned probe', noHeader.statusSent, 401);

  const differentLength = runSignatureCheck(body, { 'X-Hub-Signature-256': 'sha256=short' });
  checkThat('a signature of the wrong length is rejected without crashing', !differentLength.nextCalled);
  check('with 401', differentLength.statusSent, 401);

  const savedSecret = process.env.FACEBOOK_APP_SECRET;
  delete process.env.FACEBOOK_APP_SECRET;
  const noSecretConfigured = runSignatureCheck(body, { 'X-Hub-Signature-256': sign(rawBody) });
  process.env.FACEBOOK_APP_SECRET = savedSecret;
  checkThat('a misconfigured server (no app secret set) fails closed, not open', !noSecretConfigured.nextCalled);
  check('with 500, so it is loud in logs rather than silently accepting everything', noSecretConfigured.statusSent, 500);

  // -------------------------------------------------------------------------
  console.log('\n--- Meta\'s verification handshake ---');

  process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN = 'the-real-token';
  check('a correct subscribe request echoes the challenge back',
    resolveVerificationChallenge({ mode: 'subscribe', token: 'the-real-token', challenge: 'abc123' }, 'the-real-token'),
    { status: 200, body: 'abc123' });
  check('the wrong verify token is rejected',
    resolveVerificationChallenge({ mode: 'subscribe', token: 'guessed-token', challenge: 'abc123' }, 'the-real-token'),
    { status: 403, body: undefined });
  check('a non-subscribe mode is rejected even with the right token',
    resolveVerificationChallenge({ mode: 'unsubscribe', token: 'the-real-token', challenge: 'abc123' }, 'the-real-token'),
    { status: 403, body: undefined });
  check('an unconfigured verify token rejects everything rather than accepting anything',
    resolveVerificationChallenge({ mode: 'subscribe', token: 'the-real-token', challenge: 'abc123' }, undefined),
    { status: 403, body: undefined });

  // -------------------------------------------------------------------------
  console.log('\n--- parsing which posts changed ---');

  process.env.FACEBOOK_PAGE_ID = PAGE_ID;

  check('a single reaction event yields that one post id',
    extractChangedFacebookPostIds({
      object: 'page',
      entry: [{ id: PAGE_ID, changes: [pageChange(`${PAGE_ID}_111`)] }],
    }),
    [`${PAGE_ID}_111`]);

  check('a batched delivery covering several posts yields all of them',
    extractChangedFacebookPostIds({
      object: 'page',
      entry: [
        { id: PAGE_ID, changes: [pageChange(`${PAGE_ID}_111`), pageChange(`${PAGE_ID}_222`)] },
        { id: PAGE_ID, changes: [pageChange(`${PAGE_ID}_333`)] },
      ],
    }),
    [`${PAGE_ID}_111`, `${PAGE_ID}_222`, `${PAGE_ID}_333`]);

  check('the same post referenced twice in one delivery is only listed once',
    extractChangedFacebookPostIds({
      object: 'page',
      entry: [{ id: PAGE_ID, changes: [pageChange(`${PAGE_ID}_111`), pageChange(`${PAGE_ID}_111`)] }],
    }),
    [`${PAGE_ID}_111`]);

  check('a change on a field other than feed is ignored',
    extractChangedFacebookPostIds({
      object: 'page',
      entry: [{ id: PAGE_ID, changes: [pageChange(`${PAGE_ID}_111`, 'mention')] }],
    }),
    []);

  check('an entry for a different page id is ignored - defensive, not load-bearing',
    extractChangedFacebookPostIds({
      object: 'page',
      entry: [{ id: 'some-other-page', changes: [pageChange(`${PAGE_ID}_111`)] }],
    }),
    []);

  check('a non-page object (e.g. a misrouted user webhook) yields nothing',
    extractChangedFacebookPostIds({ object: 'user', entry: [] }),
    []);

  checkThat('a missing or malformed payload does not throw',
    (() => {
      try {
        extractChangedFacebookPostIds(null);
        extractChangedFacebookPostIds({});
        extractChangedFacebookPostIds({ object: 'page' });
        extractChangedFacebookPostIds({ object: 'page', entry: [{ id: PAGE_ID }] });
        return true;
      } catch (error) {
        return false;
      }
    })());
};

run();

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
