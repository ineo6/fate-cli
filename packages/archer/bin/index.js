#!/usr/bin/env node

const resolveCwd = require('resolve-cwd');

const localCLI = resolveCwd.silent('n/bin/archer');
if (localCLI && localCLI !== __filename) {
    const debug = require('debug')('n');
    debug('Using local install of n');
    require(localCLI);
} else {
    require('../lib/cli');
}
