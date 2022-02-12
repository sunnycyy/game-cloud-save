import * as slsw from "serverless-webpack";
import * as nodeExternals from "webpack-node-externals";

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
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: "babel-loader",
            },
        ],
    },
};