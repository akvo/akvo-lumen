const polyfill = (callback) => {
  const browserSupported = Boolean(
    'Map' in window &&
    'fetch' in window &&
    'assign' in Object &&
    'Intl' in window &&
    'includes' in Array.prototype &&
    'filter' in Array.prototype
  );

  if (browserSupported) {
    callback();
  } else {
    /*
      Load polyfills for older browsers.

      We could load the whole of core-js/shim here (and perhaps we should if we find we
      need to come back here and add stuff frequently) but it makes the polyfill bundle
      about 40% larger. So let's try this and see if it's "enough".
    */


    /* eslint-disable global-require */
    require.ensure([], () => {
      require('core-js/es6/array');
      require('core-js/es6/object');
      require('core-js/es6/number');
      require('core-js/es7/map');
      require('core-js/modules/es7.object.values');
      require('core-js/modules/es7.array.includes');
      require('intl');
      require('intl/locale-data/jsonp/en.js');
      require('intl/locale-data/jsonp/fr.js');
      require('intl/locale-data/jsonp/es.js');
      /* eslint-enable-global-require */

      callback();
    });
  }
};

export default polyfill;
