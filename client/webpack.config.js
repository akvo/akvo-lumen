var webpack = require('webpack');
var SystemBellPlugin = require('system-bell-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');


const entry = process.env.NODE_ENV === 'production' ?
  [
    "./src/index.jsx"
  ] : [
    'webpack-dev-server/client?http://0.0.0.0:3030', // WebpackDevServer host and port
    'webpack/hot/only-dev-server', // "only" prevents reload on syntax errors
    "./src/index.jsx"
  ];

const path = __dirname.substring(0, __dirname.lastIndexOf('/')) + '/backend/resources/org/akvo/dash/public/build'

module.exports = {
  entry: entry,
  devtool: 'source-map',
  output: {
    path: path,
    filename: "bundle.js",
    publicPath: 'build'
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders: ["react-hot", "babel-loader"]
      },
      {
        test: /\.scss$/,
        loader: "style-loader!css-loader!sass-loader"
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      }
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
