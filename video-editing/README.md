# video-editing

Standalone [Remotion](https://remotion.dev) project for programmatic video editing. Unrelated to the Mafqoudat app (`client/`/`server/`/`mobile/`) — separate workspace, own `node_modules`.

## Setup already done

- `npm install` run, deps pinned to `4.0.505` (patched — earlier versions have a known RCE advisory).
- `remotion.config.ts` points at the Chromium headless-shell already installed in this container (`/opt/pw-browsers/chromium_headless_shell-1194/...`) instead of downloading Remotion's own copy.
- Verified with a real render: `out/test.mp4` (not committed, gitignored).

## Structure

- `src/Root.tsx` — registers compositions (Remotion's list of "video templates").
- `src/MyComposition.tsx` — sanity-check composition (animated title, no video needed).
- `src/EditedVideo.tsx` — template for editing a real video: trims it and overlays a caption for the first 2 seconds.
- `public/` — put your source video file(s) here (e.g. `public/my-video.mp4`).
- `out/` — rendered output lands here (gitignored).

## Using your own video

1. Add the file to `public/`, e.g. `public/clip.mp4`.
2. Update `defaultProps.videoSrc` in `src/Root.tsx` for the `EditedVideo` composition (or pass `--props` at render time, see below).
3. Render:
   ```
   cd video-editing
   npx remotion render src/index.ts EditedVideo out/edited.mp4 \
     --props='{"videoSrc":"clip.mp4","trimStartInSeconds":2,"trimEndInSeconds":8,"titleText":"My caption"}'
   ```

## How to use this with Claude

Everything is React/TypeScript — a video edit is a code edit. Just describe what you want in plain English and point at the file:

- "Trim `clip.mp4` to seconds 10-20 and add a caption that says X" → Claude edits `EditedVideo.tsx` props/logic.
- "Overlay a logo in the corner" → Claude adds an `<Img>`/`<AbsoluteFill>` element positioned with CSS.
- "Concatenate two clips" → Claude adds a `<Series>` with a `<Series.Sequence>` per clip.
- "Add background music" → Claude adds an `<Audio>` element.
- "Change to vertical 1080x1920 for social" → Claude edits the `<Composition>` `width`/`height` in `Root.tsx`.
- "Add a fade transition between clips" → Claude uses `@remotion/transitions`.

After any edit, ask Claude to render again (`npx remotion render ...`) to produce the updated `.mp4`, then have it send you the file — this cloud session's disk doesn't persist, so grab the output before the session ends (or ask Claude to commit source `.tsx` changes to this branch, which do persist).

## Commands

- `npm run render` — render a composition to `out/` (wraps `remotion render`).
- `npm run still` — render a single frame as an image.
- `npm run start` — launch Remotion Studio (visual preview/editor UI); needs a forwarded port to view in this remote environment, so prefer `render` here and preview locally if needed.

## Notes

- `duration`, `fps`, `width`, `height` for each composition are declared in `Root.tsx` and must match reality (e.g. a 10s clip at 30fps needs `durationInFrames={300}`) or the render will cut off/pad.
- Local Claude Code: same setup works, just skip the `browserExecutable` override in `remotion.config.ts` (or point it at your own Chrome) since Remotion can download its own Chromium there.
