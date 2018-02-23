// This file configures the development web server
// which supports hot reloading and synchronized testing.

// Require Browsersync along with webpack and middleware for it
import browserSync from 'browser-sync';
// Required for react-router browserHistory
// see https://github.com/BrowserSync/browser-sync/issues/204#issuecomment-102623643
import history from 'connect-history-api-fallback';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import proxy from 'http-proxy-middleware';
import { chalkProcessing } from './chalkConfig';

import config from '../webpack.config.dev';

const proxyTargets = [
  {
    source: '/api/**',
    target: 'http://backend:3000',
  },
  {
    source: '/env',
    target: 'http://backend:3000',
  },
  {
    source: '/healthz',
    target: 'http://backend:3000',
  },
  {
    source: '/maps/**',
    target: 'http://windshaft:4000',
    pathRewrite: {
      '/maps': '',
    },
  },
  {
    source: '/share/**',
    target: 'http://backend:3000',
  },
  {
    source: '/verify/**',
    target: 'http://backend:3000',
  },
];
const bundler = webpack(config);

console.log(chalkProcessing('Starting dev server...'));

// Run Browsersync and use middleware for Hot Module Replacement
browserSync({
  port: 3030,
  ui: false,
  open: false,
  server: {
    baseDir: 'src',

    middleware: [

      history({
        rewrites: [
          { from: '^/s/.*$', to: '/../dist/index-pub.html' },
        ],
      }),

      ...proxyTargets.reduce((acc, { source, ...rest }) => acc.concat(
        proxy(source, {
          secure: false,
          ...rest,
        })
      ), []),

      webpackDevMiddleware(bundler, {
        // Dev middleware can't access config, so we provide publicPath
        publicPath: config.output.publicPath,

        // These settings suppress noisy webpack output so only errors are displayed to the console.
        noInfo: true,
        quiet: false,
        stats: {
          assets: false,
          colors: true,
          version: false,
          hash: false,
          timings: false,
          chunks: false,
          chunkModules: false,
        },
        // for other settings see
        // https://webpack.js.org/guides/development/#using-webpack-dev-middleware
      }),

      // bundler should be the same as above
      webpackHotMiddleware(bundler),
    ],
  },

  // no need to watch '*.js' here, webpack will take care of it for us,
  // including full page reloads if HMR won't work
  files: [
    'src/*.html',
    'package.json',
  ],
});
