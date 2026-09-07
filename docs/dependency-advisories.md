# Dependency advisories (Dependabot)

Standing record of the npm advisories GitHub reports against this repository:
which ones are pinned away, which ones have no fix to take, and why the
remaining ones are not being forced.

Re-check any time with:

```bash
cd client && npm audit --package-lock-only
cd mobile && npm audit --package-lock-only
cd server && npm audit --package-lock-only
```

## The shape of the problem

**Every one of these advisories is in build or development tooling. None of it
is in the deployed API or in anything a browser or a phone downloads.**
`server/` — the only thing running in production with a request surface —
audits clean, and has throughout.

The three lockfiles carry the alerts for three different reasons:

- `client/package-lock.json` — `react-scripts@5.0.1` (webpack, its dev server,
  jest, svgr) and `react-snap@1.23.0` (a `devDependency`, a Puppeteer
  prerenderer). Both are effectively frozen upstream: CRA is unmaintained, and
  react-snap's last release was 2019.
- `mobile/package-lock.json` — the Expo/Metro CLI toolchain, plus one library
  under React Navigation.
- `server/package-lock.json` — nothing.

`react-snap` is worth calling out because it does not run on Vercel at all
(`scripts/postbuild.js` skips it: Puppeteer has no serverless environment to
run in), and `prerenderSeo.js` is what actually prerenders the deployed site.
Locally it runs, its failure is caught, and the build continues.

## Fixed, by `overrides`

Neither `react-scripts` nor `react-snap` will publish an update, so the
transitive versions are pinned directly in each `package.json`'s `overrides`
block. `npm audit fix` cannot do this — it answers every one of these with a
`react-scripts@0.0.0` / `react-snap@1.13.1` *downgrade*, which is not a fix.

### `client/`

| Override | Advisory cleared |
| --- | --- |
| `express: ^4.22.2` | GHSA-qw6h-vgh9-j6wx (XSS via `response.redirect()`), GHSA-rv95-896h-c2vc (open redirect on malformed URLs) |
| `body-parser: ^1.20.6` | GHSA-qwcr-r2fm-qrc7, GHSA-v422-hmwv-36x6 (DoS) |
| `serve-static: ^1.16.3` | GHSA-cm22-4g7w-348p (template injection → XSS) |
| `send: ^0.19.2` | GHSA-m6fv-jmcg-4jfg (template injection → XSS) |
| `node-fetch: ^2.6.7` | GHSA-r683-j2x4-v87g (forwards secure headers to untrusted sites) |
| `svgo: ^2.8.3` | GHSA-2p49-hgcm-8545 (`removeScripts` leaves executable scripts intact) |
| `http-proxy-agent: ^5.0.0` | GHSA-vpq2-c234-7xj6 (`@tootallnate/once` control-flow scoping) |

`cookie` (GHSA-pxg6-pf52-xh8x) and `path-to-regexp` are cleared without an
override of their own: the vulnerable copies were `react-snap`'s nested
`express@4.16.4` subtree, and pinning `express` collapses that whole tree onto
the already-deduped top-level one. Do **not** add a root `cookie` override —
`react-router@7` depends on `cookie@^1.0.1` and ships to the browser, so a
`^0.7.x` pin would downgrade live application code to fix a build-tool tree.

Two of these deserve their reasoning written down:

- **`svgo` is bumped across a major (1.x → 2.8.4), which would normally break
  `@svgr/plugin-svgo@5.5.0`** — that plugin calls the removed v1 `new SVGO()`
  constructor. It is safe here because CRA passes `svgo: false` in its webpack
  config, so `svgoPlugin` returns before it ever constructs one; `require('svgo')`
  at module load is all that happens. The other consumer, `postcss-svgo@5.1.0`,
  was already resolving `svgo@2.8.4` in a nested copy.
