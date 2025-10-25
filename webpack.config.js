const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/renderer/index.tsx',
    target: 'web', // Changed from electron-renderer to web for Tauri
    context: path.resolve(__dirname),
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.renderer.json'
            }
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          type: 'asset/resource',
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src/renderer'),
      },
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/index.html',
        filename: 'index.html',
      }),
      new webpack.DefinePlugin({
        'global': 'globalThis',
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      }),
    ],
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'dist'),
      },
      port: 3000,
      hot: true, // Enable hot reload for Tauri development
      historyApiFallback: true,
      host: 'localhost',
      allowedHosts: 'all',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      // Write files to disk for Tauri to serve
      devMiddleware: {
        writeToDisk: true,
      },
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
  };
};