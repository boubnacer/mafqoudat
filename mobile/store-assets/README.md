# Play Console store listing assets

Assets that the Play Console asks for but that are **not** part of the app
build. Nothing in `app.config.js` references this folder; it exists so the
listing assets live with the app they describe instead of in someone's
Downloads.

All of these are generated from the same brand glyph as `assets/icon.png`, so
the store listing and the installed launcher icon are the same mark.

| File | Play Console field | Requirement |
| --- | --- | --- |
| `icon-512.png` | App icon | 512×512, 32-bit PNG |
| `feature-graphic-1024x500.png` | Feature graphic | 1024×500, JPEG or 24-bit PNG (no alpha) |

## Still to produce by hand

Screenshots cannot be generated from source - they have to be captured from a
running build:

- **Phone**: at least 2, up to 8. 16:9 or 9:16, each side between 320px and
  3840px.
- **7-inch and 10-inch tablet**: required only while `ios.supportsTablet` /
  tablet support is advertised. If the app is phone-only in practice, say so in
  the listing rather than shipping stretched phone screenshots.

Capture them in **all three supported languages** (en / fr / ar). The app ships
full RTL Arabic and French; an English-only listing in Arabic-speaking markets
costs installs for no reason, and the Arabic screenshots also demonstrate the
RTL layout to the reviewer.

## Other listing fields

- Short description: ≤ 80 characters.
- Full description: ≤ 4000 characters.
- Privacy policy URL: `https://www.mafqoudat.com/privacy`
- Account deletion URL: `https://www.mafqoudat.com/delete-account`
- App access: the app gates almost everything behind sign-in, so a reviewer
  test account **must** be supplied under "App access" or review will fail on
  functionality grounds.
