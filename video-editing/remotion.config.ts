import { Config } from '@remotion/cli/config';

// Reuse the Chromium already installed for this container instead of
// letting Remotion download its own copy.
Config.setBrowserExecutable(
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
);
Config.setVideoImageFormat('jpeg');
