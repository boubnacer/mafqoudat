/**
 * Live check of the five session-model fixes layered on top of the
 * short-lived-token/refresh-token rework.
 *
 *   node scripts/testAuthSessionFixes.js
 *
 * Boots a real Express server on an ephemeral port with the REAL auth routes,
 * controllers and middleware (csrfGuard, rateLimiting, authSession, tokenStore,
 * jwtSecurity) and drives real HTTP requests through it. Only models/User is
 * stubbed - MongoDB is the one dependency this cannot reach offline, and none
 * of the five fixes live in the database layer.
 *
 * Each block reproduces the specific failure mode before asserting the fix:
 *   1. a legacy bootstrap token replayed a second time
 *   2. tokens in a redirect URL (which middleware/logger.js writes to disk)
 *   3. a cross-site form post to /auth/logout and /auth/refresh
 *   4. two tabs racing the same refresh cookie
 *   5. PATCH /users minting an access token with no session behind it
 *
 * Exits non-zero if any assertion failed.
 */

const path = require('path');
const fs = require('fs');
const Module = require('module');

// Short access lifetime so a 30-day token is recognisably "legacy" - the local
// .env still carries the pre-rework JWT_ACCESS_EXPIRES_IN=30d. Set before
// dotenv, which never overrides an already-set variable.
process.env.JWT_ACCESS_EXPIRES_IN = '30m';
process.env.NODE_ENV = 'development'; // cookie: secure=false, sameSite=lax, so it survives plain http
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-auth-session-fixes';

const USER_ID = '507f1f77bcf86cd799439011';
const COUNTRY_ID = '507f1f77bcf86cd799439012';
const OTHER_COUNTRY_ID = '507f1f77bcf86cd799439013';

// ---------------------------------------------------------------- User stub
const makeQuery = (value) => {
  const q = {
    select: () => q,
    collation: () => q,
    lean: () => q,
    populate: () => q,
    exec: async () => value,
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  };
  return q;
};

const savedUsers = [];
const userState = {
  isActive: true,
  username: 'legacyuser',
  country: COUNTRY_ID,
};

const UserStub = {
  findById: () =>
    makeQuery({
      _id: USER_ID,
      id: USER_ID,
      username: userState.username,
      country: userState.country,
      role: 'user',
      isActive: userState.isActive,
      password: null,
      email: null,
      phone: null,
      authProvider: 'local',
      profile: {},
      save: async function () {
        savedUsers.push({ username: this.username, country: this.country });
        return this;
      },
    }),
  findOne: () => makeQuery(null),
};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === '../models/User') return UserStub;
  return originalLoad.apply(this, arguments);
};

// ------------------------------------------------------------------ harness
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const { generateTokens, verifyJWT, isTokenBlacklisted, JWT_CONFIG } = require('../middleware/jwtSecurity');
const { createExchangeCode, consumeExchangeCode } = require('../utils/oauthExchange');
const usersController = require('../controllers/usersController');

let failures = 0;
let checks = 0;

