import assert from 'assert';
import {join} from 'path';

export default function (api) {
    const {config, paths} = api.service;

    const html = {
        filename: join(paths.absOutputPath, '/index.html'),
        template: paths.defaultDocumentPath,
        env: process.env.NODE_ENV,
        minify: {    // 压缩HTML文件
            removeComments: true,    //移除HTML中的注释
            collapseWhitespace: false    //删除空白符与换行符
        },
        // necessary to consistently work with multiple chunks via CommonsChunkPlugin
        chunksSortMode: 'dependency'
    };

    api._registerConfig(() => {
        return () => {
            return {
                name: 'html',
                validate(val) {
                    assert(
                        typeof val === 'object',
                        `html should be Object, but got ${val}`,
                    );
                },
                onChange() {
                    api.restart();
                },
            };
        };
    });

    api.modifyDefaultConfig(memo => {
        return {
            ...memo,
            html: {...html, ...config.html}
        }
    });
}
