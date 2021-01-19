"use strict";

const path = require("path");
const fs = require("fs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const distPath = path.resolve(__dirname, "dist");

/**@type {import('webpack').Configuration}*/
const config = {
  target: "node", // vscode extensions run in a Node.js-context https://webpack.js.org/configuration/node/

  entry: "./src/extension.ts", // the entry point of this extension, https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), https://webpack.js.org/configuration/output/
    path: distPath,
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    // support reading TypeScript and JavaScript files, https://github.com/TypeStrong/ts-loader
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  // Enable cloud-mta usage via auto-download, see https://github.com/SAP/cloud-mta#packaging-with-webpack
  node: {
    __dirname: false,
  },
  plugins: [
    // Enable cloud-mta usage via auto-download, see https://github.com/SAP/cloud-mta#packaging-with-webpack
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(require.resolve("mta-local"), "..", "bin"),
          to: path.resolve(distPath, "bin"),
        },
      ],
    }),
    function (compiler) {
      compiler.hooks.done.tap("ExecuteChmodOnBinMta", () => {
        fs.chmodSync(path.resolve(distPath, "bin", "mta"), "755");
      });
    },
  ],
};
module.exports = config;
