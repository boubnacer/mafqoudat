/**
 * Silences chatty console output in production builds.
 *
 * The app carries ~130 console.log calls, and several of them log caught errors
 * whole. An axios error serialises its `config`, which includes the request
 * headers - so a failed request could print the user's bearer token straight
 * into the browser console. That is a more exposed place than the mobile app's
 * equivalent: reading another Android app's logcat needs adb or root, whereas
 * anyone can press F12 here.
 *
 * Same policy as the mobile app's Babel config (mobile/babel.config.js):
 * log/info/debug go, error and warn stay, because they are the only field
 * diagnostic signal either app has and no crash reporter is wired up.
 *
 * Done at runtime rather than stripped at build time on purpose. Create React
 * App compiles with `babelrc: false`, so a project Babel plugin is simply
 * ignored, and removing the calls properly would mean adopting craco or
 * ejecting - a build-system rewrite to solve a problem that a five-line
 * reassignment solves completely. The code stays in the bundle; the data does
 * not leave the machine.
 */
const silenceProductionLogs = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.debug = noop;
  console.trace = noop;
};

export default silenceProductionLogs;
