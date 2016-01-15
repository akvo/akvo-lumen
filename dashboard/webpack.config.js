 var webpack = require('webpack');

module.exports = {
    entry: [
    'webpack-dev-server/client?http://0.0.0.0:3000', // WebpackDevServer host and port
    'webpack/hot/only-dev-server', // "only" prevents reload on syntax errors
    "./index.jsx"
    ],
    output: {
        path: __dirname,
        filename: "bundle.js"
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
      new webpack.HotModuleReplacementPlugin()
    ]    
};