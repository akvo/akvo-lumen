/* eslint-disable global-require */
import polyfill from './polyfill';

polyfill(() => { 
  require('./app');
});
