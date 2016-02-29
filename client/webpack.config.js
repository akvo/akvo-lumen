var webpack = require('webpack');
var SystemBellPlugin = require('system-bell-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');

const entry = process.env.NODE_ENV === 'production' ?
  [
    "./src/index.jsx"
  ] : [
    'webpack-dev-server/client?http://0.0.0.0:3030', // WebpackDevServer host and port
    'webpack/hot/only-dev-server', // "only" prevents reload on syntax errors
    "./src/index.jsx"
  ];

module.exports = {
  entry: entry,
  devtool: 'source-map',
  output: {
    path: __dirname,
    filename: "bundle.js",
    publicPath: '/'
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [

      {
        test: /\.jsx?$/,
        //exclude: /node_modules/,
        include: [
          path.join(__dirname, "node_modules/tus-js-client/"),
          path.join(__dirname, "src/"),
        ],
        loaders: ["react-hot", "babel-loader"]
      },
      {
        test: /\.scss$/,
        loader: "style-loader!css-loader!sass-loader"
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      },
      { test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192' }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new SystemBellPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ]
};
