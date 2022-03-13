const ForkTsCheckerWebpackPlugin = require( 'fork-ts-checker-webpack-plugin' );

module.exports = {
    entry: './src/scripts/global/main.ts',
    module: {
        // Use `ts-loader` on any file that ends in '.ts'
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    // Bundle '.ts' files as well as '.js' files.
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: `${process.cwd()}/src/dist`,
    },
    devtool: 'source-map',
    mode: 'production',
    plugins: [
        new ForkTsCheckerWebpackPlugin(), // run TSC on a separate thread
    ]
};