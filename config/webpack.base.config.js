'use strict';
const path = require('path');
const fs = require('fs');
const webpack = require('webpack')
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');

const utils = require('./utils');
const config = require('../config');

const cwd = process.cwd();

function resolve(dir) {
    return path.join(cwd, dir)
}

const createLintingRule = () => ({
    test: /\.(js|jsx)$/,
    loader: 'eslint-loader',
    enforce: 'pre',
    include: [resolve('app')],
    options: {
        formatter: require('eslint-formatter-friendly'),
        emitWarning: !config.dev.showEslintErrorsInOverlay
    }
});

const appChunk = ['routes', 'Home', 'User', 'Example'];    // <-- 不会被异步的文件夹，即是会被加载在主模块中的
const views = resolve('/app/views');

function addLazyBundles(dir, chunk) {
    const result = [];

    const items = fs.readdirSync(dir) || [];

    items.forEach(function (item) {

        const tempPath = path.join(dir, item);

        if (item.indexOf('.') < 0 && chunk.indexOf(item) < 0) {
            const stats = fs.statSync(tempPath);

            if (stats.isDirectory()) {
                result.push({
                    test: new RegExp('app\/views\/' + item + '\/index\.(js|jsx)$'),
                    use: [{
                        loader: 'bundle-loader?lazy&name=' + item.toLowerCase(),
                    }, {
                        loader: 'babel-loader'
                    }],
                    exclude: [path.join(cwd, 'node_modules')],
                })
            }
        }
    });
    return result
}

const bundleLoaders = addLazyBundles(views, appChunk);

module.exports = {
    context: path.resolve(cwd, '../'),
    entry: {
        app: './app/index.js',
    },
    output: {
        path: config.build.output,
        filename: '[name].js',
        chunkFilename: '[name].chunk.js',
        publicPath: process.env.NODE_ENV === 'production'
            ? config.build.assetsPublicPath
            : config.dev.assetsPublicPath
    },
    resolve: {
        extensions: ['.js', '.json', '.jsx'],
        alias: {
            component: '@unovo/component',
            businessComponent: '@unovo/business-component',
            'antd': '@unovo/antd',
            'react-router': '@unovo/react-router',
            'rc-select': '@unovo/rc-select',
            'rc-menu': '@unovo/rc-menu',
            'rc-dialog': '@unovo/rc-dialog',
            'upms': resolve('app'),
            'dva': 'dva-react-router-3'
        }
    },
    module: {
        // 多个loader是有顺序要求的，从右往左写，因为转换的时候是从右往左转换的
        rules: [
            ...((config.dev.useEslint && process.env.NODE_ENV !== 'production') ? [createLintingRule()] : []),
            {
                test: /\.(js|jsx)$/,
                include: [
                    resolve('app'),
                ],
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    name: utils.assetsPath('img/[name].[hash:7].[ext]')
                }
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
                }
            }
        ]
    },
    optimization: { //webpack4.x的最新优化配置项，用于提取公共代码

        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                commons: {
                    name: 'commons',
                    minChunks: 2,
                    priority: 5,
                    reuseExistingChunk: true // 可设置是否重用该chunk（查看源码没有发现默认值）
                },
                //设置多个缓存规则
                vendor: {
                    test: /node_modules/,
                    chunks: 'initial',
                    name: 'vendor',
                    priority: 10,
                    enforce: true
                },
                styles: {
                    name: 'styles',
                    test: /\.css$/,
                    enforce: true,
                    priority: 20,
                }
            }
        }
    },
    plugins: [
        new LodashModuleReplacementPlugin({
            'paths': true,
            'collections': true,
            'shorthands': true
        }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new webpack.ProvidePlugin({
            // 'Dict': [resolve('./app/config/dict.js'), 'default'],
            // common: [resolve('./app/config'), 'default'], // todo 兼容旧版，😳待移除
            request: [resolve('./app/utils/request'), 'default']
        }),
        // FIX ISSUE: https://github.com/webpack-contrib/mini-css-extract-plugin/issues/250
        new FilterWarningsPlugin({
            exclude: /Conflicting order between:/,
        }),
    ]
};
