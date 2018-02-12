const autoprefixer = require('autoprefixer');

const autoprefixerWithConfig = autoprefixer({
  browsers: [
    'Android >= 2',
    'Chrome >= 1',
    'ChromeAndroid >= 1',
    'Edge >= 1',
    'IE >= 10',
    'Safari >= 3',
    'Firefox >= 2',
    'FirefoxAndroid >= 2',
    'iOS >= 2',
    'Opera >= 12',
  ],
});

module.exports = {
  plugins: [
    autoprefixerWithConfig,
  ],
};
