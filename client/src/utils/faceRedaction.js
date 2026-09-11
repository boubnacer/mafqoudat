// Detects faces in a listing photo and paints a mosaic bar over each pair of
// eyes, entirely in the visitor's browser. Nothing is uploaded to run this and
// no third-party service is called: the detector and its weights are served
// from our own origin.
//
// Two decisions worth keeping:
//
// - The redaction is a *mosaic*, not a blur. `CanvasRenderingContext2D.filter`
//   is the only way to blur on a canvas and Safari did not support it before
//   17 — where it is missing it is ignored silently, which for a privacy
//   feature means shipping an un-redacted photo while telling the author it
//   was covered. Downscaling a region and drawing it back up with smoothing
//   off is plain `drawImage`, works everywhere, and is not reversible.
//
// - Nothing in here may throw at its caller. Every failure (no WebGL, blocked
//   weights, a decoder that cannot read the file) resolves to "no faces
//   found", so the photo step keeps working exactly as it did before.

// The detector and its weights are committed under client/public/vendor, the
// same policy as src/data/worldMap.topo.json: a deploy never needs the network
// and neither does the browser beyond our own origin. Refresh them from the npm
// package with `npm run sync-face-api`.
//
// The library is fetched as a static asset and loaded with a *native* dynamic
// import (`webpackIgnore`) instead of being bundled. It carries tfjs, and tfjs
// carries node-only branches that webpack cannot statically resolve; the
// resulting "Critical dependency" warnings fail the production build outright,
// because react-scripts treats warnings as errors whenever CI is set. Keeping
// it out of the graph also keeps 1.3MB out of every build.
const VENDOR_PATH = `${process.env.PUBLIC_URL || ''}/vendor/face-api`;
const FACE_API_URL = `${VENDOR_PATH}/face-api.esm.js`;
const MODEL_PATH = `${VENDOR_PATH}/models`;

// The only two backends we let tfjs consider, in order. `wasm` is deliberately
// excluded even though the bundle carries it: it fetches its .wasm binary from
// a jsdelivr CDN at runtime, which would put a third-party request in the
// middle of a feature whose whole point is that the photo never leaves the
// device - and it simply fails wherever that CDN is unreachable. Left to
// itself tfjs ranks wasm above cpu and picks it the moment WebGL is missing.
const BACKENDS = ['webgl', 'cpu'];

// tinyFaceDetector rescales whatever it is given to inputSize² before looking
// at it, so handing it the full-resolution photo buys nothing. 512 (multiples
// of 32 only) recalls small faces noticeably better than the 416 default.
// Held at 512 on the CPU fallback too, though that path runs several times
// slower: dropping to 320 there measurably missed faces the 512 pass caught
// (three of five in one test photo), and a face this misses is a face
// published. The wait is covered by a spinner and a disabled Next button.
const DETECTOR_INPUT_SIZE = 512;
// Below the 0.5 default on purpose: a face this misses is a face published,
// while a false positive is one toggle away from being undone.
const DETECTOR_SCORE_THRESHOLD = 0.4;

// Bar geometry, expressed against the distance between the two eye centres so
// it scales with the face and with head tilt.
const BAR_WIDTH_PER_EYE_SPAN = 2.2;
const BAR_HEIGHT_PER_EYE_SPAN = 0.72;
const BAR_BLOCKS_ACROSS = 7;

// Used when a face was detected but its landmarks were not: eyes sit roughly a
// third of the way down a detection box.
const FALLBACK_EYE_LINE = 0.38;
const FALLBACK_BAR_WIDTH = 0.92;
const FALLBACK_BAR_HEIGHT = 0.22;

const EXTENSION_BY_TYPE = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// The server's multer gate is 2MB (server/middleware/multer.js); stay clear of
// it, but never push quality down for a photo that was already small.
const UPLOAD_CEILING_BYTES = Math.round(1.9 * 1024 * 1024);
const SIZE_FLOOR_BYTES = 400 * 1024;

const NO_FACES = { faceCount: 0, file: null };

let faceApiPromise = null;
let detectorPromise = null;
let landmarksPromise = null;

// Each memo clears itself on rejection so a failure caused by a dropped
// connection doesn't poison every later upload in the session.
const loadFaceApi = () => {
  if (!faceApiPromise) {
    faceApiPromise = import(/* webpackIgnore: true */ FACE_API_URL).catch((error) => {
      faceApiPromise = null;
      throw error;
    });
  }
  return faceApiPromise;
};

