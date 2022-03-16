// eslint-disable-next-line @typescript-eslint/no-var-requires,no-undef
const slsw = require("serverless-webpack");
// eslint-disable-next-line @typescript-eslint/no-var-requires,no-undef
const nodeExternals = require("webpack-node-externals");

// eslint-disable-next-line no-undef
module.exports = {
    entry: slsw.lib.entries,
    mode: slsw.lib.webpack.isLocal ? "development" : "production",
    target: "node",
    devtool: "source-map",
    externals: [nodeExternals()],
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                options: {
                    rootMode: "upward"
                },
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                options: {
                    rootMode: "upward"
                },
            },
        ],
    },
};