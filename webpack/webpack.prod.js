const WebpackPwaManifest = require("webpack-pwa-manifest");
const CopyPlugin = require("copy-webpack-plugin");

const {InjectManifest} = require("workbox-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
    mode: "production",
    devtool: "source-map",
    plugins: [
        new CleanWebpackPlugin(),
        new WebpackPwaManifest({
            name: "Need Medi",
            short_name: "Need Medi",
            description: "Facebook for doctors.",
            background_color: "#FFFFFF",
            orientation: "any",
            theme_color: "#3E64FF",
            publicPath: "/",
            "gcm_sender_id": "569002618626",
            icons: [
                {
                    src: path.resolve(__dirname, "..", "public/android-chrome-512x512.png"),
                    sizes: [96, 128, 192, 256, 384, 512]
                },
                {
                    src: path.resolve(__dirname, "..", "public/apple-touch-icon.png"),
                    sizes: [96, 128, 192, 256, 384, 512],
                    purpose: "maskable"
                }
            ]
        }),
        new CopyPlugin({
            patterns: [
                {from: path.resolve(__dirname, "..", "public/robots.txt")},
                {
                    from: path.resolve(__dirname, "..", "public/.well-known/"),
                    to: path.resolve(buildFolder, ".well-known")
                }
            ]
        }),
        new InjectManifest({
            swSrc: path.resolve(__dirname, "..", "src/sw.ts"),
            exclude: [/\.map$/, /^manifest.*\.js(?:on)?$/, /\.(jpe?g|png|webp)$/i]
        })
    ]
};
