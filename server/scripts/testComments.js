/**
 * Offline check of the merged comment thread.
 *
 *   node scripts/testComments.js
 *
 * Needs no database and no network - exercises the pure shaping and merging
 * functions from controllers/commentsController.js directly.
 *
 * What actually matters here: the two sources interleave by time rather than
 * one being stapled after the other, and the per-viewer permission flags are
 * right. Those flags decide who can delete someone else's words, so getting
 * them wrong is either a moderation hole or a broken thread - and neither
 * shows up as an error, just as wrong buttons.
 *
 * Exits non-zero if any assertion failed.
 */

const {
  toSiteEntry,
  toSocialEntry,
  mergeCommentSources,
} = require('../controllers/commentsController');

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

const AUTHOR = 'aaaaaaaaaaaaaaaaaaaaaaa1';
const POST_OWNER = 'bbbbbbbbbbbbbbbbbbbbbbb2';
const STRANGER = 'ccccccccccccccccccccccc3';

const siteComment = (id, { user = AUTHOR, text = 'hello', createdAt = new Date() } = {}) => ({
  _id: id,
  user,
  username: 'someone',
  text,
  createdAt,
});

const socialComment = (commentId, { text = 'from facebook', createdAt = new Date(), authorName = 'Sara M.' } = {}) => ({
  commentId,
  authorName,
  text,
  createdAt,
});

const viewer = (viewerId, isAdmin = false) => ({ viewerId, isAdmin, postOwnerId: POST_OWNER });

const run = () => {
  console.log('\n--- who can delete a site comment ---');

  const asAuthor = toSiteEntry(siteComment('c1'), viewer(AUTHOR));
  checkThat('its own author can delete it', asAuthor.canDelete);
  checkThat('and is marked as the author', asAuthor.isAuthor);
  checkThat('but cannot report their own comment', !asAuthor.canReport);

  const asOwner = toSiteEntry(siteComment('c1'), viewer(POST_OWNER));
  checkThat("the listing's owner can delete a comment on their post", asOwner.canDelete);
  checkThat('and is not marked as its author', !asOwner.isAuthor);
  checkThat('and can report it', asOwner.canReport);

  const asStranger = toSiteEntry(siteComment('c1'), viewer(STRANGER));
  checkThat('an unrelated signed-in user cannot delete it', !asStranger.canDelete);
  checkThat('but can report it', asStranger.canReport);

  const asAdmin = toSiteEntry(siteComment('c1'), viewer(STRANGER, true));
  checkThat('an admin can delete anything', asAdmin.canDelete);

  const asGuest = toSiteEntry(siteComment('c1'), viewer(null));
  checkThat('a signed-out reader can neither delete', !asGuest.canDelete);
  checkThat('nor report', !asGuest.canReport);
  checkThat('nor is mistaken for the author', !asGuest.isAuthor);

  // -------------------------------------------------------------------------
  console.log('\n--- a Facebook/Instagram comment is read-only, for everyone ---');

  const fbEntry = toSocialEntry(socialComment('fb1'), 'facebook');
  check('tagged with its source', fbEntry.source, 'facebook');
  checkThat('never deletable - we have no authority over that platform', !fbEntry.canDelete);
  checkThat('never reportable to us for the same reason', !fbEntry.canReport);
  checkThat('never attributed to the viewer', !fbEntry.isAuthor);
  check('has no site user id to link to', fbEntry.author.id, null);
  check("carries the commenter's name", fbEntry.author.username, 'Sara M.');
  check('and its id is namespaced so it cannot collide with a site comment id',
    fbEntry.id, 'facebook:fb1');

  const anonymous = toSocialEntry(socialComment('fb2', { authorName: null }), 'facebook');
  check('an unattributed comment still renders, with a null name', anonymous.author.username, null);

  const igEntry = toSocialEntry(socialComment('ig1'), 'instagram');
  check('Instagram comments are tagged separately from Facebook ones', igEntry.source, 'instagram');

  // -------------------------------------------------------------------------
  console.log('\n--- the merged thread ---');

  const t = (minutesAgo) => new Date(Date.now() - minutesAgo * 60 * 1000);

  const merged = mergeCommentSources({
    siteEntries: [
      toSiteEntry(siteComment('c-old', { text: 'site, oldest', createdAt: t(50) }), viewer(STRANGER)),
      toSiteEntry(siteComment('c-new', { text: 'site, newest', createdAt: t(5) }), viewer(STRANGER)),
    ],
    facebook: [socialComment('fb1', { text: 'facebook, middle', createdAt: t(20) })],
    instagram: [socialComment('ig1', { text: 'instagram, second oldest', createdAt: t(40) })],
  });

  check('every source ends up in one list', merged.length, 4);
  check('interleaved strictly newest-first, not grouped by platform',
    merged.map((entry) => entry.text),
    ['site, newest', 'facebook, middle', 'instagram, second oldest', 'site, oldest']);
  check('and each entry still says where it came from',
    merged.map((entry) => entry.source),
    ['site', 'facebook', 'instagram', 'site']);

  const withUndated = mergeCommentSources({
    siteEntries: [toSiteEntry(siteComment('c1', { text: 'dated', createdAt: t(10) }), viewer(null))],
    facebook: [socialComment('fb1', { text: 'undated', createdAt: null })],
  });
  check('a social comment with no usable timestamp sorts last, not first',
    withUndated.map((entry) => entry.text), ['dated', 'undated']);

  const siteOnly = mergeCommentSources({
    siteEntries: [toSiteEntry(siteComment('c1'), viewer(null))],
  });
  check('a post with no social comments at all still returns its own thread', siteOnly.length, 1);

  check('an empty everything is an empty thread, not a crash',
    mergeCommentSources({ siteEntries: [] }).length, 0);
};

run();

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
