/* eslint-disable */

var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');

new WebpackDevServer(webpack(config), {
  hot: true,
  public: "localhost:3030",
  watchOptions: {
    ignored: "/lumen/node_modules"
  },
  publicPath: config.output.publicPath,
  disableHostCheck: true,
  proxy: {
    '/api/**': {
      target: "http://backend:3000",
      secure: false
    },
    '/share/**': {
      target: "http://backend:3000",
      secure: false
    },
    '/verify/**': {
      target: "http://backend:3000",
      secure: false
      },
    '/maps/**': {
      target: "http://windshaft:4000",
      secure: false,
      pathRewrite: {
        '/maps' : ''
      }
      },
    '/env': {
      target: "http://backend:3000",
      secure: false
    }
  },
  historyApiFallback: {
    rewrites: [
      { from: '^/favicon.ico$', to: 'favicon.ico' },
      { from: '^/s/.*$', to: '/assets/index-pub.html' },
      { from: '^/viewer/index.html', to: 'dev/viewer/index.html' },
      { from: '^/viewer/leaflet.css', to: 'dev/viewer/leaflet.css' },
      { from: '^/viewer/leaflet.js', to: 'dev/viewer/leaflet.js' },
      { from: '^/viewer/leaflet.utfgrid.js', to: 'dev/viewer/leaflet.utfgrid.js' },
      { from: '^/viewer/samples.txt', to: 'dev/viewer/samples.txt' },
      { from: '^.*$', to: '/assets/index.html' }
    ]
  },
}).listen(3030, '0.0.0.0', function (err, result) {
  if (err) {
    console.log(err);
  }

  console.log('Listening at t1.lumen.localhost:3030');
});
