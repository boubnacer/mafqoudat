## Dependency advisories (Dependabot)

Full record: [dependency-advisories.md](docs/dependency-advisories.md). The
short version, because the wrong reflex here is expensive:

- **Every advisory GitHub reports on this repo is in build/dev tooling.**
  `server/` — the only deployed thing with a request surface — audits clean.
  `client/`'s come from `react-scripts@5.0.1` and the `react-snap`
  devDependency, `mobile/`'s from the Expo/Metro CLI. Neither CRA nor
  react-snap will publish an update, so fixes are pinned as `overrides` in
  each `package.json`.
- **`npm audit fix` is not the tool.** It answers nearly all of these with a
  `react-scripts@0.0.0` / `react-snap@1.13.1` *downgrade*.
- **Check the fix exists before pinning one.** `extract-zip`, `image-size` and
  half the `webpack-dev-server` advisories have no patched release at all —
  the newest published version is still in the vulnerable range.
- **Three pins are deliberately not the newest version, and one advisory is
  deliberately left open.** A root `cookie` override would downgrade
  `react-router@7`'s shipped copy; `webpack-dev-server@5+` removes the v4 API
  CRA's dev-server config is written against; `mobile`'s `uuid` stops at `^11`
  because `xcode` `require`s it and `uuid@14` is ESM-only; and
  `decode-uri-component@0.5.0` is ESM-only too, which breaks the CommonJS
  `query-string` under React Navigation — i.e. deep links, i.e. OAuth
  callbacks and push taps. Each of those is verified in the doc, not assumed.
