var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');

const contentBase = __dirname.substring(0, __dirname.lastIndexOf('/')) + '/backend/resources/org/akvo/dash/public'

new WebpackDevServer(webpack(config), {
  contentBase: contentBase,
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
  proxy: {
    '/api/*': {
      target: 'http://localhost:3000',
      secure: false
    }
  }
}).listen(3030, 'localhost', function (err, result) {
  if (err) {
    console.log(err);
  }

  console.log('Listening at localhost:3030');
});
