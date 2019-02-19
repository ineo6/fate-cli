import yParser from 'yargs-parser';
import buildDevOpts from '../buildDevOpts';

process.env.NODE_ENV = 'production';

const args = yParser(process.argv.slice(2));
const Service = require('n-build-dev/lib/Service').default;
new Service(buildDevOpts(args)).run('build', args);
