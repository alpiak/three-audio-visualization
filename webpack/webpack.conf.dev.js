/**
 * Created by qhyang on 2017/11/30.
 */

'use strict';

const HtmlWebpack = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const rootDir = path.resolve(__dirname, '..');

module.exports = {
    devServer: {
        contentBase: path.resolve(rootDir, 'dist')
    },
    devtool: 'source-map',
    entry: {
        main: [ path.resolve(rootDir, 'demo', 'index') ]
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(rootDir, 'build')
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
                loader: 'url-loader?limit=8192'
            },
            {
                test: /\.png$/,
                exclude: /node_modules/,
                loader: 'url-loader?limit=8192'
            },
            {
                test: /\.json$/,
                include: [ path.resolve(rootDir, 'src') ],
                loader: 'json-loader'
            }
        ]
    },
    plugins: [
        new HtmlWebpack({
            filename: 'index.html',
            inject: 'body',
            template: path.resolve(rootDir, 'demo', 'index.html'),
            chunks: [ 'main' ]
        })
    ],
    resolve: {
        extensions: [ '.js' ]
    }
};
