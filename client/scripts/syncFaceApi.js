#!/usr/bin/env node
/**
 * Copies the face-api browser bundle and the two model files it needs out of
 * node_modules and into public/vendor/face-api, which is committed.
 *
 * Run after bumping @vladmandic/face-api:  npm run sync-face-api
 *
 * The bundle is served as a static asset and loaded with a native dynamic
 * import rather than being bundled by webpack, because it carries tfjs, and
 * tfjs carries node-only branches (`require("fs")`, `require("worker_threads")`
 * and esbuild's dynamic-require shim). Webpack cannot statically resolve those,
 * so it emits "Critical dependency: require function is used in a way in which
 * dependencies cannot be statically extracted" - and react-scripts turns any
 * warning into a failure when CI is set, which it is on Vercel. Keeping the
 * file out of the graph also keeps 1.3MB out of every production build.
 *
 * Only the tiny detector and the tiny landmark net are copied. The package also
 * ships age/gender/expression/recognition weights and the full-size variants,
 * none of which this app asks for.
 */
const fs = require('fs');
const path = require('path');

const PACKAGE_ROOT = path.dirname(require.resolve('@vladmandic/face-api/package.json'));
const TARGET_DIR = path.join(__dirname, '..', 'public', 'vendor', 'face-api');

const FILES = [
  ['dist/face-api.esm.js', 'face-api.esm.js'],
  ['model/tiny_face_detector_model-weights_manifest.json', 'models/tiny_face_detector_model-weights_manifest.json'],
  ['model/tiny_face_detector_model.bin', 'models/tiny_face_detector_model.bin'],
  ['model/face_landmark_68_tiny_model-weights_manifest.json', 'models/face_landmark_68_tiny_model-weights_manifest.json'],
  ['model/face_landmark_68_tiny_model.bin', 'models/face_landmark_68_tiny_model.bin'],
];

const { version } = require('@vladmandic/face-api/package.json');

FILES.forEach(([from, to]) => {
  const source = path.join(PACKAGE_ROOT, from);
  const destination = path.join(TARGET_DIR, to);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  console.log(`  ${to}  (${(fs.statSync(destination).size / 1024).toFixed(0)} KB)`);
});

fs.writeFileSync(
  path.join(TARGET_DIR, 'VERSION'),
  `@vladmandic/face-api@${version}\nRegenerate with: npm run sync-face-api\n`
);

console.log(`\nSynced @vladmandic/face-api@${version} into public/vendor/face-api`);
