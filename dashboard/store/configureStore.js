/*
 * See https://github.com/gaearon/redux-devtools
 */
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./configureStore.prod');
} else {
  module.exports = require('./configureStore.dev');
}
