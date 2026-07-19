# Mafqoudat Mobile App

React Native mobile application for Mafqoudat - Lost and Found Platform.

## Prerequisites

- Node.js (>= 18.0.0)
- npm or yarn
- Expo CLI
- iOS: Xcode (for iOS development)
- Android: Android Studio (for Android development)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

4. Start the development server:
```bash
npm start
```
This opens in **Expo Go** mode (the daily-driver workflow) - scan the QR code with the
Expo Go app. If you've installed a custom development build instead (see `BUILD.md`),
use `npm run start:dev` instead - its QR code will not open in Expo Go, and vice versa.

## Development

- **iOS**: `npm run ios`
- **Android**: `npm run android`
- **Web**: `npm run web`

## Building for Production

### Android
```bash
npm run build:android
```

### iOS
```bash
npm run build:ios
```

## Project Structure

```
mobile/
├── src/
│   ├── screens/         # Screen components
│   ├── components/      # Reusable components
│   ├── context/         # React context providers (auth, language, maintenance...)
│   ├── api/             # Axios client + interceptors
│   ├── utils/           # Utility functions
│   └── config/          # Configuration files, env-var validation
├── assets/               # Static assets (images, icons)
└── App.js              # Main app entry point
```

## Store Submission

### Android (Google Play Store)
- Ensure `android.package` in `app.config.js` matches your Play Store package name
- Update `versionCode` for each release
- Run `npm run build:android` to create APK/AAB

### iOS (App Store)
- Ensure `ios.bundleIdentifier` in `app.config.js` matches your App Store bundle ID
- Update `buildNumber` for each release
- Run `npm run build:ios` to create IPA

## Notes

- This app structure mirrors the web app (`client/`) for easy code reference
- API endpoints are shared with the web app
- Authentication uses JWT tokens stored securely