// Must run before any weights are loaded: reading a model file builds tensors,
// and that throws outright if no backend has been initialized yet.
const selectBackend = async (faceapi) => {
  const { tf } = faceapi;
  for (const backend of BACKENDS) {
    try {
      // eslint-disable-next-line no-await-in-loop
      if (await tf.setBackend(backend)) {
        // eslint-disable-next-line no-await-in-loop
        await tf.ready();
        return backend;
      }
    } catch (error) {
      // Try the next one; tfjs logs its own reason.
    }
  }
  throw new Error('No usable TensorFlow.js backend');
};

const loadDetector = (faceapi) => {
  if (!detectorPromise) {
    detectorPromise = faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH).catch((error) => {
      detectorPromise = null;
      throw error;
    });
  }
  return detectorPromise;
};

// Resolves a boolean rather than rejecting: without landmarks we still redact,
// just from the detection box instead of the eyes.
const loadLandmarks = (faceapi) => {
  if (!landmarksPromise) {
    landmarksPromise = faceapi.nets.faceLandmark68TinyNet
      .loadFromUri(MODEL_PATH)
      .then(() => true)
      .catch(() => {
        landmarksPromise = null;
        return false;
      });
  }
  return landmarksPromise;
};

const readImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, release: () => URL.revokeObjectURL(url) });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The browser could not decode this image'));
    };
    image.src = url;
  });

const meanPoint = (points) => {
  let x = 0;
  let y = 0;
  points.forEach((point) => {
    x += point.x;
    y += point.y;
  });
  return { x: x / points.length, y: y / points.length };
};

// Accepts either shape face-api can hand back: a bare FaceDetection, or a
// detection with landmarks attached.
const eyeRegionFor = (result) => {
  const landmarks = result?.landmarks;

  if (landmarks) {
    const left = landmarks.getLeftEye();
    const right = landmarks.getRightEye();
    if (left?.length && right?.length) {
      const a = meanPoint(left);
      const b = meanPoint(right);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const span = Math.hypot(dx, dy);
      if (span > 1) {
        return {
          cx: (a.x + b.x) / 2,
          cy: (a.y + b.y) / 2,
          halfW: (span * BAR_WIDTH_PER_EYE_SPAN) / 2,
          halfH: (span * BAR_HEIGHT_PER_EYE_SPAN) / 2,
          angle: Math.atan2(dy, dx),
        };
      }
    }
  }

  const box = result?.detection?.box || result?.box;
  if (!box || !(box.width > 1) || !(box.height > 1)) return null;

  return {
    cx: box.x + box.width / 2,
    cy: box.y + box.height * FALLBACK_EYE_LINE,
    halfW: (box.width * FALLBACK_BAR_WIDTH) / 2,
    halfH: (box.height * FALLBACK_BAR_HEIGHT) / 2,
    angle: 0,
  };
};

const traceRoundedRect = (ctx, x, y, width, height, radius) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const paintMosaic = (ctx, source, sourceWidth, sourceHeight, region) => {
  const { cx, cy, halfW, halfH, angle } = region;

  // Axis-aligned footprint of the tilted bar, so we know which pixels to sample.
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));
  const left = Math.max(0, Math.floor(cx - (halfW * cos + halfH * sin)));
  const top = Math.max(0, Math.floor(cy - (halfW * sin + halfH * cos)));
  const right = Math.min(sourceWidth, Math.ceil(cx + (halfW * cos + halfH * sin)));
  const bottom = Math.min(sourceHeight, Math.ceil(cy + (halfW * sin + halfH * cos)));
  const width = right - left;
  const height = bottom - top;
  if (width < 2 || height < 2) return false;

  const blockPx = Math.max(2, (halfW * 2) / BAR_BLOCKS_ACROSS);
  const tinyWidth = Math.max(1, Math.round(width / blockPx));
  const tinyHeight = Math.max(1, Math.round(height / blockPx));

  const tiny = document.createElement('canvas');
  tiny.width = tinyWidth;
  tiny.height = tinyHeight;
  const tinyCtx = tiny.getContext('2d');
  if (!tinyCtx) return false;
  // Smoothing on the way down averages each block; off on the way back up keeps
  // the block edges hard instead of interpolating detail back into them.
  tinyCtx.imageSmoothingEnabled = true;
  tinyCtx.drawImage(source, left, top, width, height, 0, 0, tinyWidth, tinyHeight);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  traceRoundedRect(ctx, -halfW, -halfH, halfW * 2, halfH * 2, halfH * 0.55);
  ctx.clip();
  // The clip is held in device space, so resetting the transform keeps the
  // tilted mask while letting the blocks be drawn in plain image coordinates.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tiny, 0, 0, tinyWidth, tinyHeight, left, top, width, height);
  ctx.restore();
  return true;
};

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    } catch (error) {
      resolve(null);
    }
  });

