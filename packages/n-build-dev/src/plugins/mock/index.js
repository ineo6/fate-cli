import signale from 'signale';
import { isPlainObject } from 'lodash';
import assert from 'assert';
import createMockMiddleware from './createMockMiddleware';

export default function(api) {
  let errors = [];

  api._registerConfig(() => {
    return api => {
      return {
        name: 'mock',
        validate(val) {
          assert(
            isPlainObject(val),
            `Configure item mock should be Plain Object, but got ${val}.`,
          );
        },
        onChange() {
          api.service.restart(/* why */ 'Config mock Changed');
        },
      };
    };
  });

  api._beforeServerWithApp(({ app }) => {
    if (process.env.MOCK !== 'none' && process.env.HTTP_MOCK !== 'none') {
      const beforeMiddlewares = api.applyPlugins('addMiddlewareBeforeMock', {
        initialValue: [],
      });
      const afterMiddlewares = api.applyPlugins('addMiddlewareAfterMock', {
        initialValue: [],
      });

      beforeMiddlewares.forEach(m => app.use(m));
      app.use(createMockMiddleware(api, errors));
      afterMiddlewares.forEach(m => app.use(m));
    }
  });

  api.onDevCompileDone(() => {
    if (errors.length) {
      signale.error(`Mock file parse failed`);
      errors.forEach(e => {
        console.error(e.message);
      });
    }
  });
}
