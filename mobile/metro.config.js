const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prevent Metro from bundling server-side code
config.resolver.blockList = [
  // Block server directory
  /.*\/server\/.*/,
  // Block any imports that try to access server code
  /.*\.\.\/\.\.\/server\/.*/,
  /.*\/mafqoudat\/server\/.*/,
];

// Additional resolver options to prevent server imports
config.resolver.alias = {
  // Ensure we don't accidentally resolve to server files
  server: false,
};

module.exports = config;