const check = (label, condition, detail = '') => {
  checks += 1;
  if (condition) {
    console.log(`ok    ${label}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${label}${detail ? `\n        ${detail}` : ''}`);
  }
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/auth', require('../routes/authRoutes'));

// A real protected route, so "is this legacy token still usable anywhere?" is
// answered by the same verifyJWT every other endpoint runs behind.
app.get('/protected', verifyJWT, (req, res) => res.json({ ok: true, user: req.user }));

// PATCH /users behind a stand-in for verifyJWT (the fix under test is which
// token-minting helper the controller calls, not how the caller authenticates).
app.patch('/users', (req, res, next) => { req.user = USER_ID; req.role = 'user'; next(); }, usersController.updateUser);

const server = app.listen(0, '127.0.0.1');
const listening = new Promise((resolve) => server.once('listening', resolve));

const baseUrl = () => `http://127.0.0.1:${server.address().port}`;

// Minimal cookie jar - the whole of fixes 3 and 4 is about what a browser's
// shared cookie does, so the tests need one.
const parseSetCookie = (response) => {
  const raw = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  return raw.map((line) => {
    const [pair] = line.split(';');
    const index = pair.indexOf('=');
    return { name: pair.slice(0, index).trim(), value: pair.slice(index + 1).trim(), raw: line };
  });
};

const request = async (method, url, { headers = {}, body, cookie } = {}) => {
  const init = { method, headers: { ...headers }, redirect: 'manual' };
  if (cookie) init.headers.Cookie = cookie;
  if (body !== undefined) init.body = body;
  const response = await fetch(`${baseUrl()}${url}`, init);
  let json = null;
  try { json = await response.json(); } catch (error) { /* non-JSON body */ }
  return { status: response.status, json, cookies: parseSetCookie(response) };
};

const jsonPost = (url, options = {}) =>
  request('POST', url, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(options.headers || {}) },
    body: JSON.stringify(options.payload || {}),
  });

const refreshCookieOf = (result) => {
  const found = result.cookies.find((c) => c.name === 'refreshToken');
  return found && found.value ? `refreshToken=${found.value}` : null;
};

// A legacy pre-migration access token: 30-day lifetime, no refresh session.
const mintLegacyToken = () => {
  const original = JWT_CONFIG.accessTokenExpiry;
  JWT_CONFIG.accessTokenExpiry = '30d';
  const { accessToken } = generateTokens({ username: 'legacyuser', id: USER_ID, country: COUNTRY_ID, role: 'user' });
  JWT_CONFIG.accessTokenExpiry = original;
  return accessToken;
};

