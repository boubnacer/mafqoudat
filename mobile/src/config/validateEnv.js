/**
 * Startup env-var check. Never throws - just warns loudly so a missing mobile/.env
 * shows up immediately in the Metro log instead of a feature silently misbehaving
 * (or, before this file existed, the whole app crashing at first render - see
 * useGoogleIdTokenAuth in utils/googleAuth.js for why that could happen).
 * Only lists vars with no in-source fallback; EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID /
 * EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID fall back to the web client ID (config/api.js)
 * so their absence degrades a build target, not the app itself, and doesn't belong here.
 */
const REQUIRED_VARS = [
  { key: 'EXPO_PUBLIC_API_URL', feature: 'all API calls (posts, auth, profile, promotions...)' },
  { key: 'EXPO_PUBLIC_WEB_BASE_URL', feature: 'Settings screen Privacy Policy / Terms links' },
  { key: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', feature: 'Google sign-in' },
];

export const validateEnv = () => {
  const missing = REQUIRED_VARS.filter(({ key }) => !process.env[key]);
  if (missing.length === 0) return;

  const lines = missing.map(({ key, feature }) => `  - ${key}  (breaks: ${feature})`);
  console.warn(
    [
      '',
      '⚠️  Missing environment variables - the affected features will be disabled, not crash:',
      ...lines,
      '',
      'Copy mobile/.env.example to mobile/.env, fill in the values, and restart the dev',
      'server (`npm start` for Expo Go, `npm run start:dev` for a development build).',
      '',
    ].join('\n')
  );
};
