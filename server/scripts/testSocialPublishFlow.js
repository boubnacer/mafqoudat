/**
 * Offline check of the two Graph API publish paths themselves -
 * services/instagramService.js and services/facebookService.js.
 *
 *   node scripts/testSocialPublishFlow.js
 *
 * No database, no network and no waiting: axios is stubbed, the caption
 * builder is stubbed, and the Instagram service's polling intervals are
 * constructor options, so a five-minute readiness budget is exercised in
 * milliseconds.
 *
 * scripts/testSocialPublishQueue.js covers what happens *around* a publish -
 * pacing, windows, classification, retries. This covers the publish, which is
 * where the intermittent failures live:
 *
 *  - Instagram does not accept an image, it accepts a URL and goes to fetch
 *    it, and a container is not publishable until that finishes. The old
 *    twenty-second budget was simply too short for a multi-megabyte photo, so
 *    a listing "sometimes" did not arrive.
 *  - A trilingual, mostly-Arabic caption percent-encodes to several times its
 *    length, and putting it in a query string produced a URL long enough to
 *    be refused - by listing, depending on how long its city and category
 *    names happened to be.
 *  - Graph has no idempotency key, so a lost answer is indistinguishable from
 *    a refusal, and the retry is how the same listing reaches the account
 *    twice.
 *
 * Exits non-zero if any assertion failed.
 */

const Module = require('module');

let failures = 0;
let checks = 0;

const check = (label, actual, expected) => {
  checks += 1;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`ok    ${label}`);
    return;
  }
  failures += 1;
  console.error(`FAIL  ${label}\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`);
};

const checkThat = (label, condition, detail = '') => {
  checks += 1;
  if (condition) {
    console.log(`ok    ${label}${detail ? `  (${detail})` : ''}`);
    return;
  }
  failures += 1;
  console.error(`FAIL  ${label}${detail ? `\n        ${detail}` : ''}`);
};

const checkRejects = async (label, work, predicate) => {
  checks += 1;
  try {
    await work();
  } catch (error) {
    if (predicate(error)) {
      console.log(`ok    ${label}`);
      return;
    }
    failures += 1;
    console.error(`FAIL  ${label}\n        rejected with the wrong error: ${error.message}`);
    return;
  }
  failures += 1;
  console.error(`FAIL  ${label}\n        resolved instead of rejecting`);
};

// --------------------------------------------------------------------- stubs

const calls = { get: [], post: [] };

// path -> handler(params|body). A handler may be a function or a plain value;
// an array is consumed one entry per call, which is how a container is made to
// report IN_PROGRESS and then FINISHED.
let getHandlers = {};
let postHandlers = {};

const matchHandler = (handlers, url) => {
  const path = url.replace(/^https:\/\/graph\.facebook\.com\/v[\d.]+/, '');
  const key = Object.keys(handlers).find((candidate) => path === candidate || path.endsWith(candidate));
  return { path, handler: key ? handlers[key] : undefined };
};

const resolveHandler = (handler, ...args) => {
  const next = Array.isArray(handler) ? (handler.length > 1 ? handler.shift() : handler[0]) : handler;
  return typeof next === 'function' ? next(...args) : next;
};

const graphResponse = (data, headers = {}) => ({ status: 200, data, headers });

const graphReject = (code, message, extra = {}) => {
  const { status, headers, ...graph } = extra;
  const error = new Error(message);
  error.response = {
    status: status || 400,
    headers: headers || {},
    data: { error: { code, message, type: 'OAuthException', ...graph } },
  };
  throw error;
};

const axiosStub = {
  get: async (url, config = {}) => {
    const { path, handler } = matchHandler(getHandlers, url);
    calls.get.push({ path, params: config.params });
    if (handler === undefined) throw new Error(`Test stub: no GET handler for ${path}`);
    return resolveHandler(handler, config.params);
  },
  post: async (url, body, config = {}) => {
    const { path, handler } = matchHandler(postHandlers, url);
    const fields = Object.fromEntries(new URLSearchParams(body));
    calls.post.push({ path, body, fields, headers: config.headers, params: config.params });
    if (handler === undefined) throw new Error(`Test stub: no POST handler for ${path}`);
    return resolveHandler(handler, fields);
  },
};

