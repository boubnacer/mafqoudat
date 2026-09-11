/**
 * Offline check of the watermark that goes on the copy of a listing photo
 * published to the Facebook Page and the Instagram account.
 *
 *   node scripts/testSocialWatermark.js
 *
 * No database, no network: the images are generated here, and axios, the
 * Cloudinary uploader and models/Post are stubbed for socialImageService.js.
 *
 * Two things are worth checking and easy to get wrong. The mark has to be
 * legible - a domain name nobody can read is the whole feature failing
 * silently - so the overlay is measured against a white ground and a black
 * one, which is where a single flat tone disappears. And a listing must still
 * reach the Page when the mark cannot be made: every failure below has to
 * answer null, not throw.
 *
 * Exits non-zero if any assertion failed.
 */

const Module = require('module');
const sharp = require('sharp');

let failures = 0;
let checks = 0;

const check = (label, actual, expected) => {
  checks += 1;
  if (actual === expected) {
    console.log(`ok    ${label}`);
    return;
  }
  failures += 1;
  console.error(`FAIL  ${label}\n        expected ${expected}\n        actual   ${actual}`);
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

// ------------------------------------------------------------------ stubs
const uploads = [];
const destroyed = [];
let uploadResult = () => ({
  secure_url: 'https://res.cloudinary.com/demo/image/upload/mafqoudat/social/post-p1.jpg',
  public_id: 'mafqoudat/social/post-p1',
});

const cloudinaryStub = {
  cloudinary: {
    uploader: {
      upload_stream(options, callback) {
        const chunks = [];
        return {
          end(buffer) {
            chunks.push(buffer);
            uploads.push({ options, bytes: Buffer.concat(chunks).length });
            let answer;
            try {
              answer = uploadResult(options);
            } catch (error) {
              callback(error);
              return;
            }
            callback(null, answer);
          },
        };
      },
      destroy: async (publicId) => {
        destroyed.push(publicId);
        return { result: 'ok' };
      },
    },
  },
};

let downloads = 0;
let download = async () => ({ data: await solidImage(600, 400, '#ffffff') });
const axiosStub = { get: (...args) => { downloads += 1; return download(...args); } };

const updates = [];
const PostStub = { updateOne: async (filter, update) => { updates.push({ filter, update }); return { acknowledged: true }; } };

const originalLoad = Module._load;
Module._load = function load(request, parent) {
  const fromService = parent && parent.filename && parent.filename.endsWith('services/socialImageService.js');
  if (fromService && request === '../config/cloudinary') return cloudinaryStub;
  if (fromService && request === '../models/Post') return PostStub;
  if (fromService && request === 'axios') return axiosStub;
  // eslint-disable-next-line prefer-rest-params
  return originalLoad.apply(this, arguments);
};

process.env.CLOUDINARY_CLOUD_NAME = 'demo';
process.env.CLOUDINARY_API_KEY = 'key';
process.env.CLOUDINARY_API_SECRET = 'secret';

const { buildSocialImage, buildOverlaySvg, resolveFrame, LIMITS } = require('../services/imageWatermark');
const { ensureSocialImage, deleteSocialImage, socialPublicId } = require('../services/socialImageService');

// ------------------------------------------------------------- test images
function solidImage(width, height, color) {
  return sharp({ create: { width, height, channels: 3, background: color } }).jpeg().toBuffer();
}

/** Mean per-pixel difference between two same-sized images, 0-255. */
async function meanDifference(a, b) {
  const [rawA, rawB] = await Promise.all([
    sharp(a).greyscale().raw().toBuffer(),
    sharp(b).greyscale().raw().toBuffer(),
  ]);
  let total = 0;
  for (let i = 0; i < rawA.length; i += 1) total += Math.abs(rawA[i] - rawB[i]);
  return total / rawA.length;
}

/** How far the marked pixels depart from the ground, 0-255. */
async function peakDifference(a, b) {
  const [rawA, rawB] = await Promise.all([
    sharp(a).greyscale().raw().toBuffer(),
    sharp(b).greyscale().raw().toBuffer(),
  ]);
  let peak = 0;
  for (let i = 0; i < rawA.length; i += 1) {
    const delta = Math.abs(rawA[i] - rawB[i]);
    if (delta > peak) peak = delta;
  }
  return peak;
}

async function run() {
  console.log('\n-- the overlay --');
  const svg = buildOverlaySvg(1200, 900);
  checkThat('the mark is tiled as an SVG pattern, not one bitmap scaled up', svg.includes('<pattern'));
  checkThat('the tiling runs diagonally', /patternTransform="rotate\(-30\)"/.test(svg));
  checkThat('a pale face and a darker one under it', svg.includes('#ffffff') && svg.includes('#000000'));

  const wide = buildOverlaySvg(2000, 1000);
  const narrow = buildOverlaySvg(500, 1000);
  const tileWidth = (source) => Number(source.match(/<pattern id="wm" width="([\d.]+)"/)[1]);
  checkThat(
    'the mark scales with the image',
    tileWidth(wide) > tileWidth(narrow),
    `${tileWidth(wide)} vs ${tileWidth(narrow)}`,
  );

  const tiny = buildOverlaySvg(200, 200);
  checkThat(
    'but never below the width the domain stops being readable at',
    tileWidth(tiny) > 200 * 0.34,
    `${tileWidth(tiny)} on a 200px image`,
  );

  console.log('\n-- what it does to a photo --');
  const white = await solidImage(900, 700, '#ffffff');
  const black = await solidImage(900, 700, '#000000');
  const markedWhite = await buildSocialImage(white);
  const markedBlack = await buildSocialImage(black);

  const whiteMeta = await sharp(markedWhite).metadata();
  check('the photo keeps its size', `${whiteMeta.width}x${whiteMeta.height}`, '900x700');
  check('and is published as a JPEG', whiteMeta.format, 'jpeg');

  const onWhite = await peakDifference(white, markedWhite);
  const onBlack = await peakDifference(black, markedBlack);
  checkThat('the domain is legible on a white ground', onWhite > 25, `peak ${onWhite.toFixed(0)}/255`);
  checkThat('and on a black one', onBlack > 25, `peak ${onBlack.toFixed(0)}/255`);

  const coverage = await meanDifference(white, markedWhite);
  checkThat(
    'the photo underneath is still the subject',
    coverage > 1 && coverage < 30,
    `mean shift ${coverage.toFixed(1)}/255`,
  );

  const huge = await solidImage(3000, 2000, '#888888');
  const markedHuge = await sharp(await buildSocialImage(huge)).metadata();
  check('an oversized photo is capped, not published at full size', markedHuge.width, 1440);

  const small = await solidImage(320, 240, '#cccccc');
  const markedSmall = await sharp(await buildSocialImage(small)).metadata();
  check('a small one is never blown up to reach the cap', markedSmall.width, 320);

  const portrait = await sharp({ create: { width: 400, height: 600, channels: 3, background: '#dddddd' } })
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();
  const markedPortrait = await sharp(await buildSocialImage(portrait)).metadata();
  check(
    'a phone photo is stamped the way it is viewed, not the way it is stored',
    `${markedPortrait.width}x${markedPortrait.height}`,
    '600x400',
  );

  const transparent = await sharp({
    create: { width: 400, height: 300, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } },
  }).png().toBuffer();
  const flattened = await sharp(await buildSocialImage(transparent)).stats();
  checkThat(
    'a transparent PNG flattens onto white, not black',
    flattened.channels.every((channel) => channel.mean > 200),
    'otherwise the listing publishes as a black square',
  );

  console.log('\n-- what Instagram will accept --');
  // Its publishing API does not crop or convert: a container built from
  // anything outside this specification fails, and the listing never reaches
  // the account. Every shape a phone or a camera produces has to come out the
  // other side inside it.
  const shapes = [
    ['a square photo', 1000, 1000],
    ['a 4:3 camera photo', 1600, 1200],
    ['a 3:4 phone photo', 1200, 1600],
    ['a 9:16 phone photo', 1080, 1920],
    ['a panorama', 3000, 800],
    ['a very tall crop', 400, 1600],
    ['a postage stamp', 200, 150],
  ];

  for (const [label, width, height] of shapes) {
    // eslint-disable-next-line no-await-in-loop
    const published = await buildSocialImage(await solidImage(width, height, '#7a8b99'));
    // eslint-disable-next-line no-await-in-loop
    const meta = await sharp(published).metadata();
    const ratio = meta.width / meta.height;
    checkThat(
      `${label} is published inside the 4:5 - 1.91:1 range`,
      ratio >= LIMITS.MIN_ASPECT - 0.005 && ratio <= LIMITS.MAX_ASPECT + 0.005,
      `${meta.width}x${meta.height} = ${ratio.toFixed(2)}:1`,
    );
    checkThat(
      `${label} is published within 320-1440px wide`,
      meta.width >= LIMITS.MIN_WIDTH && meta.width <= LIMITS.MAX_WIDTH,
      `${meta.width}px`,
    );
    checkThat(`${label} is published as sRGB JPEG`, meta.format === 'jpeg' && meta.space === 'srgb', meta.space);
    checkThat(`${label} is published under 8 MB`, published.length <= LIMITS.MAX_BYTES, `${(published.length / 1024).toFixed(0)} KB`);
  }

  // Padded, never cropped: a listing is evidence of a lost object, and a crop
  // tight enough to bring a 3:4 photo into 4:5 can take the keys out of the
  // corner of the frame.
  for (const [label, width, height] of shapes) {
    const frame = resolveFrame(width, height);
    const sourceRatio = width / height;
    const keptRatio = frame.innerWidth / frame.innerHeight;
    checkThat(
      `${label} keeps its whole frame inside the padding`,
      Math.abs(keptRatio - sourceRatio) / sourceRatio < 0.02,
      `${sourceRatio.toFixed(3)} in, ${keptRatio.toFixed(3)} kept`,
    );
  }

  checkThat(
    'a photo already inside the range is not padded at all',
    resolveFrame(1600, 1200).padded === false,
    'no bars where none are needed',
  );

  // A 3:4 photo of a red wall with one small green mark dead centre. The
  // mark is what proves the sharp photo is actually laid over the blurred
  // backdrop: sharp's `composite()` replaces whatever was set before it, so
  // padding built in two calls silently publishes the blur on its own, and
  // every other measurement here - ratio, width, format, even the bars being
  // the photo's own colours - passes just the same when it does.
  const marker = await sharp(Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200">'
    + '<rect width="900" height="1200" fill="#cc2222"/>'
    + '<rect x="390" y="540" width="120" height="120" fill="#22cc22"/>'
    + '</svg>',
  )).jpeg().toBuffer();

  const publishedMarker = await buildSocialImage(marker);
  const markerMeta = await sharp(publishedMarker).metadata();
  // Cropped to its own buffer before measuring: sharp's `stats()` reads the
  // input image, not the pipeline, so extracting and measuring in one chain
  // would report the whole frame and never see the centre at all.
  const centre = await sharp(await sharp(publishedMarker)
    .extract({
      left: Math.round(markerMeta.width / 2) - 20,
      top: Math.round(markerMeta.height / 2) - 20,
      width: 40,
      height: 40,
    })
    .png()
    .toBuffer()).stats();

  checkThat(
    'the photo is laid over the bars, not replaced by them',
    centre.channels[1].mean > centre.channels[0].mean,
    `centre reads r${centre.channels[0].mean.toFixed(0)} g${centre.channels[1].mean.toFixed(0)}`,
  );

  const paddedStats = await sharp(publishedMarker).stats();
  checkThat(
    'and the bars are the photo itself, blurred - not a flat slab',
    paddedStats.channels[0].mean > paddedStats.channels[2].mean,
    'a grey or white pad would even the channels out',
  );

  console.log('\n-- the copy the Pages are pointed at --');
  uploads.length = 0;
  updates.length = 0;
  downloads = 0;

  const fresh = await ensureSocialImage({ _id: 'p1', cloudinaryUrl: 'https://cdn.example.com/a.jpg' });
  check('a listing with a photo publishes the marked copy', fresh, uploadResult().secure_url);
  check('one upload', uploads.length, 1);
  checkThat('under an id derived from the listing', uploads[0].options.public_id === socialPublicId('p1'));
  checkThat(
    'and with no Cloudinary transformation on top of it',
    Array.isArray(uploads[0].options.transformation) && uploads[0].options.transformation.length === 0,
    'a re-encode is what smears thin light strokes first',
  );
  check('the mark is recorded on the listing', updates.length, 1);
  check(
    'together with what it was stamped from',
    updates[0].update.$set.socialImage.sourceUrl,
    'https://cdn.example.com/a.jpg',
  );

  uploads.length = 0;
  downloads = 0;
  const reused = await ensureSocialImage({
    _id: 'p1',
    cloudinaryUrl: 'https://cdn.example.com/a.jpg',
    socialImage: { url: 'https://cdn.example.com/marked.jpg', sourceUrl: 'https://cdn.example.com/a.jpg' },
  });
  check('an existing mark is reused', reused, 'https://cdn.example.com/marked.jpg');
  check('without fetching anything', downloads, 0);

  uploads.length = 0;
  const restamped = await ensureSocialImage({
    _id: 'p1',
    cloudinaryUrl: 'https://cdn.example.com/b.jpg',
    socialImage: { url: 'https://cdn.example.com/marked.jpg', sourceUrl: 'https://cdn.example.com/a.jpg' },
  });
  checkThat('a photo replaced before publishing is stamped again', restamped === uploadResult().secure_url);
  check('rather than publishing the old picture', uploads.length, 1);

  uploads.length = 0;
  downloads = 0;
  const both = await Promise.all([
    ensureSocialImage({ _id: 'p2', cloudinaryUrl: 'https://cdn.example.com/c.jpg' }),
    ensureSocialImage({ _id: 'p2', cloudinaryUrl: 'https://cdn.example.com/c.jpg' }),
  ]);
  check('the Facebook and Instagram jobs share one generation', uploads.length, 1);
  checkThat('and are given the same copy', both[0] === both[1]);

  console.log('\n-- when the mark cannot be made --');
  check(
    'a photo-less listing asks for nothing',
    await ensureSocialImage({ _id: 'p3' }),
    null,
  );
  check(
    'neither does a listing that was never stored',
    await ensureSocialImage({ cloudinaryUrl: 'https://cdn.example.com/a.jpg' }),
    null,
  );

  const originalDownload = download;
  download = async () => { throw new Error('Cloudinary is unreachable'); };
  check(
    'a download that fails publishes the plain photo instead of nothing',
    await ensureSocialImage({ _id: 'p4', cloudinaryUrl: 'https://cdn.example.com/d.jpg' }),
    null,
  );
  download = originalDownload;

  const originalUpload = uploadResult;
  uploadResult = () => { throw new Error('Upload refused'); };
  check(
    'so does an upload that fails',
    await ensureSocialImage({ _id: 'p5', cloudinaryUrl: 'https://cdn.example.com/e.jpg' }),
    null,
  );
  uploadResult = originalUpload;

  const savedCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_CLOUD_NAME;
  downloads = 0;
  check(
    'an unconfigured deployment never even fetches the photo',
    await ensureSocialImage({ _id: 'p6', cloudinaryUrl: 'https://cdn.example.com/f.jpg' }),
    null,
  );
  check('no download attempted', downloads, 0);
  process.env.CLOUDINARY_CLOUD_NAME = savedCloudName;

  console.log('\n-- cleanup --');
  destroyed.length = 0;
  await deleteSocialImage({ socialImage: { publicId: 'mafqoudat/social/post-p1' } });
  check('deleting a listing takes its marked copy with it', destroyed.length, 1);
  await deleteSocialImage({ socialImage: { publicId: null } });
  await deleteSocialImage({});
  check('a listing that never had one is a no-op', destroyed.length, 1);
}

run()
  .then(() => {
    console.log(`\n${checks - failures}/${checks} checks passed`);
    process.exit(failures === 0 ? 0 : 1);
  })
  .catch((error) => {
    console.error('\nThe check itself failed:', error);
    process.exit(1);
  });
