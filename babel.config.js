module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: []  // Remove any tailwindcss-react-native plugin
    };
  };