const run = async () => {
  await listening;

  // ============================================================= FIX 1
  console.log('\n--- 1. legacy bootstrap token is revoked once traded in ---');

  const legacyToken = mintLegacyToken();
  const legacyJti = jwt.decode(legacyToken).jti;

  const beforeUse = await request('GET', '/protected', { headers: { Authorization: `Bearer ${legacyToken}` } });
  check('legacy token works on a protected route before bootstrap', beforeUse.status === 200,
    `got ${beforeUse.status} ${JSON.stringify(beforeUse.json)}`);

  const bootstrap = await jsonPost('/auth/refresh', { headers: { Authorization: `Bearer ${legacyToken}` } });
  check('bootstrap succeeds and returns a new session',
    bootstrap.status === 200 && !!bootstrap.json?.accessToken && !!bootstrap.json?.refreshToken,
    `got ${bootstrap.status} ${JSON.stringify(bootstrap.json)}`);

  check('legacy jti is now denylisted', (await isTokenBlacklisted(legacyJti)) === true);

  const replay = await jsonPost('/auth/refresh', { headers: { Authorization: `Bearer ${legacyToken}` } });
  check('same legacy token cannot bootstrap a second session', replay.status === 401,
    `got ${replay.status} ${JSON.stringify(replay.json)}`);

  const afterUse = await request('GET', '/protected', { headers: { Authorization: `Bearer ${legacyToken}` } });
  check('legacy token is refused everywhere else too, as TOKEN_REVOKED',
    afterUse.status === 401 && afterUse.json?.code === 'TOKEN_REVOKED',
    `got ${afterUse.status} ${JSON.stringify(afterUse.json)}`);

  // ============================================================= FIX 2
  console.log('\n--- 2. mobile OAuth tokens never travel in a URL ---');

  const fakeTokens = { accessToken: 'access-token-value', refreshToken: 'refresh-token-value' };
  const code = createExchangeCode(fakeTokens);
  const redirectUrl = `/auth/mobile-callback?code=${encodeURIComponent(code)}`;

  check('the redirect URL a logger would record carries neither token',
    !redirectUrl.includes(fakeTokens.accessToken) && !redirectUrl.includes(fakeTokens.refreshToken),
    redirectUrl);

  ['googleAuthRoutes.js', 'facebookAuthRoutes.js'].forEach((name) => {
    const text = fs.readFileSync(path.join(__dirname, '..', 'routes', name), 'utf8');
    check(`${name} builds no mobile-callback URL containing a token`,
      !/mobile-callback\?[^`'"]*(?:token|refreshToken)=\$\{/.test(text));
  });
  const bridge = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'mobile-callback.js'), 'utf8');
  check('mobile-callback.js no longer reads token/refreshToken off the URL',
    !bridge.includes("params.get('token')") && !bridge.includes("params.get('refreshToken')"));

  const exchanged = await jsonPost('/auth/mobile-exchange', { payload: { code } });
  check('the app can exchange the code for the real tokens',
    exchanged.status === 200
      && exchanged.json?.accessToken === fakeTokens.accessToken
      && exchanged.json?.refreshToken === fakeTokens.refreshToken,
    `got ${exchanged.status} ${JSON.stringify(exchanged.json)}`);

  const replayedCode = await jsonPost('/auth/mobile-exchange', { payload: { code } });
  check('the code is single-use',
    replayedCode.status === 400 && replayedCode.json?.code === 'INVALID_EXCHANGE_CODE',
    `got ${replayedCode.status} ${JSON.stringify(replayedCode.json)}`);

  check('an unknown code is refused', consumeExchangeCode('not-a-real-code') === null);

  // ============================================================= FIX 3
  console.log('\n--- 3. cross-site form posts cannot drive /auth/refresh or /auth/logout ---');

  // Give the "victim" a live session, exactly as a browser would hold it.
  const victim = await jsonPost('/auth/refresh', { headers: { Authorization: `Bearer ${mintLegacyToken()}` } });
  const victimCookie = refreshCookieOf(victim);
  check('victim holds a refresh cookie', !!victimCookie);

  // What an attacker page can actually send: a simple form post, no preflight,
  // the browser attaching the SameSite=None cookie on its own.
  const formLogout = await request('POST', '/auth/logout', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: 'https://evil.example' },
    body: '',
    cookie: victimCookie,
  });
  check('cross-site form post to /auth/logout is rejected',
    formLogout.status === 403 && formLogout.json?.code === 'CSRF_HEADER_REQUIRED',
    `got ${formLogout.status} ${JSON.stringify(formLogout.json)}`);

  const formRefresh = await request('POST', '/auth/refresh', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: 'https://evil.example' },
    body: '',
    cookie: victimCookie,
  });
  check('cross-site form post to /auth/refresh is rejected',
    formRefresh.status === 403 && formRefresh.json?.code === 'CSRF_HEADER_REQUIRED',
    `got ${formRefresh.status} ${JSON.stringify(formRefresh.json)}`);

  const stillAlive = await jsonPost('/auth/refresh', { cookie: victimCookie });
  check('the victim session survived the attempt',
    stillAlive.status === 200 && !!stillAlive.json?.accessToken,
    `got ${stillAlive.status} ${JSON.stringify(stillAlive.json)}`);

  const legitLogout = await jsonPost('/auth/logout', { cookie: refreshCookieOf(stillAlive) });
  check('the app own logout, carrying the header, still works', legitLogout.status === 200,
    `got ${legitLogout.status} ${JSON.stringify(legitLogout.json)}`);

  // ============================================================= FIX 4
  console.log('\n--- 4. two tabs racing one refresh cookie ---');

  const seed = await jsonPost('/auth/refresh', { headers: { Authorization: `Bearer ${mintLegacyToken()}` } });
  const sharedCookie = refreshCookieOf(seed);
  check('a session to race with', !!sharedCookie);

  const [tabA, tabB] = await Promise.all([
    jsonPost('/auth/refresh', { cookie: sharedCookie }),
    jsonPost('/auth/refresh', { cookie: sharedCookie }),
  ]);

  const winner = [tabA, tabB].find((r) => r.status === 200);
  const loser = [tabA, tabB].find((r) => r.status !== 200);

  check('exactly one tab wins the rotation', !!winner && !!loser && loser.status === 401,
    `statuses ${tabA.status}/${tabB.status}`);
  check('the loser is told REFRESH_INVALID', loser?.json?.code === 'REFRESH_INVALID',
    JSON.stringify(loser?.json));
  check('the loser does NOT send a cookie-clearing Set-Cookie',
    (loser?.cookies || []).every((c) => c.name !== 'refreshToken'),
    JSON.stringify((loser?.cookies || []).map((c) => c.raw)));

  const winnerCookie = refreshCookieOf(winner);
  check('the winner issued a new refresh cookie', !!winnerCookie);

  const afterRace = await jsonPost('/auth/refresh', { cookie: winnerCookie });
  check('the surviving cookie still refreshes - no forced re-login',
    afterRace.status === 200 && !!afterRace.json?.accessToken,
    `got ${afterRace.status} ${JSON.stringify(afterRace.json)}`);

  // The cases where clearing IS right must still clear.
  const noToken = await jsonPost('/auth/refresh');
  check('a request with no refresh token at all is 401 NO_REFRESH_TOKEN',
    noToken.status === 401 && noToken.json?.code === 'NO_REFRESH_TOKEN',
    `got ${noToken.status} ${JSON.stringify(noToken.json)}`);
  check('...and does clear the cookie',
    noToken.cookies.some((c) => c.name === 'refreshToken' && !c.value),
    JSON.stringify(noToken.cookies.map((c) => c.raw)));

  const inactiveSeed = await jsonPost('/auth/refresh', { cookie: refreshCookieOf(afterRace) });
  const inactiveCookie = refreshCookieOf(inactiveSeed);
  userState.isActive = false;
  const inactive = await jsonPost('/auth/refresh', { cookie: inactiveCookie });
  userState.isActive = true;
  check('a deactivated account is 401 ACCOUNT_INACTIVE',
    inactive.status === 401 && inactive.json?.code === 'ACCOUNT_INACTIVE',
    `got ${inactive.status} ${JSON.stringify(inactive.json)}`);
  check('...and does clear the cookie',
    inactive.cookies.some((c) => c.name === 'refreshToken' && !c.value),
    JSON.stringify(inactive.cookies.map((c) => c.raw)));

  // ============================================================= FIX 5
  console.log('\n--- 5. PATCH /users issues a whole session ---');

  const patched = await request('PATCH', '/users', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: USER_ID, username: 'renameduser', country: OTHER_COUNTRY_ID }),
  });

  check('the response carries an access token',
    patched.status === 200 && !!patched.json?.accessToken,
    `got ${patched.status} ${JSON.stringify(patched.json)}`);
  check('the response also carries a refresh token, like every other endpoint',
    !!patched.json?.refreshToken, JSON.stringify(patched.json));
  const patchedCookie = refreshCookieOf(patched);
  check('and sets the refresh cookie for web', !!patchedCookie);

  const usable = await jsonPost('/auth/refresh', { cookie: patchedCookie });
  check('that session is real - it refreshes',
    usable.status === 200 && !!usable.json?.accessToken,
    `got ${usable.status} ${JSON.stringify(usable.json)}`);

  const controllerSource = fs.readFileSync(path.join(__dirname, '..', 'controllers', 'usersController.js'), 'utf8');
  // Matches a call or an import, not the word in the comment explaining why
  // this endpoint no longer makes one.
  check('usersController no longer calls or imports generateTokens',
    !/generateTokens\s*[({]/.test(controllerSource));

  // ================================================================= done
  console.log(`\n${checks - failures}/${checks} checks passed`);
  server.close();
  Module._load = originalLoad;
  process.exit(failures === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error('Harness error:', error);
  server.close();
  process.exit(1);
});
