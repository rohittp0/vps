module.exports = {
    mode: "development",
    devtool: "eval-source-map",
    devServer: {
        hot: true,
        open: false,
        port: 3000,
        historyApiFallback: true,
        host: "0.0.0.0"
    }
};
