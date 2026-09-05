/**
 * Offline check of the input-handling rework: schema limits + route validation
 * in, global truncation and character-stripping out.
 *
 *   node scripts/testInputValidation.js
 *
 * No database, no network. models/Post and models/City are stubbed for the
 * ogRoutes block (the only dependency this cannot reach offline); everything
 * else - the real routes/ogRoutes.js renderer, the real
 * middleware/validation.js rules, the real mongoose schemas - runs as shipped.
 *
 * What each block reproduces before asserting the fix:
 *   1. a post description containing "</script>" rendered into the JSON-LD
 *      block on the crawler page. Nothing escaped it there; a global
 *      middleware stripping "<" on the way in was the only thing standing
 *      between that and a script tag on a page we serve, and it never even ran
 *      on request bodies (it is mounted ahead of express.json()).
 *   2. an over-long description reaching the database. There were no maxlength
 *      validators at all - the same middleware cut every string at 1000
 *      characters, so the post saved fine and came back shorter than it went
 *      in, with nothing said to the author.
 *   3. that same over-long description now answered with a 400 naming the
 *      field, on create, on update (which validated nothing but the id), and
 *      on a comment.
 *   4. sanitizeInput itself: still trims, no longer truncates or rewrites.
 *
 * Exits non-zero if any assertion failed.
 */

const Module = require('module');

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

// ------------------------------------------------------------- model stubs
const POST_ID = '507f1f77bcf86cd799439011';

// The payload under test: a description that closes the script tag it is
// rendered inside and opens a new one.
const HOSTILE = '</script><script>alert(1)</script>';

const makeQuery = (value) => {
  const q = {
    select: () => q,
    populate: () => q,
    sort: () => q,
    limit: () => q,
    lean: () => q,
    exec: async () => value,
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  };
  return q;
};

const stubPost = {
  _id: POST_ID,
  status: 'active',
  returned: false,
  description: `A lost blue backpack. ${HOSTILE}`,
  exactLocation: 'Near the clock tower',
  mainDate: '12 mars 2024',
  contact: '+212600000000',
  createdAt: new Date('2024-03-12T10:00:00Z'),
  categories: [{ code: 'ELECTRONICS', labels: { ar: 'إلكترونيات' } }],
  foundLost: { code: 'LOST' },
  country: { _id: '507f1f77bcf86cd799439012', code: 'MA', names: { ar: 'المغرب' } },
  city: { code: 'CASABLANCA', labels: { ar: 'الدار البيضاء' } },
  cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/x.jpg',
};

const PostStub = {
  findById: () => makeQuery(stubPost),
  find: () => makeQuery([]),
  countDocuments: () => makeQuery(0),
};
const CityStub = { find: () => makeQuery([]) };

const originalLoad = Module._load;
Module._load = function (request, parent) {
  const fromOg = parent && parent.filename && parent.filename.endsWith('routes/ogRoutes.js');
  if (fromOg && request === '../models/Post') return PostStub;
  if (fromOg && request === '../models/City') return CityStub;
  return originalLoad.apply(this, arguments);
};

const express = require('express');
const mongoose = require('mongoose');
const { FIELD_LIMITS } = require('../config/fieldLimits');
const {
  sanitizeInput,
  validateRequest,
  validationSets,
  commonValidations,
} = require('../middleware/validation');

// --------------------------------------------------------------- harness
const app = express();
app.use(express.json());
app.use(sanitizeInput);
app.use('/', require('../routes/ogRoutes'));

// The validation chains as postRoutes.js wires them, without the auth, upload
// and cache layers around them - those are not what is under test here.
const accept = (req, res) => res.status(200).json({ ok: true });
app.post('/validate/posts', validationSets.postCreation, validateRequest, accept);
app.patch('/validate/posts', validationSets.postUpdate, validateRequest, accept);
app.post('/validate/comments', validationSets.commentCreation, validateRequest, accept);
app.get('/validate/search', commonValidations.searchQuery(), validateRequest, accept);
app.post('/echo', (req, res) => res.json(req.body));

const server = app.listen(0, '127.0.0.1');
const listening = new Promise((resolve) => server.once('listening', resolve));
const baseUrl = () => `http://127.0.0.1:${server.address().port}`;

const request = async (method, path, body) => {
  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (error) {
    /* HTML response */
  }
  return { status: response.status, text, json };
};

const validPost = (overrides = {}) => ({
  user: POST_ID,
  country: '507f1f77bcf86cd799439012',
  categories: ['507f1f77bcf86cd799439013'],
  foundLost: '507f1f77bcf86cd799439014',
  contact: '+212600000000',
  exactLocation: 'Near the clock tower',
  ...overrides,
});

const fieldErrors = (result) =>
  ((result.json && result.json.error && result.json.error.fields) || [])
    .map((entry) => entry.message)
    .join(' | ');