- **`http-proxy-agent` is bumped rather than `@tootallnate/once` itself.**
  `once@2` is a breaking rewrite (v1 resolves to the first event argument and
  carries `.cancel`/`.spread`; v2 resolves to the argument array and takes
  `{signal}`), so pinning it under `jsdom`'s `http-proxy-agent@4` would swap an
  advisory for a real bug. `http-proxy-agent@5` is the version written against
  `once@2`, keeps the same `new HttpProxyAgent(url)` shape `jsdom@16.7` uses,
  and pulls the fixed `once` in behind it.

### `mobile/`

| Override | Advisory cleared |
| --- | --- |
| `uuid: ^11.1.1` | GHSA-w5hq-g745-h8pq (missing buffer bounds check in v3/v5/v6) |

Pinned to `^11.1.1` and not to the current major on purpose: `uuid@11` still
publishes a real CJS entry point (`exports.node.require → dist/cjs/index.js`),
and its consumer here — `xcode@3.0.1`, under `@expo/config-plugins`, `require`s
it. `uuid@14` is `"type": "module"` with an ESM-only Node condition, which
resolves today only because the runtime is new enough to `require()` ESM. That
is a needless dependency on the Node version of whoever runs a prebuild.
(`client/`'s pre-existing `uuid: ^14.0.2` override is left alone — it feeds
`sockjs` inside the webpack dev server, which never runs outside a dev
machine.)

## Not fixed, because there is nothing to upgrade to

These stay open in Dependabot. Each was checked against the current published
version, not assumed.

- **`extract-zip` — unvalidated symlink path traversal (GHSA-jmr9-qjv8-65gv,
  high).** Vulnerable range is `<=2.0.1` and `2.0.1` is the newest release, so
  no version fixes it. Reached through `puppeteer@1.20.0` under `react-snap`,
  and only on the code path that unpacks a freshly downloaded Chromium — it is
  not touched by a prerender run against an already-installed browser.
- **`image-size` — ICNS / JXL / HEIF infinite loops (GHSA-w3rx-r6r6-pgpr,
  GHSA-5p2g-fcmc-qvqq, both high).** Vulnerable range is `<=2.0.2` and `2.0.2`
  is the newest release. It is Metro's own asset-dimension reader, so the
  attacker-controlled input would have to be a source asset in this repository.
- **`webpack-dev-server` — six advisories (all moderate).** Three of them
  (GHSA-mx8g-39q3-5c79, GHSA-f5vj-f2hx-8m93, GHSA-m28w-2pqf-7qgj) are
  unpatched as of `5.2.5`; the only newer release is `6.0.0`. `react-scripts@5.0.1`
  cannot run either: its `webpackDevServer.config.js` is written against the
  v4 API (`onBeforeSetupMiddleware`, `onAfterSetupMiddleware`, the top-level
  `https` option), all of which v5 removed. Forcing it would break
  `npm start` outright to fix something that only ever exists on a developer's
  own machine — the production build is `react-scripts build`, which never
  starts a dev server. The realistic fix is migrating off CRA (to Vite), which
  is its own piece of work.

## Not fixed, because the fix breaks the app

- **`decode-uri-component` — DoS via exponential decoding of malformed
  percent-encoded input (GHSA-vcc3-ghjq-m6fr, moderate).** The advisory covers
  `<=0.4.2`; the fix is `0.5.0`, which is a rewrite published **ESM-only**
  (`"type": "module"`, a single `default` export, no CJS entry). Its consumer
  is `query-string@7.1.3` under `@react-navigation/core`, which is CommonJS and
  does `const decodeComponent = require('decode-uri-component')` then calls
  `decodeComponent(value)`. Once Metro's Babel pass rewrites the ESM module,
  that `require` returns `{ default: fn }` and the call throws
  `decodeComponent is not a function`. Verified rather than assumed —
  transforming `0.5.0` with `@babel/plugin-transform-modules-commonjs` and
  requiring the result reproduces it exactly.

  That code path parses deep links, which this app relies on for OAuth
  callbacks and push-notification taps, so the override trades a
  parse-a-hostile-string DoS for an app that cannot complete a sign-in. The
  upstream fix has to come from `query-string`/React Navigation.
