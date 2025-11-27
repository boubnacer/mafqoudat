export default {
  expo: {
    name: "Mafqoudat",
    slug: "mafqoudat",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mafqoudat.app",
      buildNumber: "1",
      infoPlist: {
        NSPhotoLibraryUsageDescription: "This app needs access to your photo library to upload images for lost and found items.",
        NSCameraUsageDescription: "This app needs access to your camera to take photos for lost and found items.",
        NSLocationWhenInUseUsageDescription: "This app uses your location to help you find lost items in your area."
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.mafqoudat.app",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "The app accesses your photos to let you share them for lost and found items."
        }
      ]
    ],
    extra: {
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "your-project-id-here"
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://mafqoudat-production.up.railway.app"
    }
  }
};

