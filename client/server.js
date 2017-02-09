/* eslint-disable */

var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: {
    rewrites: [
      { from: '^/s/.*$', to: '/assets/index-pub.html' },
      { from: '^.*$', to: '/assets/index.html' }
    ]
//    index: '/assets/index.html'
  },
  proxy: {
    '/api/**': {
      target: "http://t1.lumen.localhost:3000",
      secure: false
    },
    '/share/**': {
      target: "http://t1.lumen.localhost:3000",
      secure: false
    },
    '/env': {
      target: "http://t1.lumen.localhost:3000",
      secure: false
    }
  }
}).listen(3030, 'localhost', function (err, result) {
  if (err) {
    console.log(err);
  }

  console.log('Listening at localhost:3030');
});