const run = async () => {
  await listening;

  // ------------------------------------------------------- 1. JSON-LD escaping
  const page = await request('GET', `/og/posts/${POST_ID}`);
  check('og post page renders', page.status === 200, `status ${page.status}`);

  const blocks = [...page.text.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  )].map((match) => match[1]);
  check('og page carries its JSON-LD blocks', blocks.length === 2, `found ${blocks.length}`);

  // The decisive one: the hostile description must not have closed the tag it
  // was rendered inside. If it had, the regex above would have stopped at the
  // injected </script> and this block would not parse as JSON.
  const parsed = blocks.map((block) => {
    try {
      return JSON.parse(block);
    } catch (error) {
      return null;
    }
  });
  check('every JSON-LD block is intact JSON', parsed.every(Boolean));
  check(
    'no raw "<" survives inside a JSON-LD block',
    blocks.every((block) => !block.includes('<')),
    blocks.find((block) => block.includes('<'))
  );
  check(
    'the escaped form is what was written',
    blocks.some((block) => block.includes('\\u003C')),
  );
  check(
    'no script tag was opened by the payload',
    (page.text.match(/<script/g) || []).length === 2,
    `${(page.text.match(/<script/g) || []).length} script tags`
  );

  // Escaping, not stripping: a crawler still reads the description as written.
  const webPage = parsed.find((entry) => entry && entry['@type'] === 'WebPage');
  check(
    'the description reaches a JSON parser unchanged',
    !!webPage && String(webPage.about.description).includes(HOSTILE),
    webPage && webPage.about && webPage.about.description
  );

  // ------------------------------------------------------- 2. schema backstop
  const Post = require('../models/Post');
  const Comment = require('../models/Comment');

  const newPost = (description) => new Post({
    user: new mongoose.Types.ObjectId(),
    country: new mongoose.Types.ObjectId(),
    categories: [new mongoose.Types.ObjectId()],
    foundLost: new mongoose.Types.ObjectId(),
    contact: '+212600000000',
    exactLocation: 'Near the clock tower',
    description,
  });

  const overLimit = 'd'.repeat(FIELD_LIMITS.post.description + 1);
  let schemaError = null;
  try {
    await newPost(overLimit).validate();
  } catch (error) {
    schemaError = error;
  }
  check(
    'Post rejects a description past the limit',
    !!schemaError && !!schemaError.errors.description,
    schemaError ? '' : 'validated with no error'
  );

  let atLimitOk = true;
  try {
    await newPost('d'.repeat(FIELD_LIMITS.post.description)).validate();
  } catch (error) {
    atLimitOk = false;
  }
  check('Post accepts a description exactly at the limit', atLimitOk);

  let commentError = null;
  try {
    await new Comment({
      post: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      text: 'c'.repeat(FIELD_LIMITS.comment.text + 1),
    }).validate();
  } catch (error) {
    commentError = error;
  }
  check('Comment rejects text past the limit', !!commentError && !!commentError.errors.text);

  // --------------------------------------------------------- 3. route rules
  const created = await request('POST', '/validate/posts', validPost({ description: overLimit }));
  check(
    'POST /posts answers 400 for an over-long description',
    created.status === 400,
    `status ${created.status}`
  );
  check(
    'the 400 says which field and why',
    /Description must be less than/.test(fieldErrors(created)),
    fieldErrors(created)
  );

  const createdOk = await request('POST', '/validate/posts', validPost({ description: 'A blue backpack.' }));
  check('POST /posts still accepts a normal listing', createdOk.status === 200, createdOk.text);

  // The same payload the mobile and web clients actually send: everything in a
  // JSON string under postData.
  const asFormData = await request('POST', '/validate/posts', {
    postData: JSON.stringify(validPost({ description: overLimit })),
  });
  check(
    'the postData (FormData) shape is validated too',
    asFormData.status === 400,
    `status ${asFormData.status}`
  );

  const updated = await request('PATCH', '/validate/posts', {
    postData: JSON.stringify({ id: POST_ID, description: overLimit }),
  });
  check(
    'PATCH /posts answers 400 for an over-long description',
    updated.status === 400,
    `status ${updated.status}`
  );

  const updatedOk = await request('PATCH', '/validate/posts', {
    postData: JSON.stringify({ id: POST_ID, description: 'Still a blue backpack.' }),
  });
  check('PATCH /posts still accepts a normal edit', updatedOk.status === 200, updatedOk.text);

  const comment = await request('POST', '/validate/comments', {
    text: 'c'.repeat(FIELD_LIMITS.comment.text + 1),
  });
  check(
    'POST a comment answers 400 past the limit',
    comment.status === 400,
    `status ${comment.status}`
  );

  // Ordinary text that the old `<>` rule on textContent would have refused
  // once the stripping middleware stopped hiding it from that rule.
  const angled = await request('POST', '/validate/comments', {
    text: 'I saw it at 8 < the clock tower, a > b',
  });
  check('a comment containing < or > is accepted', angled.status === 200, angled.text);

  const longSearch = await request('GET', `/validate/search?search=${'s'.repeat(FIELD_LIMITS.query.search + 1)}`);
  check('an unbounded search term is refused', longSearch.status === 400, `status ${longSearch.status}`);

  // -------------------------------------------------------- 4. sanitizeInput
  const longText = 'x'.repeat(3000);
  const echoed = await request('POST', '/echo', {
    description: `  ${longText}  `,
    markup: 'price < 100 & a > b',
    protocol: 'javascript:void(0)',
    handler: 'onclick=doThing()',
    nested: { list: ['  keep me  '] },
  });
  check(
    'a 3000-character field is no longer truncated',
    echoed.json.description.length === 3000,
    `length ${echoed.json.description.length}`
  );
  check('"<" and ">" survive', echoed.json.markup === 'price < 100 & a > b', echoed.json.markup);
  check('"javascript:" survives', echoed.json.protocol === 'javascript:void(0)', echoed.json.protocol);
  check('an "on...=" string survives', echoed.json.handler === 'onclick=doThing()', echoed.json.handler);
  check('strings are still trimmed', echoed.json.nested.list[0] === 'keep me', echoed.json.nested.list[0]);

  server.close();
  console.log(`\n${checks - failures}/${checks} checks passed`);
  process.exit(failures ? 1 : 0);
};

run().catch((error) => {
  console.error(error);
  server.close();
  process.exit(1);
});