// What the caption builder would have produced. Stubbed so these tests never
// touch the database - what goes *in* the caption is covered by
// test-social-images; what matters here is only that it carries the listing
// URL (which is what the duplicate check matches on) and that it is long.
let captionFor = (post) => `Lost item\n\nhttps://mafqoudat.com/dash/posts/${post._id}\n\n#مفقودات`;
let imageFor = () => ({ imageUrl: 'https://res.cloudinary.com/demo/social/post-p1.jpg', isPlaceholder: false });

const captionStub = {
  buildListingCaption: async (post, options = {}) => {
    const caption = captionFor(post);
    return options.maxLength && caption.length > options.maxLength
      ? caption.slice(0, options.maxLength)
      : caption;
  },
  resolveListingImage: async (post) => imageFor(post),
};

const originalLoad = Module._load;
Module._load = function load(request, parent) {
  const file = parent && parent.filename ? parent.filename : '';
  const isPublisher = file.endsWith('services/instagramService.js') || file.endsWith('services/facebookService.js');
  if (isPublisher && request === 'axios') return axiosStub;
  if (isPublisher && request === './socialCaption') return captionStub;
  // eslint-disable-next-line prefer-rest-params
  return originalLoad.apply(this, arguments);
};

process.env.FACEBOOK_PAGE_ID = 'page123';
process.env.FACEBOOK_PAGE_ACCESS_TOKEN = 'token-abc';
process.env.INSTAGRAM_ACCOUNT_ID = 'ig123';

const { InstagramService } = require('../services/instagramService');
const { FacebookService } = require('../services/facebookService');
const { isMediaContentError, isTransientError, isSpamBlockError } = require('../services/graphApi');

/** Intervals in milliseconds, so a 300s production budget runs instantly. */
const newInstagram = (overrides = {}) => new InstagramService({
  containerTimeoutMs: 200,
  pollFirstIntervalMs: 1,
  pollMaxIntervalMs: 2,
  publishRetryDelayMs: 1,
  ...overrides,
});

const reset = () => {
  calls.get = [];
  calls.post = [];
  getHandlers = {};
  postHandlers = {};
  captionFor = (post) => `Lost item\n\nhttps://mafqoudat.com/dash/posts/${post._id}\n\n#مفقودات`;
  imageFor = () => ({ imageUrl: 'https://res.cloudinary.com/demo/social/post-p1.jpg', isPlaceholder: false });
};

const post = { _id: 'p1' };

// ---------------------------------------------------------------------------

