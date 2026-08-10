module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      // Release builds only. React Native does not strip console calls on its
      // own, so every console.log/warn/error in src/ was shipping to production
      // - they cost a bridge call each on Android and can leak request shapes
      // and user data into logcat, where any app with READ_LOGS (and anyone
      // with adb) can read them.
      //
      // Keyed on the `production` Babel env, which Metro sets when bundling for
      // release, so `npm start` and development/preview builds keep their logs.
      production: {
        // console.error and console.warn are kept: they are the only diagnostic
        // signal this app has in the field (there is no crash reporter wired
        // up), and dropping them would trade a real debugging channel for very
        // little - reading another app's logcat needs adb or root, since
        // READ_LOGS has been privileged since Android 4.1.
        plugins: [['transform-remove-console', { exclude: ['error', 'warn'] }]],
      },
    },
  };
};
