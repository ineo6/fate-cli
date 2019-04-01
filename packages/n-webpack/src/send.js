const debug = require('debug')('n-webpack:send');

export const DONE = 'DONE';
export const STARTING = 'STARTING';
export const RESTART = 'RESTART';

export default function send(message) {
  if (process.send) {
    debug(`send ${JSON.stringify(message)}`);
    process.send(message);
  }
}
