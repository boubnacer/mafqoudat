# Mobile App Setup Guide

## Initial Setup Steps

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Install Required Expo Packages

```bash
npx expo install expo-secure-store expo-image-picker
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_API_URL=https://mafqoudat-api.onrender.com
```

### 4. Create App Assets

You need to create the following assets in the `assets/` folder:

- **icon.png** (1024x1024) - App icon for both platforms
- **splash.png** (1242x2436) - Splash screen
- **adaptive-icon.png** (1024x1024) - Android adaptive icon
- **favicon.png** (48x48) - Web favicon

You can use your existing logo from `client/public/maflogo1200-630.png` as a base.

### 5. Update App Configuration

Edit `app.json` or `app.config.js`:

1. Update `bundleIdentifier` (iOS) and `package` (Android) with your unique identifiers
2. Update `projectId` in `eas.json` after creating an EAS project
3. Customize app name, description, and colors

### 6. Start Development Server

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Store Submission Preparation

### Android (Google Play Store)

1. **Update version in `app.json`**:
   ```json
   "android": {
     "versionCode": 1,  // Increment for each release
     "package": "com.mafqoudat.app"  // Must match Play Store
   }
   ```

2. **Create Keystore** (for production builds):
   ```bash
   eas build:configure
   ```

3. **Build APK/AAB**:
   ```bash
   eas build --platform android --profile production
   ```

4. **Submit to Play Store**:
   ```bash
   eas submit --platform android
   ```

### iOS (App Store)

1. **Update version in `app.json`**:
   ```json
   "ios": {
     "buildNumber": "1",  // Increment for each release
     "bundleIdentifier": "com.mafqoudat.app"  // Must match App Store
   }
   ```

2. **Configure App Store Connect**:
   - Create app in App Store Connect
   - Set up certificates and provisioning profiles

3. **Build IPA**:
   ```bash
   eas build --platform ios --profile production
   ```

4. **Submit to App Store**:
   ```bash
   eas submit --platform ios
   ```

## Project Structure

```
mobile/
├── src/
│   ├── features/           # Feature modules (mirrors web app)
│   │   ├── auth/
│   │   │   └── Login/
│   │   └── posts/
│   │       └── PostsList/
│   ├── screens/            # Screen components
│   │   ├── LoginScreen.js
│   │   └── PostsListScreen.js
│   ├── components/         # Reusable components
│   ├── app/
│   │   └── api/
│   │       └── apiService.js  # API client
│   ├── hooks/              # Custom hooks
│   │   └── useAuth.js
│   ├── utils/              # Utility functions
│   │   ├── storage.js
│   │   └── tokenUtils.js
│   └── config/
│       └── api.js          # API configuration
├── assets/                 # Images, icons, etc.
├── App.js                  # Main app entry
├── app.json                # Expo configuration
├── package.json
└── eas.json                # EAS Build configuration
```

## Key Features Implemented

✅ **Authentication**
- Login screen with email/phone and password
- JWT token storage using Expo SecureStore
- Token validation and expiration handling
- Auto-logout on token expiration

✅ **Posts List**
- Fetch and display posts from API
- Pull-to-refresh
- Infinite scroll pagination
- Image loading and display
- Error handling

✅ **Navigation**
- React Navigation setup
- Stack navigator for screens
- Protected routes (can be extended)

✅ **API Integration**
- Axios-based API client
- Automatic token injection
- Error handling and interceptors
- Mirrors web app API structure

## Next Steps

1. **Add Assets**: Create icon.png, splash.png, etc.
2. **Test Login**: Verify login flow works with your backend
3. **Test Posts**: Verify posts load correctly
4. **Add Features**: Extend with more features as needed
5. **Styling**: Customize UI to match your brand
6. **Testing**: Test on both iOS and Android devices
7. **Store Prep**: Prepare store listings and screenshots

## Troubleshooting

### Common Issues

1. **"Module not found" errors**: Run `npm install` again
2. **Expo Go issues**: Make sure you're using the latest Expo Go app
3. **API connection errors**: Check `EXPO_PUBLIC_API_URL` in `.env`
4. **Build errors**: Run `eas build:configure` first

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Store Submission](https://docs.expo.dev/submit/introduction/)

