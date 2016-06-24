module.exports = process.env.NODE_ENV === 'production' ?
  require('./Root.prod') : require('./Root.dev');
