var path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

var pathToPhaser = path.join(__dirname, "/node_modules/phaser/");
var phaser = path.join(pathToPhaser, "dist/phaser.js");

let config = {
  entry: "./src/game.ts",
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "bundle.js"
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: "ts-loader", exclude: "/node_modules/" },
      { test: /phaser\.js$/, loader: "expose-loader?Phaser" }
    ]
  },
  devServer: {
    contentBase: path.resolve(__dirname, "./public/"),
    host: "127.0.0.1",
    port: 8080,
    open: true
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      phaser: phaser,
    }
  },
  plugins: []
};

config.plugins.push(
  new HtmlWebpackPlugin({
    inject: true,
    template: 'src/index.html',
    // favicon: helpers.root('/src/favicon.ico'),
    chunks: [`main`],
    filename: 'index.html',
    minify: {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true
    }
  }),
);

let cwp = [
  {
    from: 'src/styles/',
    to: './styles'
  },
  {
    from: 'src/assets/',
    to: './assets'
  },
];
config.plugins.push(new CopyWebpackPlugin(cwp));

module.exports = config;
