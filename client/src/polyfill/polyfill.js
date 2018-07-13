/* eslint-disable global-require */

import 'raf/polyfill';

const polyfill = (callback) => {
  const toBePolyfilled = [];

  if (!(window.Map && window.Set && window.WeakMap && window.WeakSet)) {
    toBePolyfilled.push('core-js/es6/map');
    toBePolyfilled.push('core-js/es6/set');
  }

  if (!(window.Intl)) {
    toBePolyfilled.push('intl');
  }

  if (!(Object.assign && Object.is && Object.setPrototypeOf)) {
    toBePolyfilled.push('core-js/es6/object');
    toBePolyfilled.push('core-js/modules/es7.object.values');
  }

  if (!(Array.prototype &&
    Array.prototype.copyWithin &&
    Array.prototype.fill &&
    Array.prototype.find &&
    Array.prototype.findIndex &&
    Array.prototype.keys &&
    Array.prototype.entries &&
    Array.prototype.values &&
    Array.from &&
    Array.of)
  ) {
    toBePolyfilled.push('core-js/es6/array');
    toBePolyfilled.push('core-js/modules/es7.array.includes');
  }

  if (!(Number.isFinite &&
    Number.isInteger &&
    Number.isSafeInteger &&
    Number.isNaN &&
    Number.parseInt &&
    Number.parseFloat &&
    Number.isInteger(Number.MAX_SAFE_INTEGER) &&
    Number.isInteger(Number.MIN_SAFE_INTEGER) &&
    Number.isFinite(Number.EPSILON))
  ) {
    toBePolyfilled.push('core-js/es6/number');
  }

  if (!toBePolyfilled.length) {
    callback();
  } else {
    require.ensure([], () => {
      toBePolyfilled.forEach(require);
      callback();
    });
  }
};

export default polyfill;
