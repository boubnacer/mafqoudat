# SDK 54 Upgrade Instructions

## Quick Fix

Run these commands in the `mobile` directory:

```bash
cd mobile
npx expo install --fix
npm install
```

This will automatically update all Expo packages to SDK 54 compatible versions.

## Manual Alternative

If the above doesn't work, you can manually install:

```bash
cd mobile
npm install expo@~54.0.0
npx expo install --fix
```

Then restart Expo:
```bash
npm start
```