const run = async () => {
  console.log('\n--- the caption and the image URL travel in the request body ---');
  // A trilingual caption is up to 2,200 characters, most of them Arabic -
  // six bytes each once percent-encoded. As a query parameter that is a URL
  // of well over ten kilobytes, which gateways refuse outright; and it fails
  // by listing rather than always, which is exactly the shape of "it usually
  // works".

  reset();
  postHandlers = {
    '/ig123/media': graphResponse({ id: 'container-1' }),
    '/ig123/media_publish': graphResponse({ id: 'media-1' }),
  };
  getHandlers = {
    '/container-1': graphResponse({ status_code: 'FINISHED' }),
    '/media-1': graphResponse({ permalink: 'https://instagram.com/p/xyz' }),
  };

  const published = await newInstagram().postNewListing(post);
  check('the media id comes back', published.mediaId, 'media-1');
  check('and its permalink', published.permalink, 'https://instagram.com/p/xyz');

  const containerCall = calls.post.find((call) => call.path === '/ig123/media');
  check('the container call sends no query parameters at all', containerCall.params, undefined);
  check('the caption is in the body', containerCall.fields.caption.includes('/dash/posts/p1'), true);
  check('so is the image URL', containerCall.fields.image_url, 'https://res.cloudinary.com/demo/social/post-p1.jpg');
  check('so is the token', containerCall.fields.access_token, 'token-abc');
  check('form-encoded, as Graph expects', containerCall.headers['Content-Type'], 'application/x-www-form-urlencoded');

  reset();
  postHandlers = { '/page123/photos': graphResponse({ id: 'photo-1', post_id: 'page123_9' }) };
  getHandlers = { '/page123_9': graphResponse({ permalink_url: 'https://facebook.com/9' }) };

  const fbPublished = await new FacebookService().postNewListing(post);
  check('Facebook answers with the story id, not the photo id', fbPublished.postId, 'page123_9');
  const photoCall = calls.post.find((call) => call.path === '/page123/photos');
  check('and its caption travels in the body too', photoCall.fields.caption.includes('/dash/posts/p1'), true);
  check('with no query string', photoCall.params, undefined);

  console.log('\n--- a container that is not ready yet is waited for, not abandoned ---');
  // Meta fetches the photo from Cloudinary itself. The old budget was ten
  // polls two seconds apart; a large image on a slow fetch outlives that, and
  // the listing simply never arrived.

  reset();
  postHandlers = {
    '/ig123/media': graphResponse({ id: 'container-2' }),
    '/ig123/media_publish': graphResponse({ id: 'media-2' }),
  };
  getHandlers = {
    '/container-2': [
      graphResponse({ status_code: 'IN_PROGRESS' }),
      graphResponse({ status_code: 'IN_PROGRESS' }),
      graphResponse({ status_code: 'IN_PROGRESS' }),
      graphResponse({ status_code: 'FINISHED' }),
    ],
    '/media-2': graphResponse({ permalink: 'https://instagram.com/p/abc' }),
  };

  const slow = await newInstagram().postNewListing(post);
  check('it publishes once processing finishes', slow.mediaId, 'media-2');
  check('having polled until it did', calls.get.filter((call) => call.path === '/container-2').length, 4);
  check('asking for the reason alongside the code', calls.get[0].params.fields, 'status_code,status');

  console.log('\n--- a container that never finishes is a transient failure, not a bad file ---');

  reset();
  postHandlers = { '/ig123/media': graphResponse({ id: 'container-3' }) };
  getHandlers = { '/container-3': graphResponse({ status_code: 'IN_PROGRESS' }) };

  await checkRejects(
    'processing that outlives the budget rejects',
    () => newInstagram().postNewListing(post),
    (error) => isTransientError(error) && !isMediaContentError(error),
  );
  checkThat(
    'and it never published the container it could not confirm',
    calls.post.every((call) => call.path !== '/ig123/media_publish'),
  );

  console.log('\n--- a container Meta gave up on carries its own reason ---');

  reset();
  postHandlers = { '/ig123/media': graphResponse({ id: 'container-4' }) };
  getHandlers = {
    '/container-4': graphResponse({
      status_code: 'ERROR',
      status: 'Error: The media could not be created. (2207032)',
    }),
  };

  await checkRejects(
    'a retryable ERROR status is read as transient from its subcode',
    () => newInstagram().postNewListing(post),
    (error) => isTransientError(error) && error.message.includes('2207032'),
  );

  reset();
  postHandlers = { '/ig123/media': graphResponse({ id: 'container-5' }) };
  getHandlers = {
    '/container-5': graphResponse({
      status_code: 'ERROR',
      status: 'Only photo or video can be accepted as media type. (2207052)',
    }),
  };

  await checkRejects(
    'and a permanent one as a media problem, so the derivative is regenerated',
    () => newInstagram().postNewListing(post),
    (error) => isMediaContentError(error) && !isTransientError(error),
  );

  reset();
  postHandlers = { '/ig123/media': graphResponse({ id: 'container-5b' }) };
  getHandlers = {
    '/container-5b': graphResponse({ status_code: 'ERROR', status: 'Something went wrong' }),
  };

  await checkRejects(
    'an ERROR whose reason names no subcode is treated as a bad file, not a bad token',
    () => newInstagram().postNewListing(post),
    (error) => isMediaContentError(error),
  );

  reset();
  postHandlers = { '/ig123/media': graphResponse({ id: 'container-6' }) };
  getHandlers = { '/container-6': graphResponse({ status_code: 'EXPIRED' }) };

  await checkRejects(
    'an expired container is a media problem too - the old one is gone',
    () => newInstagram().postNewListing(post),
    (error) => isMediaContentError(error),
  );

  console.log('\n--- a lost answer never becomes a second post ---');
  // Graph has no idempotency key. A timeout says nothing about whether the
  // publish happened, and retrying blind is how a listing reaches the account
  // twice.

  reset();
  let publishAttempts = 0;
  postHandlers = {
    '/ig123/media': graphResponse({ id: 'container-7' }),
    '/ig123/media_publish': () => {
      publishAttempts += 1;
      const error = new Error('timeout of 45000ms exceeded');
      error.code = 'ECONNABORTED';
      throw error;
    },
  };
  getHandlers = {
    '/container-7': [
      graphResponse({ status_code: 'FINISHED' }),
      // The re-check after the lost answer: it did go through.
      graphResponse({ status_code: 'PUBLISHED' }),
    ],
    '/ig123/media': graphResponse({
      data: [{ id: 'media-7', caption: 'Lost item https://mafqoudat.com/dash/posts/p1', permalink: 'https://instagram.com/p/7' }],
    }),
  };

  const recovered = await newInstagram().postNewListing(post);
  check('the media the account already carries is returned', recovered.mediaId, 'media-7');
  check('with its permalink', recovered.permalink, 'https://instagram.com/p/7');
  check('and publish was attempted exactly once', publishAttempts, 1);

  console.log('\n--- Meta\'s known FINISHED-but-not-really race is retried ---');

  reset();
  let raceAttempts = 0;
  postHandlers = {
    '/ig123/media': graphResponse({ id: 'container-8' }),
    '/ig123/media_publish': () => {
      raceAttempts += 1;
      if (raceAttempts === 1) graphReject(9007, 'Media ID is not available', { error_subcode: 2207027 });
      return graphResponse({ id: 'media-8' });
    },
  };
  getHandlers = {
    '/container-8': [
      graphResponse({ status_code: 'FINISHED' }),
      // The duplicate re-check between the two publish attempts: still not live.
      graphResponse({ status_code: 'FINISHED' }),
    ],
    '/ig123/media': graphResponse({ data: [] }),
    '/media-8': graphResponse({ permalink: 'https://instagram.com/p/8' }),
  };

  const raced = await newInstagram().postNewListing(post);
  check('the second attempt succeeds', raced.mediaId, 'media-8');
  check('having checked in between that the first had not gone through', raceAttempts, 2);

  console.log('\n--- the account itself answers "is this listing already up?" ---');

  reset();
  getHandlers = {
    '/ig123/media': graphResponse({
      data: [
        { id: 'other', caption: 'https://mafqoudat.com/dash/posts/p9', permalink: 'https://instagram.com/p/other' },
        { id: 'mine', caption: 'https://mafqoudat.com/dash/posts/p1', permalink: 'https://instagram.com/p/mine' },
      ],
    }),
  };
  check(
    'the listing is matched by its own URL, not by position',
    await newInstagram().findPublishedListing(post),
    { mediaId: 'mine', permalink: 'https://instagram.com/p/mine' },
  );

  reset();
  getHandlers = { '/ig123/media': graphResponse({ data: [{ id: 'other', caption: 'unrelated' }] }) };
  check('a listing that is not there answers null', await newInstagram().findPublishedListing(post), null);

  reset();
  getHandlers = { '/ig123/media': () => graphReject(4, 'Application request limit reached') };
  check(
    'and a lookup that fails answers null rather than blocking the publish',
    await newInstagram().findPublishedListing(post),
    null,
  );

  console.log('\n--- Facebook looks in the feed, then in the uploads ---');
  // A photo published through /photos surfaces as a Page story whose message
  // is the caption, but it is not guaranteed to be in /feed; /photos indexes
  // the same upload under `name`, and page_story_id is the id engagement
  // lives on.

  reset();
  getHandlers = {
    '/page123/feed': graphResponse({
      data: [{ id: 'page123_5', message: 'see https://mafqoudat.com/dash/posts/p1', permalink_url: 'https://facebook.com/5' }],
    }),
  };
  check(
    'the Page story is found by the listing URL in its message',
    await new FacebookService().findPublishedListing(post),
    { postId: 'page123_5', permalink: 'https://facebook.com/5' },
  );

  reset();
  getHandlers = {
    '/page123/feed': graphResponse({ data: [] }),
    '/page123/photos': graphResponse({
      data: [{ id: 'photo-9', name: 'see https://mafqoudat.com/dash/posts/p1', page_story_id: 'page123_9' }],
    }),
    '/page123_9': graphResponse({ permalink_url: 'https://facebook.com/9' }),
  };
  check(
    'and falls back to the uploaded photos, resolving the story id',
    await new FacebookService().findPublishedListing(post),
    { postId: 'page123_9', permalink: 'https://facebook.com/9' },
  );

  console.log('\n--- the call budget Meta reports is carried back to the queue ---');

  reset();
  postHandlers = {
    '/ig123/media': graphResponse({ id: 'container-9' }),
    '/ig123/media_publish': graphResponse({ id: 'media-9' }, {
      'x-app-usage': JSON.stringify({ call_count: 12, total_cputime: 3, total_time: 91 }),
      'x-business-use-case-usage': JSON.stringify({
        biz: [{ type: 'instagram', call_count: 40, total_cputime: 1, total_time: 2, estimated_time_to_regain_access: 0 }],
      }),
    }),
  };
  getHandlers = {
    '/container-9': graphResponse({ status_code: 'FINISHED' }),
    '/media-9': graphResponse({ permalink: 'https://instagram.com/p/9' }),
  };

  const withUsage = await newInstagram().postNewListing(post);
  check('the highest of every reported ceiling is what comes back', withUsage.usage.percent, 91);

  console.log('\n--- the account\'s own publishing quota is read and cached ---');

  reset();
  getHandlers = {
    '/ig123/content_publishing_limit': graphResponse({
      data: [{ quota_usage: 7, config: { quota_total: 25, quota_duration: 86400 } }],
    }),
  };

  const instagram = newInstagram();
  const quota = await instagram.publishingQuota();
  check('the quota is read', { used: quota.used, total: quota.total, windowSeconds: quota.windowSeconds }, {
    used: 7, total: 25, windowSeconds: 86400,
  });

  await instagram.publishingQuota();
  check('and not re-read on the next publish decision', calls.get.filter((call) => call.path === '/ig123/content_publishing_limit').length, 1);

  instagram.invalidateQuota();
  await instagram.publishingQuota();
  check('until a publish spends a slot', calls.get.filter((call) => call.path === '/ig123/content_publishing_limit').length, 2);

  reset();
  getHandlers = { '/ig123/content_publishing_limit': () => graphReject(10, 'Permission denied') };
  check('a quota that cannot be read answers null rather than throwing', await newInstagram().publishingQuota(), null);

  console.log('\n--- a spam block is recognised as itself ---');

  reset();
  postHandlers = { '/ig123/media': () => graphReject(9004, 'The publishing action is suspected to be spam.', { error_subcode: 2207051 }) };
  await checkRejects(
    'and not as a refused image, which would throw away a perfectly good one',
    () => newInstagram().postNewListing(post),
    (error) => isSpamBlockError(error) && !isMediaContentError(error),
  );
};

run()
  .then(() => {
    Module._load = originalLoad;
    console.log(`\n${checks - failures}/${checks} checks passed`);
    if (failures > 0) {
      console.error(`${failures} check(s) failed`);
      process.exit(1);
    }
  })
  .catch((error) => {
    Module._load = originalLoad;
    console.error('Test run crashed:', error);
    process.exit(1);
  });
