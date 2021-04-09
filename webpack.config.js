
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const WebpackShellPlugin = require('webpack-shell-plugin');

const { NODE_ENV } = process.env;

module.exports = {
  entry: './index.ts',
  mode: NODE_ENV,
  devtool: 'source-map',
  target: 'node',
  watch: NODE_ENV === 'development',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'this',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  externals: [nodeExternals()], 
  plugins: NODE_ENV === 'development' ? [  
    new WebpackShellPlugin({onBuildEnd: ['npm run debug:start']}) 
  ] : []
};