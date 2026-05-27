module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // RN 0.85 uses Hermes match-expression syntax; this plugin lets Babel parse it.
    plugins: ['babel-plugin-syntax-hermes-parser'],
  };
};
