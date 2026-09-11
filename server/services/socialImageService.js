const axios = require('axios');
const { cloudinary } = require('../config/cloudinary');
const Post = require('../models/Post');
const { watermarkImageBuffer, isAvailable: watermarkAvailable } = require('./imageWatermark');

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

async function generate(post, sourceUrl) {
  const buffer = await downloadImage(sourceUrl);
  const watermarked = await watermarkImageBuffer(buffer);
  const publicId = socialPublicId(post._id);
  const result = await uploadWatermarked(watermarked, publicId);

  const socialImage = {
    url: result.secure_url,
    publicId: result.public_id,
    // What it was made from. A listing whose photo is replaced before its
    // turn in the queue would otherwise publish the mark of the old one.
    sourceUrl,
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

module.exports = { ensureSocialImage, deleteSocialImage, socialPublicId, SOCIAL_IMAGE_FOLDER };
