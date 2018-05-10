/**
 * Created by qhyang on 2018/2/26.
 */

'use strict';

const path = require('path');

const HtmlWebpack = require('html-webpack-plugin'),
    webpack = require('webpack'),
    UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const rootDir = path.resolve(__dirname, '..');

module.exports = {
    entry: {
        main: [ path.resolve(rootDir, 'src', 'ThreeAudioVisualization.js') ]
    },
    output: {
        filename: 'ThreeAudioVisualization.js',
        path: path.resolve(rootDir, 'dist'),
        libraryTarget: 'commonjs2'
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                include: [
                    path.resolve(rootDir, 'src', 'vendors', 'physijs', 'physijs_worker.js'),
                    path.resolve(rootDir, 'node_modules', 'ammo.js')
                ],
                loader: 'url-loader'
            },
            {
                test: /\.png$/,
                exclude: /node_modules/,
                loader: 'url-loader'
            },
            {
                test: /\.json$/,
                include: [ path.resolve(rootDir, 'src') ],
                loader: 'json-loader'
            }
        ]
    },
    plugins: [
        new UglifyJSPlugin({
            uglifyOptions: {
                compress: false
            }
        })
    ],
    resolve: {
        extensions: [ '.js' ]
    }
};
