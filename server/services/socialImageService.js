const axios = require('axios');
const { cloudinary } = require('../config/cloudinary');
const Post = require('../models/Post');
const { buildSocialImage, verifyPublishable, isAvailable: watermarkAvailable } = require('./imageWatermark');

/**
 * The watermarked copy of a listing photo that Facebook and Instagram are
 * pointed at, and only them.
 *
 * Meta fetches the picture itself, from a URL - there is no way to hand it
 * bytes - so a watermarked copy has to exist somewhere public before a
 * listing can be published with one. That is all this file does: read the
 * photo the site already serves, stamp it, put the result back in Cloudinary
 * under its own id, and record it on the post.
 *
 * Two things it deliberately does not do:
 *
 *  - It does not touch the listing's own image. `cloudinaryUrl` is what the
 *    site, the app and the OG crawler render, and a watermark there would sit
 *    between a reader and the object they are trying to identify. The mark is
 *    for the copy that has left the site.
 *
 *  - It does not run when the post is created. Post creation has never waited
 *    on social publishing and still does not: this is called from the publish
 *    path, which is already queued, paced at one post per platform every
 *    SOCIAL_QUEUE_MIN_INTERVAL_SECONDS, and retried. Doing it at upload would
 *    put a download, a composite and a second Cloudinary upload in front of
 *    the author's own request for no benefit they can see, and would leave
 *    every listing created before this change publishing unmarked forever.
 *    Here, an older listing gets its mark the first time it is published.
 */

const SOCIAL_IMAGE_FOLDER = 'mafqoudat/social';

// The site's own delivery URL is capped at 1920x1080 by the upload path, so
// this is headroom rather than a limit anyone should reach. A photo that
// somehow exceeds it is published unmarked rather than holding the queue.
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 15000;

// The verification re-download never needs to read more than Instagram's own
// cap - a response bigger than that fails the check anyway.
const MAX_BYTES_TO_VERIFY = 8 * 1024 * 1024;

// Both platform jobs for one listing can be claimed in the same tick, and
// each would otherwise generate the same derivative independently. The
// deterministic public_id below makes that harmless rather than duplicated,
// but there is no reason to pay for it twice.
const inFlight = new Map();

const isConfigured = () => !!(
  process.env.CLOUDINARY_CLOUD_NAME
  && process.env.CLOUDINARY_API_KEY
  && process.env.CLOUDINARY_API_SECRET
);

/** One id per listing, so a regenerated mark replaces its predecessor. */
const socialPublicId = (postId) => `${SOCIAL_IMAGE_FOLDER}/post-${postId}`;

async function downloadImage(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: DOWNLOAD_TIMEOUT_MS,
    maxContentLength: MAX_SOURCE_BYTES,
    maxBodyLength: MAX_SOURCE_BYTES,
  });
  return Buffer.from(response.data);
}

function uploadWatermarked(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'image',
        format: 'jpg',
        overwrite: true,
        invalidate: true,
        // No transformation, and no `quality: auto`: the watermark is thin,
        // light-toned strokes over a photograph, which is the first thing a
        // re-encode smears. It has already been written at the size and
        // quality it is meant to be published at.
        transformation: [],
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(buffer);
  });
}

/**
 * Removes a listing's watermarked social copy. Best-effort, like the site
 * image's own cleanup - a storage hiccup must never fail a delete.
 */
async function deleteSocialImage(post) {
  const publicId = post?.socialImage?.publicId;
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn(`Social watermark cleanup failed for ${publicId}: ${error.message}`);
  }
}

/**
 * Clears a listing's cached derivative on the post document without deleting
 * the Cloudinary asset - called when a platform refuses the image itself
 * (Instagram's "wrong media type" among them), so the next publish attempt
 * regenerates rather than replaying the exact file that was just refused.
 *
 * `ensureSocialImage` only ever reuses a cached image, never re-validates
 * one - by design, so a listing that has already published once is not
 * re-downloaded and re-uploaded on every later retry. That means a bad
 * derivative, once cached, would otherwise be served to every future publish
 * and retry of this post forever, on every platform, since the cache has no
 * way to know it was ever rejected. This is the way out of that: it does not
 * delete the Cloudinary object (nothing else pointed at it may still be
 * using it, e.g. Facebook's already-published copy), it just stops treating
 * the cache entry as good.
 */
