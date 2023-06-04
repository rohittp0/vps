const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");

const buildFolder = path.resolve(__dirname, "..", "./build");

module.exports = (env) => ({
    entry: {
        "bundle": path.resolve(__dirname, "..", "./src/index.tsx")
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)x?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            include: path.resolve(__dirname, "..", "./web")
                        }
                    },
                ],
            },
            {
                test: /\.(jpe?g|png|webp)$/i,
                use: [
                    {
                        loader: "responsive-loader",
                        options: {
                            adapter: require("responsive-loader/sharp"),
                            sizes: [320, 640, 960, 1200, 1800, 2400],
                            placeholder: true,
                            placeholderSize: 20,
                            disabled: env === "dev"
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: "style-loader",
                    },
                    {
                        loader: "css-loader",
                        options: {
                            importLoaders: 1,
                        }
                    }
                ]
            },
            {
                test: /\.(?:ico|gif)$/i,
                type: "asset/resource",
            },
            {
                test: /\.(woff(2)?|eot|ttf|otf|svg)$/,
                type: "asset/inline",
            },
        ],
    },
    output: {
        path: buildFolder,
        publicPath: "./",
        filename: "[name].js",
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "..", "public/index.html"),
            title: "Need Medi",
            favicon: path.resolve(__dirname, "..", "public/favicon.ico"),
        }),
        new Dotenv({path: path.resolve(__dirname, "..", `./.${env}.env`)})
    ],
    stats: false
})
;