const encodingPlanFor = (type) => {
  if (type === 'image/png') {
    // PNG ignores the quality argument, so the only way down is to change format.
    return [['image/png', undefined], ['image/jpeg', 0.9], ['image/jpeg', 0.8]];
  }
  if (type === 'image/webp') {
    return [['image/webp', 0.9], ['image/webp', 0.8], ['image/jpeg', 0.8]];
  }
  return [['image/jpeg', 0.9], ['image/jpeg', 0.8], ['image/jpeg', 0.7]];
};

const outputNameFor = (originalName, type) => {
  const wanted = EXTENSION_BY_TYPE[type] || '.jpg';
  const name = originalName || `photo${wanted}`;
  const current = name.toLowerCase().match(/\.[^./\\]+$/)?.[0];
  if (current === wanted || (wanted === '.jpg' && current === '.jpeg')) return name;
  return `${name.replace(/\.[^./\\]+$/, '') || 'photo'}${wanted}`;
};

const encodeCanvas = async (canvas, sourceFile) => {
  const ceiling = Math.min(UPLOAD_CEILING_BYTES, Math.max(sourceFile.size, SIZE_FLOOR_BYTES));
  // `image/jpg` is not a real encoder name — asking for it silently yields PNG.
  const sourceType = sourceFile.type === 'image/jpg' ? 'image/jpeg' : sourceFile.type;

  let smallest = null;
  for (const [type, quality] of encodingPlanFor(sourceType)) {
    // eslint-disable-next-line no-await-in-loop
    const blob = await canvasToBlob(canvas, type, quality);
    if (!blob) continue;
    if (!smallest || blob.size < smallest.size) smallest = blob;
    if (blob.size <= ceiling) break;
  }
  if (!smallest) return null;

  // Read the type off the blob rather than the request: a browser that cannot
  // encode the format it was asked for answers with PNG, and the server checks
  // the filename extension as well as the MIME type.
  return new File([smallest], outputNameFor(sourceFile.name, smallest.type), {
    type: smallest.type,
    lastModified: Date.now(),
  });
};

/**
 * Looks for faces in `file` and returns a copy with every pair of eyes covered.
 *
 * Resolves to `{ faceCount: 0, file: null }` when there is nothing to cover or
 * when detection could not run at all — callers should treat that as "keep the
 * photo as it is" and never as an error.
 */
export const redactFacesInImage = async (file) => {
  if (!file || !file.type?.startsWith('image/') || typeof document === 'undefined') {
    return NO_FACES;
  }

  let faceapi;
  let backend;
  let useLandmarks = false;
  try {
    faceapi = await loadFaceApi();
    backend = await selectBackend(faceapi);
    await loadDetector(faceapi);
    useLandmarks = await loadLandmarks(faceapi);
  } catch (error) {
    console.warn('[faceRedaction] face detection unavailable, leaving the photo untouched', error);
    return NO_FACES;
  }

  let handle;
  try {
    handle = await readImage(file);
  } catch (error) {
    console.warn('[faceRedaction] could not read the selected image', error);
    return NO_FACES;
  }

  const { image, release } = handle;
  try {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height) return NO_FACES;

    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: DETECTOR_INPUT_SIZE,
      scoreThreshold: DETECTOR_SCORE_THRESHOLD,
    });
    const task = faceapi.detectAllFaces(image, options);
    const results = useLandmarks ? await task.withFaceLandmarks(true) : await task;

    const regions = (results || []).map(eyeRegionFor).filter(Boolean);
    if (!regions.length) return NO_FACES;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return NO_FACES;
    ctx.drawImage(image, 0, 0);

    let covered = 0;
    regions.forEach((region) => {
      if (paintMosaic(ctx, image, width, height, region)) covered += 1;
    });
    if (!covered) return NO_FACES;

    const redacted = await encodeCanvas(canvas, file);
    if (!redacted) return NO_FACES;

    return { faceCount: covered, file: redacted };
  } catch (error) {
    console.warn('[faceRedaction] face detection failed, leaving the photo untouched', error);
    return NO_FACES;
  } finally {
    release();
  }
};

export default redactFacesInImage;