async function invalidateSocialImage(postId) {
  if (!postId) return;
  try {
    await Post.updateOne({ _id: postId }, { $unset: { socialImage: '' } });
  } catch (error) {
    console.warn(`Could not invalidate the cached social image for post ${postId}: ${error.message}`);
  }
}

/**
 * Confirms the URL Meta will actually be given serves back what was just
 * uploaded, rather than trusting Cloudinary's own response. Answers the
 * decoded buffer on success so the caller does not fetch it a third time.
 *
 * Not paranoia for its own sake: this is the one step in the pipeline this
 * file does not fully control (a Cloudinary account setting, a stale cache
 * entry, a delivery quirk), and it is the difference between a listing
 * failing loudly here - where the fix is to regenerate - and failing silently
 * at Meta with a "wrong media type" error that gives no reason why.
 */
async function verifyUpload(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: DOWNLOAD_TIMEOUT_MS,
    maxContentLength: MAX_BYTES_TO_VERIFY,
    maxBodyLength: MAX_BYTES_TO_VERIFY,
  });
  const buffer = Buffer.from(response.data);
  await verifyPublishable(buffer);
  return buffer;
}

async function generate(post, sourceUrl) {
  const buffer = await downloadImage(sourceUrl);

  // The watermark overlay is the one step here that touches an asset outside
  // Cloudinary and outside this pipeline's own control - a corrupt or missing
  // `assets/domainWordmark.svg` throws inside `buildSocialImage`. That should
  // cost a listing its mark, not its publish: everything else in the
  // function (format, geometry, size) is what actually determines whether
  // Instagram accepts the file, and is worth keeping regardless.
  let watermarked;
  let marked = true;
  try {
    watermarked = await buildSocialImage(buffer);
  } catch (error) {
    console.warn(`Social watermark overlay failed for post ${post._id}, publishing unmarked instead: ${error.message}`);
    watermarked = await buildSocialImage(buffer, { watermark: false });
    marked = false;
  }

  const publicId = socialPublicId(post._id);
  const result = await uploadWatermarked(watermarked, publicId);

  // Read back what Meta will actually be given. A mismatch here means the
  // bytes this function built are not what is being served, which is
  // information worth having in the logs the moment it happens rather than
  // guessed at from a Graph refusal with no diagnostic content of its own.
  try {
    await verifyUpload(result.secure_url);
  } catch (error) {
    console.error(
      `Social image verification failed for post ${post._id} at ${result.secure_url}: ${error.message}. `
      + 'Not caching this URL - the plain photo will be published instead until this is resolved.',
    );
    throw error;
  }

  const socialImage = {
    url: result.secure_url,
    publicId: result.public_id,
    // What it was made from. A listing whose photo is replaced before its
    // turn in the queue would otherwise publish the mark of the old one.
    sourceUrl,
    watermarked: marked,
    createdAt: new Date(),
  };

  await Post.updateOne({ _id: post._id }, { $set: { socialImage } });

  return socialImage.url;
}

/**
 * The URL of this listing's watermarked copy, generating it if there isn't
 * one yet. Resolves to null whenever a mark cannot be produced - no photo,
 * no Sharp, no Cloudinary credentials, a download that failed - and the
 * caller publishes the plain photo instead. An unmarked listing on the Page
 * is a smaller loss than a listing that never reaches it.
 */
async function ensureSocialImage(post) {
  const sourceUrl = post?.cloudinaryUrl || post?.image;
  if (!post?._id || !sourceUrl) return null;

  const existing = post.socialImage;
  if (existing?.url && existing.sourceUrl === sourceUrl) return existing.url;

  if (!watermarkAvailable() || !isConfigured()) return null;

  const key = String(post._id);
  if (inFlight.has(key)) return inFlight.get(key);

  const work = generate(post, sourceUrl)
    .catch((error) => {
      console.warn(`Social watermark failed for post ${key}: ${error.message}`);
      return null;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, work);
  return work;
}

module.exports = {
  ensureSocialImage,
  deleteSocialImage,
  invalidateSocialImage,
  socialPublicId,
  SOCIAL_IMAGE_FOLDER,
};
