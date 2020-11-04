module.exports = {
  clearMocks: true,
  testPathIgnorePatterns: ['/node_modules/', '/e2e-test/', '/mocks/'],
  testMatch: ['**/test/**/*.@(js|jsx)'],
  setupFiles: ['<rootDir>/__mocks__/setup.js'],

  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMocks.js',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
};
