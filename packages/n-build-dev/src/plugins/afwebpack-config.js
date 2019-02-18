import getUserConfigPlugins from 'n-webpack/getUserConfigPlugins';
import {compatDirname} from 'umi-utils';
import {join, dirname} from 'path';
import {webpackHotDevClientPath} from 'n-webpack/react-dev-utils';

const plugins = getUserConfigPlugins();

function noop() {
    return true;
}

const excludes = ['entry', 'outputPath'];

export default function (api) {
    const {debug, cwd, config, paths} = api;

    console.error("config", config);
    // 把 n-webpack 的配置插件转化为 umi-build-dev 的
    api._registerConfig(() => {
        return plugins
            .filter(p => !excludes.includes(p.name))
            .map(({name, validate = noop}) => {
                return api => ({
                    name,
                    validate,
                    onChange(newConfig) {
                        try {
                            debug(
                                `Config ${name} changed to ${JSON.stringify(newConfig[name])}`,
                            );
                        } catch (e) {
                        }
                        if (name === 'proxy') {
                            global.g_umi_reloadProxy(newConfig[name]);
                        } else {
                            api.service.restart(`${name} changed`);
                        }
                    },
                });
            });
    });

    const reactDir = compatDirname(
        'react/package.json',
        cwd,
        dirname(require.resolve('react/package.json')),
    );
    const reactDOMDir = compatDirname(
        'react-dom/package.json',
        cwd,
        dirname(require.resolve('react-dom/package.json')),
    );
    api.chainWebpackConfig(webpackConfig => {
        webpackConfig.resolve.alias
        // .set('react', reactDir)
        // .set('react-dom', reactDOMDir)
            .set('@', paths.absSrcPath)
            .set('@tmp', paths.absTmpDirPath)
    });

    api.addVersionInfo([
        `react@${require(join(reactDir, 'package.json')).version} (${reactDir})`,
        `react-dom@${
            require(join(reactDOMDir, 'package.json')).version
            } (${reactDOMDir})`,
    ]);

    api.modifyAFWebpackOpts(memo => {
        const isDev = process.env.NODE_ENV === 'development';

        const entryScript = join(paths.appSrc, 'index.js');
        const setPublicPathFile = join(
            __dirname,
            '../../template/setPublicPath.js',
        );
        const setPublicPath =
            config.runtimePublicPath ||
            (config.exportStatic && config.exportStatic.dynamicRoot);
        const entry = isDev
            ? {
                umi: [
                    ...(process.env.HMR === 'none' ? [] : [webpackHotDevClientPath]),
                    ...(setPublicPath ? [setPublicPathFile] : []),
                    entryScript,
                ],
            }
            : {
                umi: [...(setPublicPath ? [setPublicPathFile] : []), entryScript],
            };

        const targets = {
            chrome: 49,
            firefox: 64,
            safari: 10,
            edge: 13,
            ios: 10,
            ...(config.targets || {}),
        };

        // Transform targets to browserslist for autoprefixer
        const browserslist =
            config.browserslist ||
            targets.browsers ||
            Object.keys(targets)
                .filter(key => {
                    return !['node', 'esmodules'].includes(key);
                })
                .map(key => {
                    return `${key} >= ${targets[key]}`;
                });

        return {
            ...memo,
            ...config,
            cwd,
            browserslist,
            entry,
            outputPath: paths.absOutputPath,
            disableDynamicImport: false,
            babel: config.babel || {
                presets: [
                    [
                        require.resolve('babel-preset-umi'),
                        {
                            targets,
                            env: {
                                useBuiltIns: 'entry',
                                ...(config.treeShaking ? {modules: false} : {}),
                            },
                        },
                    ],
                ],
            },
            define: {
                'process.env.BASE_URL': config.base || '/',
                __UMI_BIGFISH_COMPAT: process.env.BIGFISH_COMPAT,
                __UMI_HTML_SUFFIX: !!(
                    config.exportStatic &&
                    typeof config.exportStatic === 'object' &&
                    config.exportStatic.htmlSuffix
                ),
                ...(config.define || {}),
            },
            publicPath: isDev
                ? '/'
                : config.publicPath != null
                    ? config.publicPath
                    : '/',
        };
    });
}
