'use strict'
const path = require('path')
const config = require('./index')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const packageConfig = require('../package.json')

exports.assetsPath = function (_path) {
  const assetsSubDirectory = process.env.NODE_ENV === 'production'
    ? config.build.assetDirectory
    : config.dev.assetDirectory

  return path.posix.join(assetsSubDirectory, _path)
}

exports.cssLoaders = function (options) {
  options = options || {}

  const cssLoader = {
    loader: 'css-loader',
    options: {
      sourceMap: options.sourceMap
    }
  }

  const postcssLoader = {
    loader: 'postcss-loader',
    options: {
      sourceMap: options.sourceMap
    }
  }

  function getThemeJs() {
    let theme = {};
    if (packageConfig.theme && typeof(packageConfig.theme) === 'string') {
      let cfgPath = packageConfig.theme;
      // relative path
      if (cfgPath.charAt(0) === '.') {
        cfgPath = path.resolve(process.cwd(), cfgPath);
      }
      const getThemeConfig = require(cfgPath);
      theme = getThemeConfig();
    } else if (packageConfig.theme && typeof(packageConfig.theme) === 'object') {
      theme = packageConfig.theme;
    }

    return theme;
  }

  // generate loader string to be used with extract text plugin
  function generateLoaders(loader, loaderOptions) {
    const loaders = options.usePostCSS ? [cssLoader, postcssLoader] : [cssLoader]

    if (loader) {
      loaders.push({
        loader: loader + '-loader',
        options: Object.assign({}, loaderOptions, {
          sourceMap: options.sourceMap
        })
      })
    }

    // Extract CSS when that option is specified
    // (which is the case during production build)
    if (options.extract) {
      loaders.unshift(MiniCssExtractPlugin.loader);

      return loaders;
    } else {
      return ['style-loader'].concat(loaders)
    }
  }

  return {
    css: generateLoaders(false, {importLoaders: 1}),
    postcss: generateLoaders(),
    less: generateLoaders('less', {
      javascriptEnabled: true, modifyVars: getThemeJs(),
    }),
  }
}

// Generate loaders for standalone style files (outside of .vue)
exports.styleLoaders = function (options) {
  const output = []
  const loaders = exports.cssLoaders(options)

  for (const extension in loaders) {
    const loader = loaders[extension]
    output.push({
      test: new RegExp('\\.' + extension + '$'),
      use: loader
    })
  }

  return output
}

exports.createNotifierCallback = () => {
  const notifier = require('node-notifier')

  return (severity, errors) => {
    if (severity !== 'error') return

    const error = errors[0]
    const filename = error.file && error.file.split('!')
      .pop()

    notifier.notify({
      title: packageConfig.name,
      message: severity + ': ' + error.name,
      subtitle: filename || '',
      icon: path.join(__dirname, 'logo.png')
    })
  }
}
