## Eye redaction on uploaded photos (web)

Every photo picked on the New Post wizard's Photo step is scanned for faces in
the visitor's own browser, and each detected pair of eyes is covered with a
mosaic bar. [faceRedaction.js](client/src/utils/faceRedaction.js) does the work,
[NewPostForm.js](client/src/features/posts/NewPost/NewPostForm.js) holds the
state and [StepPhoto.jsx](client/src/features/posts/NewPost/steps/StepPhoto.jsx)
renders the panel. Nothing about it reaches the server: the model, its weights
and the redaction all run client-side, and the covered copy is what
`handleSubmit` uploads.

- **Every photo is scanned, not just the ones in a "person" category.** Faces
  leak into listings that have nothing to do with people: a found wallet
  photographed with the ID card still in it, a phone showing a lock-screen
  photo, a bystander in the frame of a lost-bag shot. Gating on category would
  miss exactly those, and scanning costs nothing when there is no face.
- **Face scanning runs inside the photo component (dropzone) alongside compression.**
  When a user picks a photo, the dropzone first indicates "Compressing...", followed
  by "Searching for faces...". The image preview is only shown once processing and
  detection are complete.
- **Detected faces are automatically redacted without a user toggle.**
  If faces are detected, eyes are automatically covered by the mosaic bar before the
  preview is shown, and the redacted file is uploaded. An informative badge is displayed
  below the image preview explaining that eyes are covered to protect privacy, with no
  toggle allowing the user to unhide them.
- **The redaction is a mosaic, not a blur.** The only way to blur on a canvas
  is `CanvasRenderingContext2D.filter`, which Safari did not support before 17
  and *ignores silently* where it is missing - for a privacy feature that means
  publishing an un-redacted photo while telling the author it was covered.
  Downscaling a region and drawing it back up with smoothing off is plain
  `drawImage`, works everywhere, and cannot be undone.
- **The bar is placed from the eye landmarks, not the face box**, so it follows
  head tilt (its angle comes from the line between the two eye centres and all
  of its dimensions scale with the distance between them). A face detected
  without usable landmarks falls back to a horizontal bar across the detection
  box.
- **`@vladmandic/face-api`, not `face-api.js`.** Same API, but the original was
  last published in 2020 and bundles tfjs-core 1.7, which reaches for node's
  `fs`/`path` - webpack 5 dropped the automatic polyfills, so it does not build
  under react-scripts 5 at all.
- **The library is a static asset loaded by native `import()`, not a bundled
  dependency.** It carries tfjs, and tfjs carries node-only branches
  (`require("fs")`, `require("worker_threads")`, esbuild's dynamic-require
  shim) that webpack cannot statically resolve. Those produce "Critical
  dependency" *warnings*, and react-scripts turns any warning into a failed
  build when `CI` is set - which Vercel sets. The first version of this shipped
  exactly that and could not have deployed. So the bundle and the two model
  files live in `client/public/vendor/face-api` (committed, same policy as
  `worldMap.topo.json`; refresh with `npm run sync-face-api`), and
  `faceRedaction.js` pulls the bundle in with `/* webpackIgnore: true */`. The
  side benefit is that 1.3MB never enters the build graph.
- **tfjs is pinned to `webgl` then `cpu`, and never `wasm`.** Left to itself it
  ranks wasm above cpu and picks it the moment WebGL is missing - and the wasm
  backend fetches its binary **from a jsdelivr CDN at runtime**, which would put
  a third-party request in the middle of a feature whose whole point is that the
  photo never leaves the device, and simply fails wherever that CDN is blocked.
  The backend must also be selected *before* any weights load, since reading a
  model file builds tensors.
- **Only the tiny nets are shipped** (`tinyFaceDetector` 189KB +
  `faceLandmark68Tiny` 75KB). `inputSize` is 512 rather than the 416 default,
  on the CPU fallback too: dropping to 320 there measurably missed faces the
  512 pass caught (three of five in one test photo), and the CPU path is the
  one running on a device with no WebGL. `scoreThreshold` is 0.4 rather than
  0.5 for the same reason - a missed face is published, a false positive is one
  toggle away.
- **Nothing in `faceRedaction.js` may throw at its caller.** Every failure
  resolves to "no faces found" and the photo step behaves exactly as it did
  before. The Photo step's Next button is disabled while a scan is running, so
  a fast click cannot carry the un-redacted photo through to Review.
- **Not on `EditPostForm.js` or mobile.** Only the web New Post wizard was in
  scope for this pass.
