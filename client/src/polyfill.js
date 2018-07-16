/* eslint-disable global-require */

import 'raf/polyfill';

const polyfill = (callback) => {
  console.log('polyfilling');
  new Promise((resolve) => {
    if (!(window.Map && window.Set && window.WeakMap && window.WeakSet)) {
      require.ensure([], () => {
        require('core-js/es6/map');
        require('core-js/es6/set');
        resolve();
      });
      return;
    }
    resolve();
  })
  .then(() => {
    if (!window.Intl) {
      return new Promise((resolve) => {
        require.ensure([], () => {
          require('intl');
          resolve();
        });
      });
    }
    return Promise.resolve();
  })
  .then(() => {
    if (!(Object.assign && Object.is && Object.setPrototypeOf)) {
      return new Promise((resolve) => {
        require.ensure([], () => {
          require('core-js/es6/object');
          require('core-js/modules/es7.object.values');
          resolve();
        });
      });
    }
    return null;
  })
  .then(() => {
    if (!(Array.prototype &&
      Array.prototype.copyWithin &&
      Array.prototype.fill &&
      Array.prototype.find &&
      Array.prototype.findIndex &&
      Array.prototype.keys &&
      Array.prototype.entries &&
      Array.prototype.values &&
      Array.from &&
      Array.of
    )) {
      return new Promise((resolve) => {
        require.ensure([], () => {
          require('core-js/es6/array');
          require('core-js/modules/es7.array.includes');
          resolve();
        });
      });
    }
    return Promise.resolve();
  })
  .then(() => {
    if (!(Number.isFinite &&
      Number.isInteger &&
      Number.isSafeInteger &&
      Number.isNaN &&
      Number.parseInt &&
      Number.parseFloat &&
      Number.isInteger(Number.MAX_SAFE_INTEGER) &&
      Number.isInteger(Number.MIN_SAFE_INTEGER) &&
      Number.isFinite(Number.EPSILON)
    )) {
      return new Promise((resolve) => {
        require.ensure([], () => {
          require('core-js/es6/number');
          resolve();
        });
      });
    }
    return null;
  })
  .then(() => {
    console.log('done polyfilling');
  })
  .then(callback);
};

export default polyfill;
