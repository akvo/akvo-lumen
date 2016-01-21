var webpack = require('webpack');

const entry = process.env.NODE_ENV === 'production' ?
  [
    "./index.jsx"
  ] : [
    'webpack-dev-server/client?http://0.0.0.0:3000', // WebpackDevServer host and port
    'webpack/hot/only-dev-server', // "only" prevents reload on syntax errors
    "./index.jsx"
  ];

module.exports = {
    entry: entry,
    output: {
        path: __dirname,
        filename: "bundle.js"
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
            }
        ]
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      })
    ]
};
