/**
 * Crash reporting (Firebase Crashlytics).
 *
 * Required behind a safe require, the same pattern GradientHeading.js uses for
 * @react-native-masked-view/masked-view: this native module only exists in a
 * dev-client/preview/production build after `expo prebuild`, and Expo Go (this
 * app's `npm start` / `--go` flow) can never load it. A plain top-level
 * `import` throws immediately in Expo Go and would take the whole app down -
 * exactly the crash this module exists to catch. Reporting simply no-ops
 * there; production users are on real builds where the native module is
 * always linked.
 */

let crashlyticsModule = null;
try {
  // eslint-disable-next-line global-require
  crashlyticsModule = require('@react-native-firebase/crashlytics').default;
} catch (error) {
  crashlyticsModule = null;
}

// Debug/dev-client builds report too by default; keeping that off is what
// stops every local Metro reload/dev crash from polluting the Crashlytics
// dashboard the way babel.config.js already keeps console.log out of release
// builds (the mirror image of that: quiet in dev, verbose in the field).
export const initCrashReporting = () => {
  if (!crashlyticsModule) return;

  try {
    crashlyticsModule().setCrashlyticsCollectionEnabled(!__DEV__);
  } catch (error) {
    // Collection toggle failing is not worth surfacing - reporting just stays
    // whatever the default is.
  }

  // Mirrors Firebase's own documented pattern for catching JS errors that
  // don't go through a React render (event handlers, timers, rejected
  // promises surfaced as thrown errors) - ErrorBoundary below only ever sees
  // render-phase errors.
  const defaultHandler = global.ErrorUtils?.getGlobalHandler?.();
  global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
    recordError(error);
    defaultHandler?.(error, isFatal);
  });
};

export const recordError = (error) => {
  if (!crashlyticsModule) return;
  try {
    crashlyticsModule().recordError(error);
  } catch (reportingError) {
    // Never let a failed report throw - it would replace the real crash with
    // a different one.
  }
};
